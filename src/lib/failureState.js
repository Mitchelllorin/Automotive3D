/**
 * failureState — the live F.U.S.E. verdict, shared with the 3D scene.
 *
 * Like simState/explodeState this is a module-level mutable so the failure
 * effects (steam, oil smoke, detonation flash, valve float, seize) can read the
 * current severities every frame without forcing React re-renders. A driver in
 * the canvas (FailureDriver) runs F.U.S.E. against the live build + rpm +
 * conditions and writes the result here; the effect meshes read it.
 *
 * Severities are 0–3 per system (the F.U.S.E. scale). The booleans flag the
 * specific modes the 3D effects key off, so an effect appears on the right part
 * for the right reason — steam only from the cooling system, smoke only out the
 * pipes, a seize only from a thrown rod.
 */
export const failureState = {
  // Per-system severity, 0 (OK) … 3 (destroyed).
  valvetrain: 0,
  pistons: 0,
  cooling: 0,
  bottom_end: 0,
  worst: 0,
  // Specific active modes (set from the F.U.S.E. mode/visual keys).
  float: false, // valves bouncing past redline
  detonation: false, // knock in the chambers
  holed: false, // a piston burned through → misfire + oil smoke
  overheat: false, // coolant past safe
  boilover: false, // head gasket / steam blowing
  seized: false, // thrown rod → engine stops
};

/** Map an assessEngine result onto a failure object (the shape the 3D FX read). */
export function writeFailure(target, assessment) {
  const { results, worst } = assessment;
  const sev = (id) => results.find((r) => r.id === id)?.result.severity ?? 0;
  const mode = (id) => results.find((r) => r.id === id)?.result.name ?? '';
  target.valvetrain = sev('valvetrain');
  target.pistons = sev('pistons');
  target.cooling = sev('cooling');
  target.bottom_end = sev('bottom_end');
  target.worst = worst;
  target.float = target.valvetrain >= 1;
  target.detonation = mode('pistons').startsWith('Detonation');
  target.holed = mode('pistons').startsWith('Holed');
  target.overheat = target.cooling >= 1;
  target.boilover = mode('cooling').startsWith('Blown');
  target.seized = target.bottom_end >= 2;
  return target;
}

/** A fresh, independent failure object (one per arena engine). */
export function makeFailureState() {
  return {
    valvetrain: 0, pistons: 0, cooling: 0, bottom_end: 0, worst: 0,
    float: false, detonation: false, holed: false, overheat: false, boilover: false, seized: false,
  };
}

/** Reset everything to healthy (engine off / no build). */
export function clearFailures() {
  failureState.valvetrain = 0;
  failureState.pistons = 0;
  failureState.cooling = 0;
  failureState.bottom_end = 0;
  failureState.worst = 0;
  failureState.float = false;
  failureState.detonation = false;
  failureState.holed = false;
  failureState.overheat = false;
  failureState.boilover = false;
  failureState.seized = false;
}
