/**
 * SceneLogo — the brand logo, rendered INSIDE the main scene canvas (one WebGL
 * context) so it composites cleanly with NO black box, unlike a separate overlay
 * canvas which mobile GPUs paint black. It's pinned to the camera at a fixed
 * screen-space corner so it stays put as you orbit.
 *
 * Two uses of the same mesh, both in-canvas (no extra contexts → no boxes):
 *  - header brand mark (top-left, gentle turn, always visible)
 *  - the floating workspace clone (top-right, Lissajous drift + opacity from the
 *    logoFx settings in the Settings tab).
 *
 * Props:
 *  anchor [xFrac,yFrac] — screen position as a fraction of the half-frustum
 *  scale                — logo size
 *  drift                — Lissajous wander from logoFx (else a gentle fixed turn)
 *  useFx                — opacity follows logoFx (else always opaque)
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text3D } from '@react-three/drei';
import * as THREE from 'three';
import useAppStore from '../../store/appStore';

const FONT = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`;
const SEGMENTS = [
  { t: 'Auto', color: '#58a6ff', italic: false },
  { t: 'Motive', color: '#f0883e', italic: true },
  { t: '3D', color: '#3fb950', italic: false },
];

const DIST = 6; // how far in front of the camera the logo floats

export default function SceneLogo({ anchor = [0.55, 0.66], scale = 0.16, drift = true, useFx = true }) {
  const { camera } = useThree();
  const anchorRef = useRef(); // a CHILD of the camera, so it's screen-anchored
  const rod = useRef(); // drifts + turns within the anchor
  const layout = useRef(); // centres the words
  const meshes = useRef([]);
  const opacityRef = useRef(1);

  // Parent the logo to the camera so it's pinned to the screen reliably (no manual
  // matrix math, immune to OrbitControls updating the camera later in the frame).
  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return undefined;
    camera.add(node);
    return () => camera.remove(node);
  }, [camera]);

  // Lay the three words out side by side and centre them — exactly ONCE. The
  // italic shear mutates geometry in place, so it must never run per-render or it
  // stacks and "Motive" appears to slowly rotate/skew on its own axis.
  useLayoutEffect(() => {
    let x = 0;
    const gap = 0.06;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      if (SEGMENTS[i].italic) m.geometry.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.28, 0, 0, 0));
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      m.position.x = x - bb.min.x;
      x += bb.max.x - bb.min.x + gap;
    });
    if (layout.current) layout.current.position.x = -x / 2;
  }, []);

  useFrame((state, delta) => {
    if (!anchorRef.current || !rod.current) return;
    const t = state.clock.elapsedTime;
    const fx = useAppStore.getState().logoFx;
    const speed = fx.speed;
    const bounce = drift ? fx.bounce : 0;
    const opacity = useFx ? fx.opacity : 1;

    // anchorRef is a child of the camera; place it at a fixed CAMERA-LOCAL offset
    // so it sits in a screen corner. +x = right, +y = up, -z = in front.
    const halfH = DIST * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    anchorRef.current.position.set(halfW * anchor[0], halfH * anchor[1], -DIST);

    // Drift (workspace) or a stationary turntable spin (header brand mark): planted
    // in place, rotating steadily on its vertical axis to show the 3D depth.
    if (drift) {
      rod.current.position.x = Math.sin(t * 0.37 * speed) * 0.9 * bounce;
      rod.current.position.y = Math.sin(t * 0.95 * speed + 0.6) * 0.5 * bounce;
      rod.current.rotation.y = Math.sin(t * 0.5 * speed) * 0.4;
    } else {
      // Header mark: AIM it at the camera's optical centre first. The scene runs a
      // wide 42° perspective lens, so an extruded logo parked in a corner is viewed
      // at a steep oblique angle and looks skewed/keystoned. Rotating the anchor to
      // face the camera origin cancels that obliquity, so the logo reads flat and
      // square (level) no matter how far into the corner it sits.
      const px = halfW * anchor[0];
      const py = halfH * anchor[1];
      anchorRef.current.rotation.set(Math.atan2(py, DIST), -Math.atan2(px, DIST), 0);
      // Then a gentle side-to-side rock on its centre rod shows the 3D depth without
      // ever swinging far enough to look crooked at rest.
      rod.current.position.set(0, 0, 0);
      rod.current.rotation.x = 0;
      rod.current.rotation.y = Math.sin(t * 0.42) * 0.2; // ±~11° gentle rock
    }

    // Ease opacity toward the target, then push it onto every glyph material —
    // every frame, not only while the eased value is moving. The Text3D glyphs load
    // asynchronously (font fetch); if we gated on "still easing" they could appear
    // AFTER the value settled and get stuck at the material default (opaque). This
    // also self-heals when a mesh mounts late.
    const cur = opacityRef.current;
    const next = Math.abs(cur - opacity) > 0.003 ? cur + (opacity - cur) * 0.15 : opacity;
    opacityRef.current = next;
    meshes.current.forEach((m) => {
      if (m?.material && Math.abs(m.material.opacity - next) > 0.001) {
        m.material.transparent = next < 0.99;
        m.material.opacity = next;
      }
    });
  });

  return (
    <group ref={anchorRef}>
      <group ref={rod} scale={scale}>
        <group ref={layout}>
          {SEGMENTS.map((s, i) => (
            <Text3D
              key={s.t}
              ref={(el) => (meshes.current[i] = el)}
              font={FONT}
              size={1}
              height={0.3}
              bevelEnabled
              bevelSize={0.025}
              bevelThickness={0.05}
              bevelSegments={2}
              curveSegments={4}
            >
              {s.t}
              <meshStandardMaterial color={s.color} metalness={0.5} roughness={0.3} emissive={s.color} emissiveIntensity={0.18} />
            </Text3D>
          ))}
        </group>
      </group>
    </group>
  );
}
