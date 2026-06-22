/**
 * Part – a selectable, explode-aware group used to compose an assembly.
 *
 * Responsibilities:
 *  - Eases its group toward `basePosition + explode * explodeState.factor`
 *    every frame (the teardown animation).
 *  - On click, selects the part (component) and its parent system.
 *  - Publishes its selection state through PartContext so child <Surface>
 *    meshes and fasteners can render a highlight without prop drilling.
 *
 * Children read selection via `useContext(PartContext)`; geometry/material is
 * declared by the caller using <Surface>.
 */
import { useContext, useRef, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { explodeState, ease } from '../../lib/explodeState';
import { focusState } from '../../lib/focusState';
import { FINISHES } from '../../lib/textures';
import { MATERIALS } from '../../lib/materials';
import useAppStore from '../../store/appStore';
import { PartContext } from './partContext';

// Make <roundedBoxGeometry> available as a JSX element so cast/machined parts
// can carry the small fillets real metal has instead of razor-sharp toy edges.
extend({ RoundedBoxGeometry });

const HIGHLIGHT = '#58a6ff';

// Scratch vectors reused across frames so the per-part fade math allocates nothing.
const _wp = new THREE.Vector3();
const _dir = new THREE.Vector3();

/**
 * RBox – drop-in replacement for <boxGeometry> that bevels its edges. The corner
 * radius scales with the smallest dimension (so thin plates round subtly and
 * chunky castings round more), clamped well under half-thickness so geometry
 * never self-intersects. This is what kills the "LEGO brick" silhouette.
 */
export function RBox({ args, ...props }) {
  const [w, h, d] = args;
  const r = Math.min(Math.min(w, h, d) * 0.12, 0.03);
  return <roundedBoxGeometry args={[w, h, d, 4, Math.max(0.004, r)]} {...props} />;
}

export default function Part({
  name,
  system,
  position = [0, 0, 0],
  explode = [0, 0, 0],
  rotation,
  children,
}) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const selectedComponent = useAppStore((s) => s.selectedComponent);
  const selectedSubsystem = useAppStore((s) => s.selectedSubsystem);
  const isIsolated = useAppStore((s) => s.isIsolated);
  const peek = useAppStore((s) => s.peek);
  const setSelectedComponent = useAppStore((s) => s.setSelectedComponent);
  const selectSubsystem = useAppStore((s) => s.selectSubsystem);
  const setHoveredComponent = useAppStore((s) => s.setHoveredComponent);
  const clearHoveredComponent = useAppStore((s) => s.clearHoveredComponent);

  const selected = selectedComponent === name;
  // "Open one, close the rest": when a system is selected, fade the others.
  // Isolate (latched) and peek (held) fade them almost away; otherwise dim back.
  const otherSystemActive = selectedSubsystem && selectedSubsystem !== system;
  const dimLevel = otherSystemActive ? (isIsolated || peek ? 0.05 : 0.45) : 1;

  // Focus membership drives the depth-aware fade's anchor. A selected component
  // anchors on itself; a selected system (no specific component) anchors on the
  // whole system, so picking a system in the Systems tab also drives the fade.
  // Focus members stay bright; everything in front of the anchor fades.
  const systemFocus = selectedSubsystem && !selectedComponent;
  const inFocusSystem = systemFocus && system === selectedSubsystem;
  const isFocusMember = selectedComponent ? selected : inFocusSystem;

  // The frame loop owns opacity now (smooth easing + depth-aware fade). useFrame
  // always runs the latest callback, so the values above are read fresh here.
  useFrame((state, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const f = explodeState.factor;
    g.position.set(
      position[0] + explode[0] * f,
      position[1] + explode[1] * f,
      position[2] + explode[2] * f
    );

    // World anchor of this part (matrix is refreshed by getWorldPosition).
    g.getWorldPosition(_wp);

    // Publish the focus anchor for depth fade + cutaway tracking: a selected part
    // writes it directly; the parts of a focused system feed a centroid that
    // FocusDriver averages and finalizes.
    if (selected) {
      focusState.point.copy(_wp);
      focusState.active = true;
    } else if (inFocusSystem) {
      focusState._sum.add(_wp);
      focusState._count += 1;
    }

    // Baseline fade (system / isolate / peek), then layer depth-aware fade on top:
    // parts in front of the focus anchor — between it and the camera — fade hard
    // so you look "through" the engine toward the selection.
    let target = dimLevel;
    if (focusState.active && !isFocusMember) {
      state.camera.getWorldDirection(_dir); // unit vector pointing into the scene
      const delta = _wp.dot(_dir) - focusState.point.dot(_dir); // <0 ⇒ occluder
      const t = THREE.MathUtils.smoothstep(delta, -0.18, -0.02);
      const depthFade = 0.1 + (0.85 - 0.1) * t; // front → 0.1, at/behind → 0.85
      if (depthFade < target) target = depthFade;
    }

    // Ease every material under this part toward the target opacity. Flipping
    // `transparent` needs a shader recompile, so only touch it on a real change.
    g.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const m = o.material;
      m.opacity = ease(m.opacity, target, dt, 9);
      const wantTransparent = m.opacity < 0.985;
      if (m.transparent !== wantTransparent) {
        m.transparent = wantTransparent;
        m.needsUpdate = true;
      }
      m.depthWrite = !wantTransparent;
    });
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setSelectedComponent(name);
    if (system) selectSubsystem(system);
  };

  const handleOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredComponent(name);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    setHovered(false);
    clearHoveredComponent(name);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} rotation={rotation}>
      <group
        name={name}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <PartContext.Provider value={{ selected, hovered, highlight: HIGHLIGHT }}>
          {children}
        </PartContext.Provider>
      </group>
    </group>
  );
}

