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

// ── Valvetrain timing ────────────────────────────────────────────────────────
// Valve events as crank angle on the same `local` clock strokePhase uses, where
// 0° is this cylinder's firing TDC: power 0–180, exhaust 180–360, intake
// 360–540, compression 540–720. A mild street cam (~112° LSA, ~0.45" lift):
// exhaust opens ~50° BBDC and closes ~10° ATDC; intake opens ~10° BTDC and
// closes ~50° ABDC — giving the small overlap around the 360° exhaust/intake
// TDC you'd expect, and keeping both valves shut through the power stroke.
export const CAM = {
  exhaustOpen: 130, // 50° before power-stroke BDC (180)
  exhaustClose: 370, // 10° after exhaust-stroke TDC (360)
  intakeOpen: 350, // 10° before intake-stroke TDC (360)
  intakeClose: 590, // 50° after intake-stroke BDC (540)
  maxLift: inches(0.45),
};

/**
 * The cam that's actually installed right now. Initialised to the stock CAM, it's
 * the single profile the valve animation reads, so swapping camshafts in the
 * Garage retimes and re-lifts the valves live — the same selection that moves the
 * dyno curve also changes how far and how long each valve opens. Mutable like
 * simState/explodeState so the per-frame valvetrain reads it without re-rendering.
 */
export const activeCam = { ...CAM };

/**
 * Resolve a cam profile ({events, maxLiftIn}) into a standalone cam object, filling
 * any omitted field from the stock CAM. Pure — allocates a fresh object and mutates
 * nothing, so the Battle Arena can give each engine its OWN cam (via CamContext)
 * without touching the global `activeCam` the single-engine view reads.
 */
export function makeCam(profile) {
  const cam = { ...CAM };
  if (!profile) return cam;
  const { events, maxLiftIn } = profile;
  if (events) {
    if (events.exhaustOpen != null) cam.exhaustOpen = events.exhaustOpen;
    if (events.exhaustClose != null) cam.exhaustClose = events.exhaustClose;
    if (events.intakeOpen != null) cam.intakeOpen = events.intakeOpen;
    if (events.intakeClose != null) cam.intakeClose = events.intakeClose;
  }
  if (maxLiftIn != null) cam.maxLift = inches(maxLiftIn);
  return cam;
}

/** Install a cam profile into the live (global) cam the single-engine view reads. */
export function setActiveCam(profile) {
  if (!profile) return;
  Object.assign(activeCam, makeCam(profile));
}

/**
 * Normalised valve lift 0..1 for intake/exhaust of a cylinder at crank angle.
 * `cam` defaults to the global activeCam (single-engine); the arena passes each
 * engine's own cam so two different camshafts open their valves on their own timing.
 */
export function valveLift(id, crankAngleRad, which, cam = activeCam) {
  const deg = (((crankAngleRad * 180) / Math.PI) % 720 + 720) % 720;
  const local = (deg - CYLINDERS[id].powerStrokeDeg + 720) % 720;
  const open = which === 'intake' ? cam.intakeOpen : cam.exhaustOpen;
  const close = which === 'intake' ? cam.intakeClose : cam.exhaustClose;
  const dur = (close - open + 720) % 720;
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
