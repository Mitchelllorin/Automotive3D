/**
 * dyno.js — the performance model that turns a part build into power.
 *
 * This is what makes a swap mean something: bolt on a bigger carb, a hotter cam,
 * better heads, and the torque/HP curve actually moves — the same way it would on
 * a real engine dyno. The model is airflow-limited, the way a real naturally-
 * aspirated engine is, so the *direction* of every change is mechanically honest:
 *
 *   • Displacement is real — derived straight from the bore/stroke in engineSpec
 *     (4.00 × 3.48 × 8 = 350 ci), so torque scales with cubic inches.
 *   • Torque ∝ displacement × BMEP, and BMEP tracks volumetric efficiency (VE) —
 *     how completely each cylinder fills with air. Parts that help the engine
 *     breathe (heads, intake, cam, exhaust) raise the VE *ceiling*.
 *   • The VE curve is a hump: it peaks at an rpm set by the cam/intake tuning and
 *     falls off either side. A big cam moves the peak up the tach and trades away
 *     low-end; a torquey RV cam keeps it down low.
 *   • The carburetor sets a hard airflow ceiling. Ask a 600 cfm carb to feed a
 *     350 past ~5500 and it runs out of breath — the curve flattens and noses
 *     over. A 750 double-pumper or EFI lets it pull to the redline. This is the
 *     single most "felt" swap, and it falls out of the physics, not a fudge.
 *
 *   HP = Torque × RPM / 5252  (the real identity — the curves always cross there).
 *
 * Calibrated so a stock 4-bbl 350 lands around 300 hp / 335 lb-ft and a worked
 * street build (alloy heads, Air-Gap, 750 DP, long-tubes, a healthy cam) walks up
 * toward ~395 hp / ~405 lb-ft with the peaks moved up — numbers a builder reads
 * as "yeah, that's about right."
 */

import { DEFAULT_ENGINE } from '../data/engines';

// The model is driven by an *engine package* (data/engines/) — displacement, the
// parts catalog, which categories make power, and the dyno calibration all come
// from there, so a second motor is a new package, not an edit to this file. The
// SBC stays the default so every existing call keeps working unchanged.

export const DISPLACEMENT_CI = DEFAULT_ENGINE.displacementCI; // back-compat: the SBC's
export const DISPLACEMENT_L = DISPLACEMENT_CI * 0.0163871;

/** The performance categories for the default engine (back-compat export). */
export const PERF_CATEGORIES = DEFAULT_ENGINE.perfCategories;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Resolve a category's active variant against an engine's own catalog. */
function pickVariant(engine, cat, selectedId) {
  const list = engine.products[cat]?.variants;
  if (!list) return null;
  return list.find((v) => v.id === selectedId) ?? list[0];
}

// ── Environment ───────────────────────────────────────────────────────────────
// A naturally-aspirated engine makes power in proportion to the *mass* of air it
// can pack into each cylinder, so the weather and the elevation matter — a 350
// that makes 425 hp at sea level on a cool day loses a fifth of that in Denver in
// August. This is the lever that makes the arena interesting: the part that wins
// at the coast can lose at altitude.
export const STANDARD_DAY = { label: 'Sea level · 59°F', altitudeFt: 0, airTempF: 59 };
export const ENVIRONMENTS = [
  STANDARD_DAY,
  { label: 'Hot day · 95°F', altitudeFt: 0, airTempF: 95 },
  { label: 'Mile high (Denver)', altitudeFt: 5280, airTempF: 75 },
  { label: 'Denver, August heat', altitudeFt: 5280, airTempF: 95 },
  { label: 'Pikes Peak summit', altitudeFt: 14115, airTempF: 45 },
  { label: 'Cold, dense air · 35°F', altitudeFt: 0, airTempF: 35 },
];

/**
 * Relative air density vs a standard day (1.0 at sea level / 59°F). Standard
 * atmosphere for the pressure drop with altitude, ideal-gas for temperature.
 * NA power scales ~linearly with this.
 */
export function airDensityRatio(env = STANDARD_DAY) {
  const altFt = env.altitudeFt ?? 0;
  const tempF = env.airTempF ?? 59;
  const pressureRatio = Math.pow(Math.max(0, 1 - 6.875e-6 * altFt), 5.2559);
  const tempRatio = 518.67 / (459.67 + tempF); // Rankine, vs 59°F standard
  return pressureRatio * tempRatio;
}

