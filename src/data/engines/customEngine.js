/**
 * customEngine.js — the user-designed motor.
 *
 * This is the heart of the custom-build system: it lets a user *design* a motor
 * (bore, stroke, compression, induction) rather than only pick a roster one and
 * swap parts. A custom build is stored as a tiny spec; `makeCustomEngine` turns it
 * into a full engine package shaped exactly like the hand-written roster packages
 * (smallBlockV8.js, inline4.js, …), so the dyno, garage, F.U.S.E. and arena all
 * consume it unchanged — they never need to know a motor was user-designed.
 *
 * A custom motor is built ON a base platform (an existing roster package). It
 * inherits that platform's 3D assembly, its parts catalog, its performance
 * categories and its dyno calibration — and overrides what the user designed:
 * displacement (from bore × stroke × cylinders), compression ratio, and induction.
 * Cylinder count + architecture stay the base platform's for now, because the 3D
 * model is the base assembly until parametric geometry lands (Phase 2) — a 350 and
 * a 383 already look identical, so bore/stroke/CR/boost is an honest, shippable set.
 */
import { getEngine, engineList, registerEngine, unregisterEngine } from './index';

/** Cubic inches from bore (in), stroke (in) and cylinder count. */
export function displacementOf(boreIn, strokeIn, cylinders) {
  return (Math.PI / 4) * boreIn * boreIn * strokeIn * cylinders;
}

/**
 * Realism guardrails per base platform — the envelope a pro would call sane for the
 * block (max safe overbore, stroke a balanced rotating assembly clears, pump-to-race
 * compression). Keyed by the base package's assemblyId; a sensible default covers
 * anything new. The mechanic judges these, so they're deliberately conservative.
 */
const DESIGN_LIMITS = {
  engine: { bore: [3.875, 4.165], stroke: [3.0, 4.0], comp: [7.5, 13.5] }, // Small-Block Chevy V8
  inline4: { bore: [3.1, 3.5], stroke: [3.0, 3.8], comp: [7.5, 12.0] }, // 2.0L four
};
const DEFAULT_LIMITS = { bore: [3.0, 4.3], stroke: [2.8, 4.2], comp: [7.0, 14.0] };

export function designLimits(baseEngineId) {
  const base = getEngine(baseEngineId);
  return DESIGN_LIMITS[base.assemblyId] || DEFAULT_LIMITS;
}

/** The platforms a custom motor can be built on — the roster's real, drawn engines. */
export function basePlatforms() {
  // Available, non-custom packages (the ones that actually have a 3D assembly).
  return engineList().filter((e) => e.available && !e.custom);
}

const INDUCTION_LABEL = { na: 'Naturally Aspirated', turbo: 'Turbocharged', super: 'Supercharged' };
const INDUCTION_BADGE = { na: 'NA', turbo: 'Turbo', super: 'Supercharged' };

/** A blank spec seeded from a base platform — the designer's starting point. */
export function defaultSpec(baseEngineId) {
  const base = getEngine(baseEngineId);
  const lim = designLimits(baseEngineId);
  return {
    id: null,
    name: '',
    baseEngineId: base.id,
    boreIn: base.boreIn,
    strokeIn: base.strokeIn,
    cylinders: base.cylinders,
    compression: Math.min(Math.max(9.5, lim.comp[0]), lim.comp[1]),
    induction: 'na',
    boostPsi: 0,
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Synthesize a full engine package from a custom spec. Pure — no side effects, so it
 * can power the live designer preview before the build is ever saved.
 */
export function makeCustomEngine(spec) {
  const base = getEngine(spec.baseEngineId);
  const lim = designLimits(spec.baseEngineId);
  const cyl = spec.cylinders ?? base.cylinders;
  const boreIn = clamp(spec.boreIn ?? base.boreIn, lim.bore[0], lim.bore[1]);
  const strokeIn = clamp(spec.strokeIn ?? base.strokeIn, lim.stroke[0], lim.stroke[1]);
  const compression = clamp(spec.compression ?? 9.5, lim.comp[0], lim.comp[1]);
  const induction = spec.induction ?? 'na';
  const boostPsi = induction === 'na' ? 0 : Math.max(0, spec.boostPsi ?? 0);
  const disp = displacementOf(boreIn, strokeIn, cyl);
  const name = (spec.name || '').trim() || `Custom ${Math.round(disp)} ci`;

  return {
    // Inherit the platform's catalog, assembly, perf categories and dyno calibration…
    ...base,
    // …then override identity + the designed parameters.
    id: spec.id || 'custom:draft',
    name,
    shortName: name.length <= 13 ? name : `${Math.round(disp)} ci`,
    badge: `${base.badge.split(' · ')[0]} · ${INDUCTION_BADGE[induction]} · Custom`,
    available: true,
    custom: true,
    baseEngineId: base.id,
    assemblyId: base.assemblyId,
    boreIn,
    strokeIn,
    cylinders: cyl,
    displacementCI: disp,
    compression, // drives the dyno's compression factor + F.U.S.E. detonation
    induction,
    inductionLabel: INDUCTION_LABEL[induction],
    boostPsi,
    spec: { ...spec, boreIn, strokeIn, compression, induction, boostPsi, cylinders: cyl },
  };
}

// ── Persistence + registration ──────────────────────────────────────────────────
// Custom specs live in localStorage; on startup we synthesize each into a package and
// register it so getEngine(id) resolves it everywhere (arena, saved builds, roster).
export const CUSTOM_KEY = 'a3d:customEngines';

export function loadCustomSpecs() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(CUSTOM_KEY)) || [];
  } catch {
    return [];
  }
}

function persist(specs) {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(specs)); } catch { /* ignore */ }
  }
}

/** Synthesize + register every saved custom engine. Call once at startup. */
export function registerSavedCustomEngines() {
  const out = [];
  for (const spec of loadCustomSpecs()) {
    try { out.push(registerEngine(makeCustomEngine(spec))); } catch { /* skip bad spec */ }
  }
  return out;
}

/** Create or update a custom engine: persist the spec, (re)register the package. */
export function saveCustomEngine(spec) {
  const id = spec.id || `custom:${specStamp(spec)}`;
  const withId = { ...spec, id };
  const specs = loadCustomSpecs();
  const idx = specs.findIndex((s) => s.id === id);
  if (idx >= 0) specs[idx] = withId;
  else specs.push(withId);
  persist(specs);
  return registerEngine(makeCustomEngine(withId));
}

/** Remove a custom engine from storage + the live registry. */
export function deleteCustomEngine(id) {
  persist(loadCustomSpecs().filter((s) => s.id !== id));
  unregisterEngine(id);
}

// A stable-ish id without Date.now()/Math.random() (both unavailable in some
// sandboxes): hash the defining parameters. Two identical specs collapse to one,
// which is fine — they describe the same motor.
function specStamp(spec) {
  const key = `${spec.baseEngineId}|${spec.boreIn}|${spec.strokeIn}|${spec.compression}|${spec.induction}|${spec.boostPsi}|${spec.name}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export { INDUCTION_LABEL, INDUCTION_BADGE };
