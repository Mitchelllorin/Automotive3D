/**
 * VehicleScene – the main Three.js canvas that hosts the active assembly,
 * lighting, camera controls, grid, and the explode/teardown controls.
 *
 * The model is whatever the active assembly in the registry declares, so this
 * scene stays the same as more assemblies (the rest of the vehicle) are added.
 * Orbit / zoom / pan work with both mouse and touch, for Windows and Android.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  Environment,
  Lightformer,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import useAppStore from '../../store/appStore';
import { getAssembly } from '../../assemblies/registry';
import { getEngine, availableEngines } from '../../data/engines';
import SceneLogo from './SceneLogo';
import { explodeState, ease } from '../../lib/explodeState';
import { focusState } from '../../lib/focusState';
import { advanceSim, simState } from '../../lib/simState';
import { failureState, clearFailures } from '../../lib/failureState';
import { assessEngine, FUELS } from '../../lib/engineStress';
import { ENVIRONMENTS } from '../../lib/dyno';
import { COMPONENTS } from '../../data/components';
import { SUBSYSTEMS } from '../../data/subsystems';
import ArenaStage from './ArenaStage';
import { RIVALS } from '../../lib/battle';
import { GeomContext, engineGeom } from '../../lib/engineInstance';

// Phones/tablets get a lighter render pipeline so the 3D stays smooth: capped
// pixel ratio and cheaper ambient occlusion instead of full-res 2× + medium AO.
const IS_TOUCH =
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

/**
 * Self-contained studio environment built from Lightformers (no network HDRI).
 * This is what makes the metal read as metal — it gives the standard materials
 * something to reflect. A soft key directional light adds the cast shadow.
 */
function StudioRig() {
  return (
    <>
      {/* Soft sky/ground fill so shadowed cast surfaces don't go black */}
      <hemisphereLight args={['#dfe9ff', '#20160f', 0.45]} />
      <ambientLight intensity={0.12} />
      {/* Hard key for the cast shadow */}
      <directionalLight
        position={[7, 11, 6]}
        intensity={2.0}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Cool back-rim to separate the engine from the dark background */}
      <directionalLight position={[-8, 5, -6]} intensity={0.8} color="#bcd4ff" />

      {/* Image-based reflections — what makes the metal read as metal. A studio
          full of softboxes the chrome and machined faces can mirror. */}
      <Environment resolution={512} frames={1}>
        {/* Overhead softbox bank (three strips → richer streak reflections) */}
        {[-3.2, 0, 3.2].map((x) => (
          <Lightformer key={x} form="rect" intensity={4} position={[x, 7, 1]} rotation={[Math.PI / 2, 0, 0]} scale={[2.4, 9, 1]} />
        ))}
        {/* Warm key from front-right */}
        <Lightformer form="rect" intensity={3} color="#fff0db" position={[7, 3.5, 6]} rotation={[0, -Math.PI / 4, 0]} scale={[7, 9, 1]} />
        {/* Cool rim from back-left */}
        <Lightformer form="rect" intensity={2.4} color="#cfe3ff" position={[-8, 4.5, -5]} rotation={[0, Math.PI / 3, 0]} scale={[7, 9, 1]} />
        {/* Side wrap fills */}
        <Lightformer form="rect" intensity={1.4} position={[0, 1, 9]} rotation={[0, 0, 0]} scale={[10, 6, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[4, 6, -3]} scale={[3, 3, 1]} />
        {/* Low ground bounce */}
        <Lightformer form="rect" intensity={0.8} position={[0, -4, 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
      </Environment>
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#636e72" wireframe />
    </mesh>
  );
}

/** Eases the shared explode factor toward the store's target every frame. */
function ExplodeDriver() {
  const target = useAppStore((s) => s.explodeFactor);
  useFrame((_, dt) => {
    explodeState.factor = ease(explodeState.factor, target, dt);
  });
  return null;
}

/**
 * Cross-section clipping — slices the +Z half of the engine away. The plane
 * tracks the focused part's depth, so selecting a component slides the section
 * to cut right through it; with nothing selected it sits just ahead of centre.
 */
function CutawayController() {
  const { gl } = useThree();
  const cutaway = useAppStore((s) => s.cutaway);
  // Normal points -Z, so everything with z greater than `constant` is removed.
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.18));
  useEffect(() => {
    gl.localClippingEnabled = true;
    gl.clippingPlanes = cutaway ? [planeRef.current] : [];
    return () => {
      gl.clippingPlanes = [];
    };
  }, [gl, cutaway]);
  useFrame((_, dt) => {
    if (!cutaway) return;
    const targetZ = focusState.active ? focusState.point.z : 0.18;
    const p = planeRef.current;
    p.constant = ease(p.constant, targetZ, dt, 5);
  });
  return null;
}

