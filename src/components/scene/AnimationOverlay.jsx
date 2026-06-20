/**
 * AnimationOverlay – renders looped particle/line animations representing
 * system flows: combustion, coolant, electrical, and fuel.
 *
 * Animations are shown when their subsystem is selected OR when the
 * global animationsEnabled flag is on without a specific selection.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/appStore';

// Pre-computed random values (module level, stable across renders)
const PARTICLE_COUNT = 40;
const PARTICLE_INIT_POSITIONS = (() => {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 0.6;
    arr[i * 3 + 1] = Math.random() * 0.6;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  return arr;
})();
const PARTICLE_SPEEDS = Array.from({ length: PARTICLE_COUNT }, () => 0.4 + Math.random() * 0.8);

function CombustionAnimation({ active, faultFlicker }) {
  const pointsRef = useRef();

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos.array[i * 3 + 1] += delta * PARTICLE_SPEEDS[i] * (faultFlicker ? (Math.random() > 0.5 ? 1 : -1) : 1);
      if (pos.array[i * 3 + 1] > 0.8) {
        pos.array[i * 3 + 1] = 0;
        pos.array[i * 3] = PARTICLE_INIT_POSITIONS[i * 3];
      }
    }
    pos.needsUpdate = true;
    // Flicker opacity for misfire fault
    pointsRef.current.material.opacity = faultFlicker
      ? 0.4 + Math.random() * 0.6
      : 0.8;
  });

  if (!active) return null;
  return (
    <points ref={pointsRef} position={[0, 0.38, 0.45]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[PARTICLE_INIT_POSITIONS.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={faultFlicker ? '#ff4500' : '#ff8c00'}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Coolant flow particles (blue flowing through hoses) ─────────────────────
function CoolantAnimation({ active, faultPulse }) {
  const pointsRef = useRef();
  const count = 30;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      arr[i * 3] = Math.sin(t * Math.PI * 2) * 0.35;
      arr[i * 3 + 1] = 0.15;
      arr[i * 3 + 2] = t * 0.8;
    }
    return arr;
  }, []);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;
    const t = state.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const phase = (offsets[i] + t * 0.4) % 1;
      pos.array[i * 3] = Math.sin(phase * Math.PI * 2) * 0.35;
      pos.array[i * 3 + 1] = 0.1 + Math.sin(phase * Math.PI) * 0.15;
      pos.array[i * 3 + 2] = phase * 1.0;
    }
    pos.needsUpdate = true;
    if (faultPulse) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      pointsRef.current.material.color.setStyle(
        pulse > 0.7 ? '#ff4444' : '#00b4d8'
      );
    }
  });

  if (!active) return null;
  return (
    <points ref={pointsRef} position={[0, 0.1, 0.45]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00b4d8"
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Electrical flow particles (yellow dashes battery → fuse → load) ─────────
function ElectricalAnimation({ active, faultFade }) {
  const pointsRef = useRef();
  const count = 20;
  const positions = useMemo(() => new Float32Array(count * 3), []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;
    const t = state.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const phase = ((i / count) + t * 0.5) % 1;
      // Path: battery(-0.65,0.05,0.85) → fuse(-0.65,0.2,1.25) → alternator(-0.55,0.1,0.35)
      const t3 = phase * 3;
      if (t3 < 1) {
        pos.array[i * 3] = THREE.MathUtils.lerp(-0.65, -0.65, t3);
        pos.array[i * 3 + 1] = THREE.MathUtils.lerp(0.05, 0.2, t3) + 0.08;
        pos.array[i * 3 + 2] = THREE.MathUtils.lerp(0.85, 1.25, t3);
      } else if (t3 < 2) {
        pos.array[i * 3] = THREE.MathUtils.lerp(-0.65, -0.55, t3 - 1);
        pos.array[i * 3 + 1] = THREE.MathUtils.lerp(0.2, 0.1, t3 - 1) + 0.08;
        pos.array[i * 3 + 2] = THREE.MathUtils.lerp(1.25, 0.35, t3 - 1);
      } else {
        pos.array[i * 3] = THREE.MathUtils.lerp(-0.55, 0.5, t3 - 2);
        pos.array[i * 3 + 1] = THREE.MathUtils.lerp(0.1, -0.1, t3 - 2) + 0.08;
        pos.array[i * 3 + 2] = THREE.MathUtils.lerp(0.35, 0.2, t3 - 2);
      }
    }
    pos.needsUpdate = true;
    if (faultFade) {
      // Battery dead: particles fade out
      pointsRef.current.material.opacity = Math.max(0.1, 0.8 - 0.6 * Math.sin(t * 0.5));
    }
  });

  if (!active) return null;
  return (
    <points ref={pointsRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#f9ca24"
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Fuel flow particles (orange from tank → injectors) ──────────────────────
function FuelAnimation({ active }) {
  const pointsRef = useRef();
  const count = 25;
  const positions = useMemo(() => new Float32Array(count * 3), []);

  useFrame((state) => {
    if (!pointsRef.current || !active) return;
    const t = state.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const phase = ((i / count) + t * 0.35) % 1;
      // Path: fuel_tank(0,-0.55,-1.4) → fuel_pump(0.2,-0.42,-0.75) → injectors(0,0.28,0.73)
      if (phase < 0.5) {
        const p = phase * 2;
        pos.array[i * 3] = THREE.MathUtils.lerp(0, 0.2, p);
        pos.array[i * 3 + 1] = THREE.MathUtils.lerp(-0.55 + 0.08, -0.42 + 0.08, p);
        pos.array[i * 3 + 2] = THREE.MathUtils.lerp(-0.95, -0.3, p);
      } else {
        const p = (phase - 0.5) * 2;
        pos.array[i * 3] = THREE.MathUtils.lerp(0.2, 0, p);
        pos.array[i * 3 + 1] = THREE.MathUtils.lerp(-0.42 + 0.08, 0.28 + 0.08, p);
        pos.array[i * 3 + 2] = THREE.MathUtils.lerp(-0.3, 0.73, p);
      }
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#e17055"
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AnimationOverlay() {
  const { selectedSubsystem, animationsEnabled, activeFaults } = useAppStore();

  const hasFault = (id) => !!activeFaults[id];

  const show = (subsystem) =>
    animationsEnabled && (!selectedSubsystem || selectedSubsystem === subsystem);

  return (
    <>
      <CombustionAnimation
        active={show('engine')}
        faultFlicker={hasFault('misfire')}
      />
      <CoolantAnimation
        active={show('cooling')}
        faultPulse={hasFault('overheating')}
      />
      <ElectricalAnimation
        active={show('electrical')}
        faultFade={hasFault('dead_battery') || hasFault('blown_fuse')}
      />
      <FuelAnimation active={show('fuel')} />
    </>
  );
}
