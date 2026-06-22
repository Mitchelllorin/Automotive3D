/**
 * engineSpec.js — the single source of truth for the engine.
 *
 * Both the geometry (how parts are drawn) and the simulation (how the engine
 * runs) read from here, so a dimension is never defined twice and the moving
 * parts stay mechanically consistent with the castings around them.
 *
 * Modelled on a Gen-I/II Chevrolet Small-Block V8 (the 350 / 5.7L), the most
 * thoroughly documented engine in the world:
 *   bore 4.00", stroke 3.48", rod 5.70", deck 9.025", bore spacing 4.40",
 *   90° vee, firing order 1-8-4-3-6-5-7-2, crank turns clockwise from the front.
 *
 * Real dimensions live in inches and are converted to scene units by SCALE, so
 * every proportion is correct and tweaking one number ripples everywhere.
 */

/** Scene units per inch. Chosen so the block lands at the existing layout size. */
export const SCALE = 0.11;
export const inches = (n) => n * SCALE;

// ── Core dimensions (inches → scene units) ──────────────────────────────────
export const BORE = inches(4.0);
export const STROKE = inches(3.48);
export const ROD_LENGTH = inches(5.7);
export const DECK_HEIGHT = inches(9.025);
export const BORE_SPACING = inches(4.4);
export const CRANK_THROW = STROKE / 2; // crank radius
export const ROD_RATIO = ROD_LENGTH / CRANK_THROW; // ~3.28, drives piston motion

export const BORE_R = BORE / 2;
export const BANK_ANGLE = Math.PI / 4; // 45° per bank → 90° included vee
export const VALLEY = [0, 0.2, 0]; // pivot the banks splay around (scene space)

/** Four cylinder centres along the crank (X) axis, front (+X) → back (-X). */
export const BANK_X = [1.5, 0.5, -0.5, -1.5].map((i) => i * BORE_SPACING);

export const FIRING_ORDER = [1, 8, 4, 3, 6, 5, 7, 2];

/**
 * Per-cylinder map. Bank side +1 = driver/left (odd cylinders), -1 = passenger/
 * right (even). bankIndex 0..3 runs front→back. The crank-pin offset is the
 * firing position × 90°, which reproduces the documented companion pairs
 * (1-6, 5-8, 4-7, 2-3 share a pin angle) — a good correctness check.
 */
function buildCylinders() {
  const left = [1, 3, 5, 7]; // driver bank, front→back
  const right = [2, 4, 6, 8]; // passenger bank, front→back
  const cyl = {};
  const place = (ids, side) =>
    ids.forEach((id, bankIndex) => {
      const firingIndex = FIRING_ORDER.indexOf(id);
      cyl[id] = {
        id,
        side, // +1 driver/left, -1 passenger/right
        bankIndex, // 0 = front
        x: BANK_X[bankIndex],
        firingIndex, // 0..7, position in 1-8-4-3-6-5-7-2
        crankOffsetDeg: (firingIndex % 4) * 90, // piston-phase offset
        powerStrokeDeg: firingIndex * 90, // crank angle (of 720) when it fires
      };
    });
  place(left, +1);
  place(right, -1);
  return cyl;
}

export const CYLINDERS = buildCylinders();
export const CYLINDER_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

// ── Kinematics ──────────────────────────────────────────────────────────────

/**
 * Slider-crank: piston displacement from TDC for a given crank angle (radians),
 * measured along the bore. Returns 0 at TDC, +STROKE at BDC.
 *   x = r(1 - cosθ) + L - sqrt(L² - r²sin²θ)
 */
export function pistonDrop(crankAngleRad) {
  const r = CRANK_THROW;
  const L = ROD_LENGTH;
  const s = Math.sin(crankAngleRad);
  return r * (1 - Math.cos(crankAngleRad)) + L - Math.sqrt(L * L - r * r * s * s);
}

/** Piston drop for a specific cylinder at a global crank angle (radians). */
export function cylinderPistonDrop(id, crankAngleRad) {
  const off = (CYLINDERS[id].crankOffsetDeg * Math.PI) / 180;
  return pistonDrop(crankAngleRad + off);
}

/** Which of the 4 strokes a cylinder is on, given crank angle within 720°. */
export function strokePhase(id, crankAngleRad) {
  const deg = (((crankAngleRad * 180) / Math.PI) % 720 + 720) % 720;
  const local = (deg - CYLINDERS[id].powerStrokeDeg + 720) % 720;
  // 0° = start of power stroke (TDC firing).
  if (local < 180) return 'power';
  if (local < 360) return 'exhaust';
  if (local < 540) return 'intake';
  return 'compression';
}

// ── Valvetrain timing (degrees, relative to TDC) ─────────────────────────────
// A mild street cam: intake opens BTDC, exhaust closes ATDC, ~0.45" lift.
export const CAM = {
  intakeOpenDeg: -10, // BTDC
  intakeDurationDeg: 210,
  exhaustOpenDeg: 360 - 220 + 10,
  exhaustDurationDeg: 220,
  maxLift: inches(0.45),
};

/** Normalised valve lift 0..1 for intake/exhaust of a cylinder at crank angle. */
export function valveLift(id, crankAngleRad, which) {
  const deg = (((crankAngleRad * 180) / Math.PI) % 720 + 720) % 720;
  const local = (deg - CYLINDERS[id].powerStrokeDeg + 720) % 720;
  const open = which === 'intake' ? 540 + CAM.intakeOpenDeg : 180 + CAM.exhaustOpenDeg - 360;
  const dur = which === 'intake' ? CAM.intakeDurationDeg : CAM.exhaustDurationDeg;
  const t = (local - open + 720) % 720;
  if (t > dur) return 0;
  return Math.sin((t / dur) * Math.PI); // smooth open→close hump
}

// ── Fastener layouts (counts/positions the user cares about) ─────────────────
// Documented so geometry and any teardown logic agree on what holds what.
export const FASTENERS = {
  alternator: { count: 3, note: '2 pivot bolts up top, 1 adjuster on the bottom slot' },
  starter: { count: 3, note: '2 main bolts + nose; heavy ground strap on one bolt' },
  exhaustPerPort: { count: 2, note: '≥2 bolts per port to the head, buried behind the headers' },
  oilFilter: { type: 'spin-on', note: 'threaded canister, needs a filter wrench' },
  headBoltsPerHead: 8,
  intakeBolts: 12,
  valveCoverBolts: 4,
  oilPanBolts: 18,
  mainCaps: 5,
};
