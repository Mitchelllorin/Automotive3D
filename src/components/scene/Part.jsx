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
import { getVariantLook } from '../../data/products';
import useAppStore from '../../store/appStore';
import { PartContext } from './partContext';
import { BuildContext } from '../../lib/engineInstance';

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
  // Cached fade state so we can skip the per-frame material walk once settled.
  const opacityRef = useRef(1);
  const targetRef = useRef(1);
  const lastFRef = useRef(-1);

  const selectedComponent = useAppStore((s) => s.selectedComponent);
  const selectedSubsystem = useAppStore((s) => s.selectedSubsystem);
  const isIsolated = useAppStore((s) => s.isIsolated);
  const peek = useAppStore((s) => s.peek);
  // Active Garage variant for this part → material override flowed to <Surface swap>.
  // In the arena, a BuildContext overrides the store so each engine shows its own
  // build; the normal single-engine view (no provider) reads the store as before.
  const buildOverride = useContext(BuildContext);
  const storeVariantId = useAppStore((s) => s.partVariants[name]);
  // Ghost preview: a part being tried in the Build tab shows here before commit.
  // Only on the main editable engine (no BuildContext), never on arena engines.
  const preview = useAppStore((s) => s.preview);
  const previewing = !buildOverride && preview != null && preview.category === name;
  const variantId = previewing
    ? preview.variantId
    : buildOverride
    ? buildOverride[name]
    : storeVariantId;
  const look = getVariantLook(name, variantId);
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
    // Reposition only when the explode amount actually changes (idle = no work).
    const f = explodeState.factor;
    if (f !== lastFRef.current) {
      lastFRef.current = f;
      g.position.set(
        position[0] + explode[0] * f,
        position[1] + explode[1] * f,
        position[2] + explode[2] * f
      );
    }

    // World position + focus publishing are only needed when something is focused.
    const focusActive = focusState.active;
    let target = dimLevel;
    if (selected || inFocusSystem || focusActive) {
      g.getWorldPosition(_wp);
      if (selected) {
        focusState.point.copy(_wp);
        focusState.active = true;
      } else if (inFocusSystem) {
        focusState._sum.add(_wp);
        focusState._count += 1;
      }
      // Parts in front of the focus anchor fade so you look "through" to the selection.
      if (focusActive && !isFocusMember) {
        state.camera.getWorldDirection(_dir);
        const delta = _wp.dot(_dir) - focusState.point.dot(_dir);
        const t = THREE.MathUtils.smoothstep(delta, -0.18, -0.02);
        const depthFade = 0.1 + 0.75 * t;
        if (depthFade < target) target = depthFade;
      }
    }

    // Ease ONE cached opacity for the whole part and only walk the meshes while it's
    // actually changing — once settled at target, this does nothing each frame.
    const cur = opacityRef.current;
    if (Math.abs(cur - target) > 0.004 || targetRef.current !== target) {
      targetRef.current = target;
      const next = ease(cur, target, dt, 9);
      opacityRef.current = next;
      const wantTransparent = next < 0.985;
      g.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const m = o.material;
        m.opacity = next;
        if (m.transparent !== wantTransparent) {
          m.transparent = wantTransparent;
          m.needsUpdate = true;
        }
        m.depthWrite = !wantTransparent;
      });
    }
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
        <PartContext.Provider value={{ selected, hovered, highlight: HIGHLIGHT, look, ghost: previewing }}>
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
  swap = false,
  children,
  ...meshProps
}) {
  const { selected, hovered, highlight, look, ghost } = useContext(PartContext);
  // A `swap` surface inside a part with an active Garage variant takes the
  // variant's look *authoritatively* — fields it omits fall back to the look's
  // named mat preset, then defaults — so each variant fully defines the finish.
  // Non-swap surfaces (bolts, internals) keep their hand-authored material.
  const ov = swap ? look : null;
  const iMat = ov ? ov.mat : mat;
  const iColor = ov ? ov.color : color;
  const iMetal = ov ? ov.metalness : metalness;
  const iRough = ov ? ov.roughness : roughness;
  const iEnv = ov ? ov.envMapIntensity : envMapIntensity;
  const iFinish = ov ? ov.finish : finish;

  // Resolve a named material preset, then let explicit props override it.
  const preset = (iMat && MATERIALS[iMat]) || null;
  const rColor = iColor ?? preset?.color ?? '#8a929c';
  const rMetal = iMetal ?? preset?.metalness ?? 0.6;
  const rRough = iRough ?? preset?.roughness ?? 0.45;
  const rEnv = iEnv ?? preset?.envMapIntensity ?? 1.15;
  const rFinish = iFinish ?? preset?.finish ?? 'matte';
  const tex = FINISHES[rFinish] ?? FINISHES.matte;

  let mColor = rColor;
  let mEmissive = emissive ?? '#000000';
  let mEmissiveIntensity = emissive ? 0.25 : 0;

  if (ghost) {
    // Previewing this part — a cyan glow marks it as a not-yet-committed ghost.
    mEmissive = '#36e0ff';
    mEmissiveIntensity = 0.55;
  } else if (selected) {
    mEmissive = highlight;
    mEmissiveIntensity = 0.85;
  } else if (hovered) {
    mEmissive = highlight;
    mEmissiveIntensity = 0.35;
  }

  // Opacity / transparency are driven imperatively by the enclosing <Part> every
  // frame (system fade + depth-aware fade), so they're intentionally omitted here.
  const matProps = {
    color: mColor,
    metalness: rMetal,
    roughness: rRough,
    envMapIntensity: rEnv,
    emissive: mEmissive,
    emissiveIntensity: mEmissiveIntensity,
    map: tex.map ?? null,
    normalMap: tex.normalMap ?? null,
    normalScale: tex.normalScale ?? [1, 1],
    roughnessMap: tex.roughnessMap ?? null,
  };
  // Painted enamel uses a physical material with a clearcoat so the block reads as
  // wet, freshly-painted metal; everything else stays on the cheaper standard mat.
  return (
    <mesh castShadow receiveShadow {...meshProps}>
      {children}
      {tex.clearcoat ? (
        <meshPhysicalMaterial {...matProps} clearcoat={tex.clearcoat} clearcoatRoughness={tex.clearcoatRoughness ?? 0.4} />
      ) : (
        <meshStandardMaterial {...matProps} />
      )}
    </mesh>
  );
}
