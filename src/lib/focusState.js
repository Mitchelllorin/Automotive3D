/**
 * Shared, frame-smoothed focus point — the world position of the currently
 * selected part.
 *
 * Mirrors `explodeState`: a module-level mutable object the selected <Part>
 * writes every frame and everything else reads inside its own useFrame, so the
 * depth-aware fade and the selection-aware cutaway plane can react to *where*
 * the focused part is without forcing React re-renders. `active` is false when
 * nothing is selected (a small driver in the scene clears it).
 */
import * as THREE from 'three';

export const focusState = {
  active: false, // is something (a part or a whole system) currently focused?
  point: new THREE.Vector3(), // world anchor of the focus

  // System-level focus: when a whole system is selected, its parts sum their
  // world positions here each frame and FocusDriver finalizes the centroid into
  // `point`, then resets these. (A single selected part writes `point` directly.)
  _sum: new THREE.Vector3(),
  _count: 0,
};