/**
 * Resolves the focus anchor each frame. A selected part writes focusState.point
 * itself; a selected system instead has its parts accumulate a centroid here,
 * which we average into `point`. With nothing focused, clear it. Runs after the
 * parts (mounted earlier), so it sees the full accumulation, then resets it.
 */
function FocusDriver() {
  const selectedComponent = useAppStore((s) => s.selectedComponent);
  const selectedSubsystem = useAppStore((s) => s.selectedSubsystem);
  useFrame(() => {
    if (selectedComponent) {
      // The selected <Part> already published point + active this frame.
    } else if (selectedSubsystem && focusState._count > 0) {
      focusState.point.copy(focusState._sum).divideScalar(focusState._count);
      focusState.active = true;
    } else {
      focusState.active = false;
    }
    focusState._sum.set(0, 0, 0);
    focusState._count = 0;
  });
  return null;
}

/** Advances the engine simulation (crank angle / RPM) every frame. */
function SimDriver() {
  const running = useAppStore((s) => s.engineRunning);
  const targetRpm = useAppStore((s) => s.targetRpm);
  const timeScale = useAppStore((s) => s.timeScale);
  const arenaActive = useAppStore((s) => s.arena.active);
  useFrame((_, dt) => {
    if (arenaActive) return; // the Arena owns the sim while a duel is staged
    advanceSim(Math.min(dt, 0.05), running ? targetRpm : 0, timeScale);
  });
  return null;
}

/**
 * Runs F.U.S.E. against the live build + rpm + conditions a few times a second
 * and publishes per-system severities to failureState, which the 3D failure
 * effects read. When the engine is off everything eases back to healthy.
 */
function FailureDriver() {
  const partVariants = useAppStore((s) => s.partVariants);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const running = useAppStore((s) => s.engineRunning);
  const setEngineRunning = useAppStore((s) => s.setEngineRunning);
  const { envIdx, fuelIdx, load } = useAppStore((s) => s.fuseConditions);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.12) return; // ~8 Hz is plenty for a gauge
    acc.current = 0;
    if (!running && simState.rpm < 1) {
      clearFailures();
      return;
    }
    const env = ENVIRONMENTS[envIdx] ?? ENVIRONMENTS[0];
    const conditions = {
      ambientF: env.airTempF,
      altitudeFt: env.altitudeFt,
      octane: FUELS[fuelIdx]?.octane ?? 91,
      loadFraction: load,
    };
    const { results, worst } = assessEngine(partVariants, simState.rpm, conditions, engine);
    const sev = (id) => results.find((r) => r.id === id)?.result.severity ?? 0;
    const mode = (id) => results.find((r) => r.id === id)?.result.name ?? '';
    failureState.valvetrain = sev('valvetrain');
    failureState.pistons = sev('pistons');
    failureState.cooling = sev('cooling');
    failureState.bottom_end = sev('bottom_end');
    failureState.worst = worst;
    failureState.float = failureState.valvetrain >= 1;
    failureState.detonation = mode('pistons').startsWith('Detonation');
    failureState.holed = mode('pistons').startsWith('Holed');
    failureState.overheat = failureState.cooling >= 1;
    failureState.boilover = mode('cooling').startsWith('Blown');
    failureState.seized = failureState.bottom_end >= 2;
    // A thrown rod stops the engine dead — kill it so it can't keep spinning.
    if (failureState.seized && running) setEngineRunning(false);
  });
  return null;
}

/** Listens to cameraResetSignal in the store and resets camera position + target. */
function CameraResetter() {
  const { camera, controls } = useThree();
  const signal = useAppStore((s) => s.cameraResetSignal);
  const assembly = getAssembly(getEngine(useAppStore((s) => s.activeEngineId)).assemblyId);
  const prevSignal = useRef(signal);

  useEffect(() => {
    if (signal === prevSignal.current) return;
    prevSignal.current = signal;
    camera.position.set(...assembly.camera.position);
    if (controls) {
      controls.target.set(...assembly.camera.target);
      controls.update();
    }
  }, [signal, camera, controls, assembly]);

  return null;
}