/**
 * Resolve the active part for each performance category into a single set of
 * build parameters, starting from the engine's own dyno calibration. An
 * unselected category falls back to that engine's OEM/stock variant.
 */
export function resolveBuild(partVariants = {}, engine = DEFAULT_ENGINE) {
  const cal = engine.dyno;
  let ve = cal.baseVe;
  let peakRpm = cal.basePeakRpm;
  let carbCfm = 600; // sensible default if no airflow part resolved
  let redline = 5200;
  let lowWidth = 1450; // rpm spread of the torque hump below the peak
  let highWidth = 1850; // …and above it (broader → power carries up top)
  let lopiness = 0; // 0 smooth idle … 1 race-cam lope (display flavor)
  const parts = {};

  for (const cat of engine.perfCategories) {
    const variant = pickVariant(engine, cat, partVariants[cat]);
    parts[cat] = variant;
    const p = variant?.perf;
    if (!p) continue;
    if (p.ve) ve += p.ve;
    if (p.peakRpm) peakRpm += p.peakRpm;
    if (p.cfm) carbCfm = p.cfm; // the airflow part owns the breathing ceiling
    if (p.redline) redline = p.redline; // the cam owns how high it will spin
    if (p.lowWidth) lowWidth = p.lowWidth;
    if (p.highWidth) highWidth = p.highWidth;
    if (p.lopiness) lopiness = p.lopiness;
  }

  return {
    vePeak: clamp(ve, 0.4, cal.veCeiling),
    peakRpm,
    carbCfm,
    redline,
    lowWidth,
    highWidth,
    lopiness,
    parts,
  };
}

/** Asymmetric bell: 1.0 at the peak, narrower below, broader above. */
function veShape(rpm, peakRpm, lowWidth, highWidth) {
  const w = rpm < peakRpm ? lowWidth : highWidth;
  const x = (rpm - peakRpm) / w;
  return Math.exp(-0.5 * x * x);
}

/** Airflow ceiling: 1.0 until demand approaches the carb/throttle capacity, then noses over. */
function carbCeiling(rpm, carbCfm, engine) {
  // Air the engine wants at 100% VE: CFM = ci × rpm / 3456 (the 3456 folds in
  // cubic-inches-per-cubic-foot and the two crank revs per 4-stroke cycle).
  const demand = (engine.displacementCI * rpm) / 3456;
  const ratio = demand / (carbCfm * engine.dyno.carbK);
  return 1 / Math.sqrt(1 + Math.pow(Math.max(0, ratio), engine.dyno.carbN));
}

/** Instantaneous torque (lb-ft) and VE at an rpm for a resolved build. */
function torqueAt(rpm, b, engine) {
  const ve = b.vePeak * veShape(rpm, b.peakRpm, b.lowWidth, b.highWidth) * carbCeiling(rpm, b.carbCfm, engine);
  // Torque from BMEP: T(lb-ft) = BMEP(psi) × displacement(ci) / (75.4 × revs/cycle).
  // revs/cycle = 2 for a 4-stroke → divisor 150.8.
  const bmep = engine.dyno.bmepAtVe1 * ve;
  const tq = (bmep * engine.displacementCI) / 150.8;
  return { tq, ve };
}

/**
 * Compute the full dyno pull for a build, corrected for the environment.
 * @param partVariants store's {category: variantId} map (or {} for all-stock)
 * @param env one of ENVIRONMENTS (defaults to a standard sea-level day)
 * @param engine the active engine package (defaults to the Small-Block)
 * @returns {curve, peakHp, peakTq, redline, displacementCI, densityRatio, build}
 */
