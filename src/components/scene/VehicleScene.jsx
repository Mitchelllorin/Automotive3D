/**
 * VehicleScene – the main Three.js canvas that hosts the vehicle model,
 * lighting, camera controls, grid, and animation overlay.
 * Includes a camera-reset button overlay and clears selection on background clicks.
 */
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import VehicleModel from './VehicleModel';
import AnimationOverlay from './AnimationOverlay';
import useAppStore from '../../store/appStore';

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-4, 4, -4]} intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#74b9ff" />
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

/** Listens to cameraResetSignal in the store and resets camera position + target. */
function CameraResetter() {
  const { camera, controls } = useThree();
  const signal = useAppStore((s) => s.cameraResetSignal);
  const prevSignal = useRef(signal);

  useEffect(() => {
    if (signal === prevSignal.current) return;
    prevSignal.current = signal;
    camera.position.set(3.5, 2.5, 5);
    if (controls) {
      controls.target.set(0, 0.2, 0);
      controls.update();
    }
  }, [signal, camera, controls]);

  return null;
}

export default function VehicleScene() {
  const { clearSubsystem, triggerCameraReset } = useAppStore();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        style={{ width: '100%', height: '100%', background: '#0d1117' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        onPointerMissed={() => clearSubsystem()}
      >
        <PerspectiveCamera makeDefault position={[3.5, 2.5, 5]} fov={50} near={0.1} far={100} />
        <SceneLights />

        <Suspense fallback={<LoadingFallback />}>
          <VehicleModel />
          <AnimationOverlay />
        </Suspense>
        <Grid
          args={[20, 20]}
          position={[0, -0.65, 0]}
          cellColor="#2d3436"
          sectionColor="#636e72"
          fadeDistance={18}
          infiniteGrid
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={2}
          maxDistance={14}
          target={[0, 0.2, 0]}
          makeDefault
        />
        <CameraResetter />
      </Canvas>

      {/* Floating scene controls overlay */}
      <div className="scene-overlay">
        <button
          className="overlay-btn"
          onClick={triggerCameraReset}
          title="Reset camera to default position"
        >
          ⌖ Reset
        </button>
      </div>
    </div>
  );
}
