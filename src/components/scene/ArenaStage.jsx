/**
 * ArenaStage — the head-to-head Battle Arena, staged in the workspace.
 *
 * Two full engines (your build vs a rival) sit on a lit stage. Hit BATTLE and
 * both get revved up one shared ramp (idle → 8,000 rpm) while heat soaks in; each
 * engine runs F.U.S.E. independently through its own FailureContext, so the one
 * with the weaker combo for this abuse grenades first — valve float, detonation,
 * overheat, a thrown rod — with the real 3D failure FX firing on the loser. Last
 * one running wins. The ring glows hotter as the load climbs; full 360° orbit is
 * the user's (the scene's OrbitControls), so it's a real interactive arena.
 */
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { getAssembly } from '../../assemblies/registry';
import useAppStore from '../../store/appStore';
import { simState } from '../../lib/simState';
import { FailureContext, BuildContext, CamContext } from '../../lib/engineInstance';
import { makeFailureState, writeFailure } from '../../lib/failureState';
import { assessEngine, FUELS } from '../../lib/engineStress';
import { ENVIRONMENTS } from '../../lib/dyno';
import { getActiveVariant } from '../../data/products';
import { makeCam } from '../../data/engineSpec';
import { getEngine, DEFAULT_ENGINE_ID } from '../../data/engines';
import { RIVALS, rampAt, rpmAt, conditionsAt, RAMP_MS, SETTLE_MS } from '../../lib/battle';

const STAGE_Y = -1.35;
const SEP = 2.15; // engines sit at ±SEP on Z, facing the camera

const integrityOf = (worst) => Math.max(0, Math.min(100, 100 * (1 - Math.min(worst, 2) / 2)));
const phaseOf = (w) => (w >= 2 ? 'failed' : w >= 1.2 ? 'critical' : w >= 0.45 ? 'stressed' : 'nominal');
const PHASE_COLOR = { nominal: '#3fb950', stressed: '#d2a106', critical: '#f0883e', failed: '#f85149' };
const PIPS = [['VLV', 'valvetrain'], ['PST', 'pistons'], ['COOL', 'cooling'], ['ROD', 'bottom_end']];

/** The headline failure currently leading on an engine (or null when healthy). */
function leadLabel(f) {
  const opts = [
    [f.valvetrain, f.valvetrain >= 2 ? 'DROPPED VALVE' : 'VALVE FLOAT'],
    [f.pistons, f.holed ? 'HOLED PISTON' : 'DETONATION'],
    [f.cooling, f.boilover ? 'HEAD GASKET' : 'OVERHEAT'],
    [f.bottom_end, 'THROWN ROD'],
  ];
  const top = opts.reduce((m, o) => (o[0] > m[0] ? o : m), [-1, null]);
  return top[0] >= 0.45 ? top[1] : null;
}

/** Floating nameplate + live telemetry above an engine. */
function ContestantHud({ label, hud, accent }) {
  const color = PHASE_COLOR[hud.phase] || accent;
  return (
    <Html position={[0, 2.3, 0]} center distanceFactor={9} pointerEvents="none">
      <div className={`arena3d-hud ${hud.phase === 'failed' ? 'dead' : ''}`}>
        <div className="arena3d-hud-name" style={{ color: accent }}>{label}</div>
        <div className="arena3d-hud-bar"><span style={{ width: `${hud.integ}%`, background: color }} /></div>
        {hud.phase === 'failed' ? (
          <div className="arena3d-hud-mode" style={{ color: '#f85149' }}>💥 {hud.lead || 'GRENADED'}</div>
        ) : hud.lead ? (
          <div className="arena3d-hud-mode" style={{ color }}>⚠ {hud.lead}</div>
        ) : (
          <div className="arena3d-hud-stat">healthy</div>
        )}
        <div className="arena3d-hud-stat">
          {Math.round(hud.integ)}% · {hud.rpm.toLocaleString()} rpm · {Math.round(hud.coolantF)}°F
        </div>
        <div className="arena3d-hud-pips">
          {PIPS.map(([k, key]) => (
            <span key={k} title={k} style={{ background: PHASE_COLOR[phaseOf(hud.sys[key])] }} />
          ))}
        </div>
      </div>
    </Html>
  );
}