export function computeDyno(partVariants = {}, env = STANDARD_DAY, engine = DEFAULT_ENGINE) {
  const b = resolveBuild(partVariants, engine);
  const density = airDensityRatio(env); // NA power scales with air density
  const idleRpm = engine.dyno.idleRpm;
  const step = 100;
  const curve = [];
  let peakHp = { value: 0, rpm: idleRpm };
  let peakTq = { value: 0, rpm: idleRpm };

  for (let rpm = idleRpm; rpm <= b.redline; rpm += step) {
    const tq = torqueAt(rpm, b, engine).tq * density;
    const hp = (tq * rpm) / 5252;
    curve.push({ rpm, tq, hp });
    if (hp > peakHp.value) peakHp = { value: hp, rpm };
    if (tq > peakTq.value) peakTq = { value: tq, rpm };
  }

  return {
    curve,
    peakHp: { value: Math.round(peakHp.value), rpm: peakHp.rpm },
    peakTq: { value: Math.round(peakTq.value), rpm: peakTq.rpm },
    redline: b.redline,
    displacementCI: engine.displacementCI,
    densityRatio: density,
    lopiness: b.lopiness,
    build: b,
  };
}

/** Interpolate instantaneous output at an arbitrary rpm (for the live readout). */
export function outputAtRpm(dyno, rpm) {
  const c = dyno.curve;
  if (!c.length) return { tq: 0, hp: 0 };
  if (rpm <= c[0].rpm) return { tq: 0, hp: 0 }; // below idle the engine makes no usable power
  for (let i = 1; i < c.length; i++) {
    if (rpm <= c[i].rpm) {
      const a = c[i - 1];
      const bb = c[i];
      const t = (rpm - a.rpm) / (bb.rpm - a.rpm);
      return { tq: a.tq + (bb.tq - a.tq) * t, hp: a.hp + (bb.hp - a.hp) * t };
    }
  }
  const last = c[c.length - 1];
  return { tq: last.tq, hp: last.hp };
}

/** Total cost of the installed build — sum of every active variant's price. */
export function buildCost(partVariants = {}, engine = DEFAULT_ENGINE) {
  let total = 0;
  for (const cat of Object.keys(engine.products)) {
    const v = pickVariant(engine, cat, partVariants[cat]);
    if (v && typeof v.price === 'number') total += v.price;
  }
  return total;
}

/**
 * Builder-grade derived metrics from a dyno result — the numbers a pro quotes.
 * @returns {hpPerL, hpPerCI, bmep, pistonSpeed, lbPerHp, hpPerTon, band:{lo,hi,width}, specTq}
 */
export function dynoMetrics(dyno, engine = DEFAULT_ENGINE) {
  const disp = engine.displacementCI;
  const litres = disp * 0.0163871;
  const hp = dyno.peakHp.value;
  const tq = dyno.peakTq.value;
  const weight = engine.weightLb ?? 3400;

  // BMEP at peak torque (psi): T = BMEP·disp/150.8 ⇒ BMEP = T·150.8/disp.
  const bmep = (tq * 150.8) / disp;
  // Mean piston speed at redline (ft/min): stroke(in) × rpm / 6. >4000 = stressed.
  const pistonSpeed = ((engine.strokeIn ?? 3.48) * dyno.redline) / 6;
  // Power band: the rpm window holding ≥90% of peak hp.
  const thresh = hp * 0.9;
  const hot = dyno.curve.filter((p) => p.hp >= thresh);
  const band = hot.length
    ? { lo: hot[0].rpm, hi: hot[hot.length - 1].rpm, width: hot[hot.length - 1].rpm - hot[0].rpm }
    : { lo: dyno.peakHp.rpm, hi: dyno.peakHp.rpm, width: 0 };

  return {
    hpPerL: hp / litres,
    hpPerCI: hp / disp,
    bmep,
    pistonSpeed,
    lbPerHp: weight / Math.max(1, hp),
    hpPerTon: hp / (weight / 2000),
    specTq: tq / disp,
    band,
    litres,
  };
}

/** Peak HP/TQ this part adds over the stock part for its category, in the current build. */
export function partGain(componentId, partVariants, engine = DEFAULT_ENGINE) {
  if (!engine.perfCategories.includes(componentId)) return null;
  const withPart = computeDyno(partVariants, STANDARD_DAY, engine);
  // Same build but this one category forced back to OEM (variantId undefined → list[0]).
  const stockForCat = { ...partVariants, [componentId]: undefined };
  const withStock = computeDyno(stockForCat, STANDARD_DAY, engine);
  return {
    hp: withPart.peakHp.value - withStock.peakHp.value,
    tq: withPart.peakTq.value - withStock.peakTq.value,
  };
}
