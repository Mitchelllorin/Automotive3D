/**
 * FailureEffects — the 3D face of F.U.S.E., rendered on the running engine.
 *
 * Every effect is anchored to the part that actually fails and behaves the way
 * that failure really looks, because a mechanic will know in a heartbeat if it's
 * wrong:
 *   • Overheat / blown head gasket → white steam off the COOLING system (front,
 *     by the thermostat housing and water pump).
 *   • Holed piston → blue-grey oil smoke out the EXHAUST collectors.
 *   • Thrown rod → dark smoke from the BOTTOM END (under the pan).
 *   • Detonation & misfire are handled in the chambers themselves (see Flash).
 *
 * It reads failureState (written by FailureDriver) every frame and never forces a
 * React re-render. Intensity tracks severity, so it builds as the engine gets
 * angrier and clears the instant the failure does.
 */
import { useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FailureContext } from '../../lib/engineInstance';

/**
 * A rising column of smoke/steam puffs from a fixed origin. A small pool of
 * spheres recycles continuously; `level()` (0–1) drives spawn density, size, and
 * opacity, so the plume thickens with severity and vanishes when it clears.
 */
function Plume({ origin, color, level, count = 14, rise = 1, spread = 0.22, size = 0.26, drift = [0, 0, 0] }) {
  const refs = useRef([]);
  // Stagger each puff along its life so the column is continuous, not pulsing, and
  // vary size/rise per puff so it reads as wispy smoke rather than a stack of balls.
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        t: i / count,
        a: i * 2.3994,
        b: i * 5.1031,
        s: 0.5 + ((i * 0.618) % 1) * 0.95, // size multiplier
        r: 0.8 + ((i * 0.37) % 1) * 0.5, // rise multiplier
      })),
    [count]
  );

  useFrame((_, dt) => {
    const lvl = Math.min(1, Math.max(0, level()));
    for (let i = 0; i < count; i++) {
      const m = refs.current[i];
      if (!m) continue;
      if (lvl <= 0.01) { m.visible = false; continue; }
      const p = seeds[i];
      p.t += dt * (0.32 + rise * 0.28) * (0.55 + lvl * 0.8);
      if (p.t >= 1) p.t -= 1;
      const life = p.t; // 0 (birth) … 1 (gone)
      const ox = Math.sin(p.a + life * 2) * spread * (0.35 + life);
      const oz = Math.cos(p.b + life * 1.6) * spread * (0.35 + life);
      m.position.set(
        origin[0] + ox + drift[0] * life,
        origin[1] + rise * p.r * life + drift[1] * life,
        origin[2] + oz + drift[2] * life
      );
      const sc = size * p.s * (0.25 + life * 0.95) * (0.55 + lvl * 0.7);
      m.scale.setScalar(sc);
      const fade = Math.sin(Math.PI * life); // peaks mid-life
      m.material.opacity = fade * (0.07 + lvl * 0.4);
      m.visible = m.material.opacity > 0.02;
    }
  });

  return (
    <group>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={color} roughness={1} metalness={0} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function FailureEffects() {
  const fs = useContext(FailureContext);
  // Cooling: steam off the front of the engine (thermostat housing / water pump).
  const steamLevel = () =>
    fs.overheat ? Math.min(1, fs.cooling / 2) * (fs.boilover ? 1.35 : 1) : 0;
  // Holed piston: blue oil smoke out the pipes (one plume per bank collector).
  const oilLevel = () => (fs.holed ? Math.min(1, fs.pistons / 2) : 0);
  // Thrown rod: dark smoke from under the engine.
  const rodLevel = () => (fs.seized ? 1 : 0);

  return (
    <group name="failure-effects">
      {/* COOLING — front-top, billows up and slightly forward */}
      <Plume origin={[0.9, 0.7, 0]} color="#e6ecf3" level={steamLevel} count={24} rise={1.6} spread={0.3} size={0.26} drift={[0.3, 0.4, 0]} />
      {/* EXHAUST — collectors low on each bank side */}
      <Plume origin={[-0.1, -0.32, 0.92]} color="#727d8c" level={oilLevel} rise={1.1} spread={0.2} size={0.24} drift={[0, 0.2, 0.35]} />
      <Plume origin={[-0.1, -0.32, -0.92]} color="#727d8c" level={oilLevel} rise={1.1} spread={0.2} size={0.24} drift={[0, 0.2, -0.35]} />
      {/* BOTTOM END — dark smoke from under the pan on a thrown rod */}
      <Plume origin={[0, -0.82, 0]} color="#26282c" level={rodLevel} count={18} rise={1.3} spread={0.4} size={0.34} drift={[0, 0.3, 0]} />
    </group>
  );
}