/**
 * Surface – a mesh material that reacts to the enclosing Part's selection state.
 * Pass geometry as children; this renders the <meshStandardMaterial>.
 */
export function Surface({
  mat,
  color,
  metalness,
  roughness,
  envMapIntensity,
  emissive,
  finish,
  children,
  ...meshProps
}) {
  const { selected, hovered, highlight } = useContext(PartContext);
  // Resolve a named material preset, then let explicit props override it.
  const preset = (mat && MATERIALS[mat]) || null;
  const rColor = color ?? preset?.color ?? '#8a929c';
  const rMetal = metalness ?? preset?.metalness ?? 0.6;
  const rRough = roughness ?? preset?.roughness ?? 0.45;
  const rEnv = envMapIntensity ?? preset?.envMapIntensity ?? 1.15;
  const rFinish = finish ?? preset?.finish ?? 'matte';
  const tex = FINISHES[rFinish] ?? FINISHES.matte;

  let mColor = rColor;
  let mEmissive = emissive ?? '#000000';
  let mEmissiveIntensity = emissive ? 0.25 : 0;

  if (selected) {
    mEmissive = highlight;
    mEmissiveIntensity = 0.85;
  } else if (hovered) {
    mEmissive = highlight;
    mEmissiveIntensity = 0.35;
  }

  // Opacity / transparency are driven imperatively by the enclosing <Part> every
  // frame (system fade + depth-aware fade), so they're intentionally omitted here.
  return (
    <mesh castShadow receiveShadow {...meshProps}>
      {children}
      <meshStandardMaterial
        color={mColor}
        metalness={rMetal}
        roughness={rRough}
        envMapIntensity={rEnv}
        emissive={mEmissive}
        emissiveIntensity={mEmissiveIntensity}
        map={tex.map ?? null}
        normalMap={tex.normalMap ?? null}
        normalScale={tex.normalScale ?? [1, 1]}
        roughnessMap={tex.roughnessMap ?? null}
      />
    </mesh>
  );
}
