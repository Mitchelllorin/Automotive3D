/**
 * Logo3D — the real, extruded 3D brand logo (shared styling with CT3D / TP3D):
 * "Auto" (blue) · "Motive" (orange, italic) · "3D" (green), beveled metal.
 *
 * Two uses of the same mesh:
 *  - <Logo3D> — the fixed brand mark, top-left in the header (gentle turn only).
 *  - <WorkspaceLogo> — a floating, drifting CLONE in the workspace, with a gear in
 *    its corner that opens an inline FX panel (opacity / speed / bounce). The same
 *    values also live in the Settings tab.
 *
 * Tiny, low-poly, transparent canvases; pixel ratio capped so the extra WebGL
 * views stay cheap on phones.
 */
import { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D } from '@react-three/drei';
import * as THREE from 'three';
import useAppStore from '../../store/appStore';

const FONT = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`;

// Auto = blue, Motive = orange (italic lean), 3D = green. Metallic.
const SEGMENTS = [
  { t: 'Auto', color: '#58a6ff', italic: false },
  { t: 'Motive', color: '#f0883e', italic: true },
  { t: '3D', color: '#3fb950', italic: false },
];

function LogoMesh({ bouncing = false }) {
  const rod = useRef(); // invisible rod it turns + drifts on
  const layout = useRef(); // centers the words
  const meshes = useRef([]);

  useLayoutEffect(() => {
    let x = 0;
    const gap = 0.06;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      if (SEGMENTS[i].italic) {
        m.geometry.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.28, 0, 0, 0));
      }
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      m.position.x = x - bb.min.x;
      x += bb.max.x - bb.min.x + gap;
    });
    if (layout.current) layout.current.position.x = -x / 2;
  }, []);

  useFrame((state) => {
    if (!rod.current) return;
    const t = state.clock.elapsedTime;
    if (bouncing) {
      // Workspace clone: a slow Lissajous drift so it actually floats AROUND the
      // workspace (not just bobbing in place) + a turn. Amplitude scales with the
      // FX "bounce" setting, cadence with "speed".
      const { speed, bounce } = useAppStore.getState().logoFx;
      rod.current.rotation.y = Math.sin(t * 0.5 * speed) * 0.5;
      rod.current.rotation.x = -0.05 + Math.sin(t * 0.32 * speed) * 0.06;
      rod.current.position.x = Math.sin(t * 0.37 * speed) * 1.8 * bounce;
      rod.current.position.y = Math.sin(t * 0.95 * speed + 0.6) * 0.9 * bounce;
    } else {
      // Header brand mark: a fixed, gentle turn so the 3D depth reads. No FX.
      rod.current.rotation.y = Math.sin(t * 0.4) * 0.3;
      rod.current.rotation.x = -0.07 + Math.sin(t * 0.26) * 0.025;
    }
  });

  return (
    <group ref={rod}>
      <group ref={layout}>
        {SEGMENTS.map((s, i) => (
          <Text3D
            key={s.t}
            ref={(el) => (meshes.current[i] = el)}
            font={FONT}
            size={1}
            height={0.32}
            bevelEnabled
            bevelSize={0.025}
            bevelThickness={0.05}
            bevelSegments={2}
            curveSegments={4}
          >
            {s.t}
            <meshStandardMaterial
              color={s.color}
              metalness={0.45}
              roughness={0.28}
              emissive={s.color}
              emissiveIntensity={0.16}
            />
          </Text3D>
        ))}
      </group>
    </group>
  );
}

function LogoCanvas({ bouncing, camZ = 9, fov = 26 }) {
  return (
    <Canvas
      camera={{ position: [0, 0, camZ], fov }}
      dpr={1.5}
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      // Force a fully transparent clear so the canvas never paints a black box
      // over the scene — alpha:true alone isn't always honoured on mobile GL.
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 5, 6]} intensity={2.6} />
      <directionalLight position={[-5, 1, 3]} intensity={1.1} color="#9ec9ff" />
      <Suspense fallback={null}>
        <LogoMesh bouncing={bouncing} />
      </Suspense>
    </Canvas>
  );
}

// Fixed brand mark — header, top-left.
export default function Logo3D() {
  return (
    <div className="app-logo3d">
      <LogoCanvas bouncing={false} />
    </div>
  );
}

/** The three FX sliders, shown inline under the gear and (separately) in Settings. */
function LogoFxControls() {
  const logoFx = useAppStore((s) => s.logoFx);
  const setLogoFx = useAppStore((s) => s.setLogoFx);
  const rows = [
    { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'speed', label: 'Speed', min: 0, max: 2.5, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
    { key: 'bounce', label: 'Float', min: 0, max: 1.5, step: 0.05, fmt: (v) => v.toFixed(2) },
  ];
  return (
    <div className="logo-fx-panel">
      {rows.map((r) => (
        <label className="logo-fx-row" key={r.key}>
          <span>{r.label}</span>
          <input
            type="range"
            min={r.min}
            max={r.max}
            step={r.step}
            value={logoFx[r.key]}
            onChange={(e) => setLogoFx({ [r.key]: parseFloat(e.target.value) })}
          />
        </label>
      ))}
    </div>
  );
}

// Floating, drifting clone in the workspace; opacity + motion from the FX settings.
// A gear in the corner opens the inline FX panel so the controls are right there.
export function WorkspaceLogo() {
  const opacity = useAppStore((s) => s.logoFx.opacity);
  const open = useAppStore((s) => s.logoSettingsOpen);
  const toggle = useAppStore((s) => s.toggleLogoSettings);
  return (
    <div className="workspace-logo">
      <div className="workspace-logo-canvas" style={{ opacity }} aria-hidden="true">
        <LogoCanvas bouncing camZ={12} fov={28} />
      </div>
      <button
        className="logo-fx-btn"
        onClick={toggle}
        title="Logo effects"
        aria-label="Logo effects"
        aria-expanded={open}
      >
        ⚙
      </button>
      {open && <LogoFxControls />}
    </div>
  );
}
