/**
 * Shared, frame-smoothed explode factor.
 *
 * The store holds the *target* explode value (0 = assembled, 1 = fully apart).
 * A single <ExplodeDriver> eases `explodeState.factor` toward that target every
 * frame, and every Part / fastener reads `explodeState.factor` inside its own
 * useFrame. Keeping the eased value in a module-level mutable object (rather than
 * React state) lets ~dozens of meshes animate smoothly without re-rendering.
 */
export const explodeState = { factor: 0 };

/** Critically-ish damped ease toward a target; framerate independent. */
export function ease(current, target, dt, speed = 6) {
  return current + (target - current) * Math.min(1, dt * speed);
}
