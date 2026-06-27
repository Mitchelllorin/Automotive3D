/**
 * engineStress.js — the domain bridge between the build and F.U.S.E.
 *
 * F.U.S.E. (lib/fuse.js) is pure: give it a component and a set of operating
 * metrics and it tells you what fails. This file produces those metrics from the
 * actual engine you've built and how you're running it — the same specs the dyno
 * reads (cam redline, head compression, cooling parts) plus the live conditions
 * (rpm, throttle load, ambient heat, altitude, fuel octane). Push the build past
 * what its parts can take and the failures fall out on their own.
 */
import { resolveBuild, airDensityRatio } from './dyno';
import { DEFAULT_ENGINE } from '../data/engines';
import { detectFailure, requiredOctane } from './fuse';

function pick(engine, cat, id) {
  const list = engine.products[cat]?.variants;
  if (!list) return null;
  return list.find((v) => v.id === id) ?? list[0];
}

/** Cooling capacity (≈1.0 stock) from the installed water pump + fan. */
export function coolingCapacity(partVariants, engine = DEFAULT_ENGINE) {
  const wp = pick(engine, 'water_pump', partVariants.water_pump);
  const fan = pick(engine, 'cooling_fan', partVariants.cooling_fan);
  return 0.5 + (wp?.cool ?? 0.3) + (fan?.cool ?? 0.18);
}

/** Default operating conditions — WOT on a warm day at sea level with pump gas. */
export const DEFAULT_CONDITIONS = { ambientF: 75, altitudeFt: 0, octane: 91, loadFraction: 1 };

export const FUELS = [
  { label: '87 regular', octane: 87 },
  { label: '91 premium', octane: 91 },
  { label: '93 premium', octane: 93 },
  { label: '100 race gas', octane: 100 },
];

/**
 * The engine's operating state for a build + conditions: the rated limits its
 * parts impose (redline, compression, cooling) and the resulting coolant temp.
 */
export function operatingState(partVariants, conditions = DEFAULT_CONDITIONS, engine = DEFAULT_ENGINE) {
  const b = resolveBuild(partVariants, engine);
  const cr = b.parts.cylinder_head?.perf?.cr ?? 9.0;
  const cool = coolingCapacity(partVariants, engine);
  // The block sets how much over-rev the bottom end survives before a rod lets go.
  const block = pick(engine, 'engine_block', partVariants.engine_block);
  const blockStrength = block?.perf?.strength ?? 1.0;
  // Thin, hot air sheds heat from the radiator less effectively.
  const density = airDensityRatio({ altitudeFt: conditions.altitudeFt, airTempF: conditions.ambientF });
  const coolEff = cool * (0.8 + 0.2 * density);
  const load = conditions.loadFraction;
  const coolantF = conditions.ambientF + 95 + (load * 70) / coolEff;
  // Oil runs a bit hotter than coolant under load; intake air heat-soaks off the
  // engine bay; EGT climbs with load and runs hotter when the charge is knocking.
  const oilF = coolantF + 12 + load * 22;
  const iatF = conditions.ambientF + 18 + load * 16;
  // Knock (octane below what the charge demands) drives EGT up.
  const knockMargin =
    conditions.octane - requiredOctane({ compressionRatio: cr, loadFraction: load, ambientF: conditions.ambientF });
  const egtF = 1000 + load * 430 + (knockMargin < 0 ? Math.min(180, -knockMargin * 18) : 0);
  return {
    redline: b.redline,
    compressionRatio: cr,
    coolingCapacity: cool,
    blockStrength,
    coolantF,
    oilF,
    iatF,
    egtF,
    ambientF: conditions.ambientF,
    octane: conditions.octane,
    loadFraction: load,
  };
}