export default function ArenaStage() {
  const partVariants = useAppStore((s) => s.partVariants);
  const arena = useAppStore((s) => s.arena);
  const finishArena = useAppStore((s) => s.finishArena);
  const timeScale = useAppStore((s) => s.timeScale);
  const savedBuilds = useAppStore((s) => s.savedBuilds);
  const activeEngineId = useAppStore((s) => s.activeEngineId);
  const { envIdx, fuelIdx, load } = useAppStore((s) => s.fuseConditions);

  // The rival can be ANOTHER stock motor, a built-in preset, or a saved build.
  // Each carries an engineId so the duel can be 350-vs-454, not just build-vs-build.
  const rival = useMemo(() => {
    const enginePkg = getEngine(arena.rivalId);
    if (enginePkg.available && enginePkg.id === arena.rivalId) {
      return { id: enginePkg.id, label: enginePkg.shortName, build: {}, engineId: enginePkg.id };
    }
    const preset = RIVALS.find((r) => r.id === arena.rivalId);
    if (preset) return { ...preset, engineId: DEFAULT_ENGINE_ID };
    const saved = savedBuilds.find((b) => b.id === arena.rivalId);
    if (saved) return { id: saved.id, label: saved.name, build: saved.partVariants, engineId: saved.engineId || DEFAULT_ENGINE_ID };
    return { ...RIVALS[0], engineId: DEFAULT_ENGINE_ID };
  }, [arena.rivalId, savedBuilds]);

  // Each side's engine package drives its dyno/durability AND its own 3D model.
  const youEngine = getEngine(activeEngineId);
  const rivalEngine = getEngine(rival.engineId);
  const YouModel = getAssembly(youEngine.assemblyId).Component;
  const RivalModel = getAssembly(rivalEngine.assemblyId).Component;
  const baseConditions = useMemo(() => {
    const env = ENVIRONMENTS[envIdx] ?? ENVIRONMENTS[0];
    return { ambientF: env.airTempF, altitudeFt: env.altitudeFt, octane: FUELS[fuelIdx]?.octane ?? 91, loadFraction: load };
  }, [envIdx, fuelIdx, load]);

  // Each engine runs its OWN camshaft so the valvetrains visibly differ — a hot
  // grind opens further and holds longer than a stock cam right beside it.
  const yourCam = useMemo(() => makeCam(getActiveVariant('camshaft', partVariants.camshaft)?.cam), [partVariants.camshaft]);
  const rivalCam = useMemo(() => makeCam(getActiveVariant('camshaft', rival.build?.camshaft)?.cam), [rival.build]);

  // Stable per-engine failure objects (mutated each frame; identity never changes).
  const failYou = useRef(makeFailureState()).current;
  const failRival = useRef(makeFailureState()).current;

  const ringRef = useRef();
  const startRef = useRef(0);
  const prevStatus = useRef('ready');
  const concluded = useRef(false);
  const hudAcc = useRef(0);
  const blankHud = { integ: 100, phase: 'nominal', coolantF: 195, rpm: 0, lead: null, sys: { valvetrain: 0, pistons: 0, cooling: 0, bottom_end: 0 } };
  const [hud, setHud] = useState({ you: blankHud, rival: blankHud });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const status = arena.status;

    // Status transitions.
    if (status !== prevStatus.current) {
      if (status === 'battling') {
        startRef.current = t;
        concluded.current = false;
      } else if (status === 'ready') {
        writeFailure(failYou, { results: [], worst: 0 });
        writeFailure(failRival, { results: [], worst: 0 });
      }
      prevStatus.current = status;
    }

    const progress = status === 'battling' ? rampAt((t - startRef.current) * 1000) : 0;
    const rpm = status === 'complete' ? simState.rpm : status === 'battling' ? rpmAt(progress) : 900;

    // Spin both engines off the shared sim clock.
    if (status !== 'complete') {
      simState.rpm = rpm;
      simState.crankAngle += (rpm / 60) * Math.PI * 2 * dt * timeScale;
    }

    if (status === 'battling') {
      const conditions = conditionsAt(progress, baseConditions);
      const aYou = assessEngine(partVariants, rpm, conditions, youEngine);
      const aRival = assessEngine(rival.build, rpm, conditions, rivalEngine);
      writeFailure(failYou, aYou);
      writeFailure(failRival, aRival);
      failYou._coolantF = aYou.state.coolantF;
      failRival._coolantF = aRival.state.coolantF;

      // Conclude: someone grenaded, or the ramp settled out.
      const elapsed = (t - startRef.current) * 1000;
      const settled = progress >= 1 && elapsed >= RAMP_MS + SETTLE_MS;
      const aDead = failYou.worst >= 2;
      const bDead = failRival.worst >= 2;
      if (!concluded.current && (aDead || bDead || settled)) {
        concluded.current = true;
        const youWin = failYou.worst < failRival.worst || (bDead && !aDead);
        finishArena(youWin ? 'Your build' : rival.label);
      }
    }

    // Ring heats with the load ramp: cyan at rest → amber under full stress.
    if (ringRef.current) {
      const m = ringRef.current.material;
      m.emissive.setRGB(0.22 + progress * 0.78, 0.6 - progress * 0.42, 0.95 - progress * 0.85);
      m.emissiveIntensity = 1.4 + progress * 2.6;
      ringRef.current.rotation.z += 0.0015;
    }

    // Throttle the HUD (~12 Hz) so the DOM doesn't thrash but still reads live.
    hudAcc.current += dt;
    if (hudAcc.current >= 0.08) {
      hudAcc.current = 0;
      const mk = (f) => ({
        integ: integrityOf(f.worst),
        phase: phaseOf(f.worst),
        coolantF: f._coolantF ?? 195,
        rpm: Math.round(rpm),
        lead: leadLabel(f),
        sys: { valvetrain: f.valvetrain, pistons: f.pistons, cooling: f.cooling, bottom_end: f.bottom_end },
      });
      setHud({ you: mk(failYou), rival: mk(failRival) });
    }
  });

  return (
    <group name="arena-stage">
      {/* Heating arena ring on the stage floor */}
      <mesh ref={ringRef} position={[0, STAGE_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.4, 0.07, 16, 120]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.6} metalness={0.3} roughness={0.25} toneMapped={false} />
      </mesh>

      {/* Stage lighting accents */}
      <pointLight position={[-6, 5, 6]} intensity={60} distance={30} color="#5aa6ff" />
      <pointLight position={[6, 4, -6]} intensity={55} distance={28} color="#ff9c4a" />

      {/* YOUR engine */}
      <group position={[0, 0, -SEP]}>
        <FailureContext.Provider value={failYou}>
          <BuildContext.Provider value={partVariants}>
            <CamContext.Provider value={yourCam}>
              <YouModel />
            </CamContext.Provider>
          </BuildContext.Provider>
        </FailureContext.Provider>
        <ContestantHud label={`YOUR ${youEngine.shortName}`} hud={hud.you} accent="#f0883e" />
      </group>

      {/* RIVAL engine */}
      <group position={[0, 0, SEP]}>
        <FailureContext.Provider value={failRival}>
          <BuildContext.Provider value={rival.build}>
            <CamContext.Provider value={rivalCam}>
              <RivalModel />
            </CamContext.Provider>
          </BuildContext.Provider>
        </FailureContext.Provider>
        <ContestantHud label={rival.label.toUpperCase()} hud={hud.rival} accent="#58a6ff" />
      </group>
    </group>
  );
}