/**
 * Keeps the engine optically centered in the *unobstructed* viewport. The floating
 * engine-control menu covers the left edge of the canvas; this eases a camera view
 * offset so the engine sits centered in the area to the right of it — and pulls
 * back to true center the moment that menu is dismissed. Pure projection shift, so
 * orbit/zoom are untouched and the user never has to pan manually.
 */
function ViewOffsetController() {
  const { camera, gl, size } = useThree();
  const cur = useRef(0);
  const target = useRef(0);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current >= 0.15) {
      acc.current = 0;
      const canvas = gl.domElement.getBoundingClientRect();
      let inset = 0;
      const el = document.querySelector('.engine-control');
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) inset = Math.max(0, r.right - canvas.left);
      }
      target.current = inset;
    }
    cur.current += (target.current - cur.current) * Math.min(1, dt * 6);
    if (cur.current < 0.5) {
      if (camera.view && camera.view.enabled) camera.clearViewOffset();
    } else {
      // Shift the rendered frustum right by half the occluded width → engine
      // sits centered in the clear area.
      camera.setViewOffset(size.width, size.height, -cur.current / 2, 0, size.width, size.height);
    }
  });
  return null;
}

/**
 * HoverNameplate – a small floating card that follows the cursor and shows the
 * label, parent system, and a few quick metrics for the part being hovered.
 * Positioned imperatively on pointermove so it doesn't re-render per frame.
 */
function HoverNameplate() {
  const hovered = useAppStore((s) => s.hoveredComponent);
  const comp = hovered ? COMPONENTS[hovered] : null;
  if (!comp) return null;

  const sys = SUBSYSTEMS[comp.subsystemId];
  return (
    <div className="hover-nameplate" style={{ '--sys-color': sys?.color ?? '#58a6ff' }}>
      <div className="np-head">
        <span className="np-dot" />
        <span className="np-title">{comp.label}</span>
      </div>
      <div className="np-sys">{sys?.label ?? 'Component'}</div>
      <div className="np-metrics">
        <span className="np-pill">{comp.tags.length} tags</span>
        <span className="np-pill">{comp.failureSymptoms.length} symptoms</span>
        <span className="np-pill">{comp.relatedComponents.length} linked</span>
      </div>
      <div className="np-tags">
        {comp.tags.slice(0, 3).map((t) => (
          <span key={t} className="np-tag">
            {t}
          </span>
        ))}
      </div>
      <div className="np-hint">click to inspect →</div>
    </div>
  );
}

/** Live tachometer – polls the eased simState RPM each frame (outside the canvas). */
function Tachometer() {
  const [rpm, setRpm] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      setRpm(Math.round(simState.rpm));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="rpm-readout">{rpm.toLocaleString()} RPM</span>;
}