/** The components F.U.S.E. watches, with the props that set their limits. */
export function fuseComponents(state) {
  return [
    { id: 'valvetrain', label: 'Valvetrain', type: 'valvetrain', properties: { redline: state.redline } },
    { id: 'pistons', label: 'Pistons & Rings', type: 'pistons', properties: { compressionRatio: state.compressionRatio } },
    { id: 'cooling', label: 'Cooling System', type: 'cooling', properties: { coolingCapacity: state.coolingCapacity } },
    { id: 'bottom_end', label: 'Bottom End', type: 'bottom_end', properties: { redline: state.redline } },
  ];
}

/**
 * Build-time F.U.S.E. guidance: what's likely to break, and under what conditions,
 * for a build you're assembling — *before* you ever run it. Evaluates the combo at
 * a hard street worst-case (WOT, hot day) and reports fuel needs, the bottom-end
 * limit, the valve-float ceiling, and cooling margin, so the builder sees the
 * weak links while choosing parts.
 * @returns array of { level: 'ok'|'info'|'warn'|'risk', text }
 */
export function buildAdvisories(partVariants, engine = DEFAULT_ENGINE) {
  const s = operatingState(partVariants, { ambientF: 95, altitudeFt: 0, octane: 91, loadFraction: 1 }, engine);
  const cr = s.compressionRatio;
  const out = [];

  // Fuel / detonation — what octane the compression demands at WOT.
  const req = Math.round(requiredOctane({ compressionRatio: cr, loadFraction: 1, ambientF: 90 }));
  if (req <= 88) out.push({ level: 'ok', text: `Happy on 87 regular (${cr.toFixed(1)}:1 compression).` });
  else if (req <= 92) out.push({ level: 'warn', text: `Wants 91 premium — ${cr.toFixed(1)}:1 will ping on regular.` });
  else if (req <= 96) out.push({ level: 'warn', text: `Needs 93 premium (${cr.toFixed(1)}:1) — right at the pump-gas limit.` });
  else out.push({ level: 'risk', text: `Race gas only (~${req} octane). This compression detonates on pump gas.` });

  // Bottom end — the rpm a thrown rod becomes likely, set by the block.
  const rodLimit = Math.round(s.redline * 1.22 * s.blockStrength);
  if (s.blockStrength < 1.1 && s.redline >= 6000) {
    out.push({ level: 'risk', text: `Stock 2-bolt block is the weak link — rod risk past ~${rodLimit.toLocaleString()} rpm. A 4-bolt block buys headroom.` });
  } else if (s.blockStrength < 1.1 && s.redline >= 5400) {
    out.push({ level: 'warn', text: `Stock block holds to ~${rodLimit.toLocaleString()} rpm — fine unless you over-rev it.` });
  } else {
    out.push({ level: 'ok', text: `Bottom end good to ~${rodLimit.toLocaleString()} rpm.` });
  }

  // Valvetrain ceiling.
  out.push({ level: 'info', text: `Valves float past ~${s.redline.toLocaleString()} rpm — that's the cam's ceiling.` });

  // Cooling margin at sustained WOT in heat.
  if (s.coolantF > 250) out.push({ level: 'risk', text: `Cooling can't cope — overheats at sustained WOT in heat. Step up the pump/fan.` });
  else if (s.coolantF > 235) out.push({ level: 'warn', text: `Cooling is marginal in summer heat.` });
  else out.push({ level: 'ok', text: `Cooling has margin.` });

  return out;
}

/**
 * Run F.U.S.E. over the whole engine at a given rpm.
 * @returns {results: [{id,label,result}], worst, state, metrics}
 */
export function assessEngine(partVariants, rpm, conditions = DEFAULT_CONDITIONS, engine = DEFAULT_ENGINE) {
  const state = operatingState(partVariants, conditions, engine);
  const metrics = { ...state, rpm };
  const results = fuseComponents(state).map((c) => ({
    id: c.id,
    label: c.label,
    result: detectFailure({ type: c.type, properties: c.properties }, metrics),
  }));
  const worst = results.reduce((mx, r) => Math.max(mx, r.result.severity), 0);
  return { results, worst, state, metrics };
}
