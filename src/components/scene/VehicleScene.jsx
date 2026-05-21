/**
 * VehicleScene – the main Three.js canvas that hosts the vehicle model,
 * lighting, camera controls, grid, and animation overlay.
 */
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import VehicleModel from './VehicleModel';
import AnimationOverlay from './AnimationOverlay';

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

export default function VehicleScene() {
  return (
    <Canvas
      shadows
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
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
    </Canvas>
  );
}