/** Battle Arena controls (DOM overlay) — rival pick, BATTLE/reset, live rpm, winner. */
function ArenaControls() {
  const arena = useAppStore((s) => s.arena);
  const startArena = useAppStore((s) => s.startArena);
  const resetArena = useAppStore((s) => s.resetArena);
  const setArenaRival = useAppStore((s) => s.setArenaRival);
  const savedBuilds = useAppStore((s) => s.savedBuilds);
  const [rpm, setRpm] = useState(0);
  useEffect(() => {
    if (!arena.active) return undefined;
    let raf;
    const tick = () => {
      setRpm(Math.round(simState.rpm));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [arena.active]);
  if (!arena.active) return null;
  return (
    <div className="arena3d-panel">
      <div className="arena3d-title">⚔ BATTLE ARENA</div>
      <label className="arena3d-vs">
        <span>your build vs</span>
        <select
          value={arena.rivalId}
          onChange={(e) => setArenaRival(e.target.value)}
          disabled={arena.status === 'battling'}
        >
          <optgroup label="Stock motors">
            {availableEngines().map((e) => (
              <option key={e.id} value={e.id}>{e.shortName} (stock)</option>
            ))}
          </optgroup>
          <optgroup label="Preset rivals">
            {RIVALS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </optgroup>
          {savedBuilds.length > 0 && (
            <optgroup label="Your saved builds">
              {savedBuilds.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      {arena.status === 'complete' ? (
        <div className="arena3d-winner">🏁 {arena.winner} wins</div>
      ) : (
        <div className="arena3d-rpm">{rpm.toLocaleString()} RPM</div>
      )}
      <div className="arena3d-btns">
        {arena.status === 'battling' ? (
          <button className="arena3d-go live" disabled>Ramping…</button>
        ) : (
          <button className="arena3d-go" onClick={startArena}>
            🚦 {arena.status === 'complete' ? 'Rematch' : 'BATTLE'}
          </button>
        )}
        {arena.status !== 'ready' && (
          <button className="arena3d-reset" onClick={resetArena}>Reset</button>
        )}
      </div>
    </div>
  );
}

export default function VehicleScene() {
  const clearSubsystem = useAppStore((s) => s.clearSubsystem);
  const triggerCameraReset = useAppStore((s) => s.triggerCameraReset);
  const explodeFactor = useAppStore((s) => s.explodeFactor);
  const setExplodeFactor = useAppStore((s) => s.setExplodeFactor);
  const engineRunning = useAppStore((s) => s.engineRunning);
  const toggleEngine = useAppStore((s) => s.toggleEngine);
  const targetRpm = useAppStore((s) => s.targetRpm);
  const setTargetRpm = useAppStore((s) => s.setTargetRpm);
  const timeScale = useAppStore((s) => s.timeScale);
  const setTimeScale = useAppStore((s) => s.setTimeScale);
  const cutaway = useAppStore((s) => s.cutaway);
  const toggleCutaway = useAppStore((s) => s.toggleCutaway);
  const peek = useAppStore((s) => s.peek);
  const setPeek = useAppStore((s) => s.setPeek);
  const arenaActive = useAppStore((s) => s.arena.active);
  const toggleArena = useAppStore((s) => s.toggleArena);
  const controlsCollapsed = useAppStore((s) => s.controlsCollapsed);
  const toggleControls = useAppStore((s) => s.toggleControls);
  const activeEngineId = useAppStore((s) => s.activeEngineId);

  // The model + camera framing follow whichever motor is active in the builder.
  const activeEngine = getEngine(activeEngineId);
  const assembly = getAssembly(activeEngine.assemblyId);
  const Model = assembly.Component;
  const containerRef = useRef();

  // Hold X (desktop) to ghost every other system and reveal the selected one.
  // Releasing the key — or losing window focus mid-hold — restores the view.
  useEffect(() => {
    const isTyping = (e) =>
      ['input', 'textarea', 'select'].includes((e.target?.tagName || '').toLowerCase());
    const down = (e) => {
      if (e.repeat || e.key.toLowerCase() !== 'x' || isTyping(e)) return;
      setPeek(true);
    };
    const up = (e) => {
      if (e.key.toLowerCase() === 'x') setPeek(false);
    };
    const release = () => setPeek(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
      setPeek(false);
    };
  }, [setPeek]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        dpr={IS_TOUCH ? 1 : [1, 2]}
        onPointerMissed={() => clearSubsystem()}
      >
        <color attach="background" args={['#10141b']} />
        <fog attach="fog" args={['#10141b', 14, 40]} />

        <PerspectiveCamera
          key={assembly.id}
          makeDefault
          position={assembly.camera.position}
          fov={assembly.camera.fov}
          near={0.1}
          far={120}
        />
        <StudioRig />

        <Suspense fallback={<LoadingFallback />}>
          {arenaActive ? (
            <ArenaStage />
          ) : (
            <GeomContext.Provider value={engineGeom(activeEngine)}>
              <Model />
            </GeomContext.Provider>
          )}
        </Suspense>

        {/* Brand logos, in-canvas so they composite with no black box: the header
            mark (top-left, steady) + the floating workspace clone (top-right). */}
        <Suspense fallback={null}>
          <SceneLogo anchor={[-0.66, 0.86]} scale={0.115} drift={false} useFx={false} />
          <SceneLogo anchor={[0.46, 0.46]} scale={0.14} drift useFx />
        </Suspense>

        {/* Soft contact shadow grounds the engine far better than the grid alone */}
        <ContactShadows
          position={[0, assembly.ground + 0.01, 0]}
          opacity={0.55}
          scale={14}
          blur={2.4}
          far={6}
          resolution={IS_TOUCH ? 512 : 1024}
          frames={IS_TOUCH ? 1 : Infinity}
          color="#000000"
        />

        <Grid
          args={[30, 30]}
          position={[0, assembly.ground, 0]}
          cellColor="#1b2733"
          sectionColor="#2f4356"
          fadeDistance={24}
          fadeStrength={2}
          infiniteGrid
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.14}
          rotateSpeed={0.65}
          zoomSpeed={0.8}
          minDistance={assembly.camera.min}
          maxDistance={assembly.camera.max}
          minPolarAngle={0.12}
          maxPolarAngle={Math.PI * 0.86}
          target={assembly.camera.target}
          makeDefault
        />
        <ExplodeDriver />
        <SimDriver />
        <FailureDriver />
        <FocusDriver />
        <CutawayController />
        <CameraResetter />
        <ViewOffsetController />

        {/* Ambient occlusion — shadows the casting crevices so the engine reads as
            real iron. Desktop only: full-screen AO is too heavy for phone GPUs. */}
        {!IS_TOUCH && (
          <EffectComposer enableNormalPass={false} multisampling={4}>
            <N8AO aoRadius={0.4} distanceFalloff={1} intensity={3.2} halfRes />
          </EffectComposer>
        )}
      </Canvas>

      <HoverNameplate />

      {/* Top-right scene buttons */}
      <div className="scene-overlay">
        <button className="overlay-btn" onClick={triggerCameraReset} title="Reset camera">
          ⌖ Reset
        </button>
        <button
          data-tour="arena-enter"
          className={`overlay-btn ${arenaActive ? 'arena-on' : ''}`}
          onClick={toggleArena}
          title="Stage a head-to-head battle of two engines"
        >
          {arenaActive ? '✕ Exit Arena' : '⚔ Arena'}
        </button>
      </div>

      <ArenaControls />

      {/* Engine run controls (top-left) — hidden during an arena duel, dismissable
          otherwise so the engine re-centers into the freed space. */}
      {!arenaActive && controlsCollapsed && (
        <button
          className="engine-expand-chip"
          onClick={toggleControls}
          title="Show engine controls + dyno"
          aria-label="Show engine controls and dyno"
        >
          <span className="engine-expand-icon">⚙</span>
          <span className="engine-expand-text">DYNO</span>
          <span className="engine-expand-chev">⟩</span>
        </button>
      )}
      {!arenaActive && !controlsCollapsed && (
      <div className={`engine-control ${engineRunning ? 'is-running' : ''}`}>
        <div className="engine-control-row">
          <button
            className={`engine-power ${engineRunning ? 'on' : ''}`}
            onClick={toggleEngine}
            title={engineRunning ? 'Shut the engine off' : 'Start the engine'}
          >
            {engineRunning ? '■ STOP' : '▶ START'}
          </button>
          <Tachometer />
          <button
            className="engine-collapse-btn"
            onClick={toggleControls}
            title="Dismiss panel"
            aria-label="Dismiss engine controls"
          >
            ⟨
          </button>
        </div>
        <label className="engine-slider-row">
          <span>Throttle</span>
          <input
            type="range"
            min={650}
            max={6500}
            step={50}
            value={targetRpm}
            onChange={(e) => setTargetRpm(parseFloat(e.target.value))}
            aria-label="Target RPM"
          />
          <span className="engine-val">{targetRpm.toLocaleString()}</span>
        </label>
        <label className="engine-slider-row">
          <span>Sim&nbsp;speed</span>
          <input
            type="range"
            min={0.02}
            max={1}
            step={0.01}
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            aria-label="Simulation speed"
          />
          <span className="engine-val">{Math.round(timeScale * 100)}%</span>
        </label>
        <button
          className={`engine-cutaway ${cutaway ? 'on' : ''}`}
          onClick={toggleCutaway}
          title="Slice the front half away to see the internals (follows the selected part)"
        >
          {cutaway ? '◧ Cutaway: ON' : '◧ Cutaway view'}
        </button>
        <button
          className={`engine-cutaway ${peek ? 'on' : ''}`}
          onPointerDown={() => setPeek(true)}
          onPointerUp={() => setPeek(false)}
          onPointerLeave={() => setPeek(false)}
          title="Hold to ghost every other system and reveal the selected one (or hold the X key)"
        >
          {peek ? '👁 Revealing…' : '👁 Hold to reveal'}
        </button>
      </div>
      )}

      {/* Bottom explode/teardown slider — kept in the arena so you can tear both
          engines open and watch the internals fail mid-battle. */}
      <div className="explode-control">
        <span className="explode-icon" aria-hidden>
          💥
        </span>
        <input
          className="explode-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={explodeFactor}
          onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
          aria-label="Explode amount"
        />
        <span className="explode-value">{Math.round(explodeFactor * 100)}%</span>
        <button
          className="overlay-btn explode-reset"
          onClick={() => setExplodeFactor(explodeFactor > 0.01 ? 0 : 1)}
          title="Toggle fully assembled / exploded"
        >
          {explodeFactor > 0.01 ? 'Assemble' : 'Explode'}
        </button>
      </div>
    </div>
  );
}
