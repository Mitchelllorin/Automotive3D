/**
 * bench.js — the single-motor Performance Test Bench (SOLO mode).
 *
 * Where battle.js runs TWO motors head-to-head until one grenades, the bench runs
 * ONE motor and ramps a single stressor to find its real operating envelope: where
 * it's continuous-safe, where it starts to degrade, and where it fails. It answers
 * "what is THIS motor capable of, and where does it break?"
 *
 * This is a new FRAMING around the existing F.U.S.E. engine, not new physics:
 *   • assessEngine (engineStress.js) is the StressProvider adapter — feed it a live
 *     {rpm, conditions} sample and it returns the failure verdict. The bench only
 *     decides WHAT to ramp; F.U.S.E. owns state + failure, exactly as in battle.
 *   • useEngineBench is a fork of useEngineBattle with the opponent/winner removed
 *     and an envelope recorder added — the simulation step is the same shape.
 *
 * Domain note: this simulates internal-combustion engines, so the stressors are the
 * ones F.U.S.E. actually consumes (rpm, throttle load, ambient heat) — not voltage/
 * current/demag, which don't exist here. If a ramp never leaves the safe zone, the
 * bench reports that honestly; it never fabricates a limit.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { assessEngine, DEFAULT_CONDITIONS } from './engineStress';
import { resolveBuild, computeDyno } from './dyno';
import { DEFAULT_ENGINE } from '../data/engines';

export const BENCH_RAMP_MS = 14000; // idle → top of the sweep
export const BENCH_SETTLE_MS = 1500; // brief hold at the top before calling it
export const TICK_MS = 120; // bench loop period (matches battle.js)

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Severity → phase band (same thresholds the battle uses). */
function phaseFor(severity) {
  if (severity >= 2) return 'failed';
  if (severity >= 1.2) return 'critical';
  if (severity >= 0.45) return 'stressed';
  return 'nominal';
}

/**
 * The stressors the bench can ramp. Each is a thin recipe over assessEngine:
 *   range(ctx)    → [from, to] in the stressor's own units (e.g. rpm)
 *   valueAt(p,c)  → the stressor's current value at ramp progress p (0..1)
 *   sample(p,c)   → the {rpm, conditions} to feed assessEngine at p (only this
 *                   axis moves; everything else is held at the baseline)
 * ctx = { engine, build, base (conditions), range, dyno }
 *
 * `clean: true` marks a stressor guaranteed to reach a failure on any build (rpm).
 * The others reach a real limit only for builds/conditions that actually fail —
 * which is correct, and surfaced honestly by the envelope.
 */
export const STRESSORS = {
  rpm: {
    id: 'rpm',
    label: 'Speed — RPM sweep',
    short: 'Overspeed',
    unit: 'rpm',
    axisLabel: 'Engine speed (rpm)',
    clean: true,
    blurb: 'Wind it out past redline at wide-open throttle until the valvetrain floats and the bottom end lets go.',
    // Sweep from idle to comfortably past the valve-float ceiling so a failure is
    // always reached (valve float hits "failed" at ~1.29× redline on any engine).
    range: ({ dyno }) => [800, Math.round(dyno.redline * 1.5)],
    valueAt: (p, ctx) => Math.round(lerp(ctx.range[0], ctx.range[1], p)),
    sample: (p, ctx) => ({ rpm: ctx.stressorValue, conditions: ctx.base }),
  },
  load: {
    id: 'load',
    label: 'Load — torque / throttle ramp',
    short: 'Load',
    unit: '% load',
    axisLabel: 'Engine load (% of WOT)',
    clean: false,
    blurb: 'Hold rpm at the torque peak and pile on load until it knocks or boils over. A mild, well-fuelled build may take it.',
    range: () => [0, 120],
    valueAt: (p, ctx) => Math.round(lerp(ctx.range[0], ctx.range[1], p)),
    // Held at the torque-peak rpm; loadFraction climbs (100% = WOT, >100% = lugging).
    sample: (p, ctx) => ({
      rpm: ctx.dyno.peakTq.rpm,
      conditions: { ...ctx.base, loadFraction: ctx.stressorValue / 100 },
    }),
  },
  heat: {
    id: 'heat',
    label: 'Heat — ambient / duty cycle',
    short: 'Heat soak',
    unit: '°F ambient',
    axisLabel: 'Ambient / underhood temp (°F)',
    clean: false,
    blurb: 'Sustained wide-open throttle while underhood temperature climbs — find where the cooling system gives up.',
    range: () => [75, 165],
    valueAt: (p, ctx) => Math.round(lerp(ctx.range[0], ctx.range[1], p)),
    sample: (p, ctx) => ({
      rpm: ctx.dyno.peakTq.rpm,
      conditions: { ...ctx.base, ambientF: ctx.stressorValue, loadFraction: 1 },
    }),
  },
};

export const STRESSOR_LIST = Object.values(STRESSORS);

/** Build the per-run context once (resolves redline / torque peak from the build). */
function makeCtx(build, engine, base, stressorId) {
  const stressor = STRESSORS[stressorId] ?? STRESSORS.rpm;
  const dyno = computeDyno(build, undefined, engine);
  const ctx = { engine, build, base, dyno, redline: resolveBuild(build, engine).redline };
  ctx.range = stressor.range(ctx);
  return { stressor, ctx };
}

/**
 * Evaluate the motor at one point in the ramp. Reuses assessEngine wholesale — the
 * bench never re-derives failure, it only chooses the sample. Mirrors battle's
 * evaluateSide, minus anything opponent-related.
 */
export function evaluateBench(progress, stressor, ctx) {
  ctx.stressorValue = stressor.valueAt(progress, ctx);
  const { rpm, conditions } = stressor.sample(progress, ctx);
  const { results, worst, state } = assessEngine(ctx.build, rpm, conditions, ctx.engine);
  const severity = clamp(worst, 0, 3);
  const lead = results.reduce((m, r) => (r.result.severity > (m?.result.severity ?? -1) ? r : m), null);
  return {
    value: ctx.stressorValue,
    rpm,
    severity,
    integrity: clamp(100 * (1 - severity / 2), 0, 100),
    phase: phaseFor(severity),
    coolantF: state.coolantF,
    egtF: state.egtF,
    leadSystem: lead?.label ?? null,
    leadMode: lead?.result.name ?? null,
    leadVisual: lead?.result.visual ?? null,
  };
}

/**
 * Derive the operating envelope from the recorded trace: the highest stressor value
 * still continuous-safe, the value degradation begins, the value it goes critical,
 * and the value it failed. `null` thresholds mean "never reached in this sweep".
 */
export function envelopeFromTrace(trace, stressor) {
  let continuousSafe = null; // last value with severity < 0.45 (still cool/clean)
  let degrade = null; // first value severity ≥ 0.45 (intermittent / falling off)
  let critical = null; // first value severity ≥ 1.2
  let failure = null; // first value severity ≥ 2 (the limit)
  for (const t of trace) {
    if (t.severity < 0.45) continuousSafe = t.value;
    if (degrade == null && t.severity >= 0.45) degrade = t.value;
    if (critical == null && t.severity >= 1.2) critical = t.value;
    if (failure == null && t.severity >= 2) { failure = t.value; break; }
  }
  return { unit: stressor.unit, continuousSafe, degrade, critical, failure, reachedFailure: failure != null };
}

const cap = (entries) => entries.slice(-24);

function initialState(stressor, ctx) {
  const t0 = evaluateBench(0, stressor, ctx);
  return {
    status: 'ready', // ready | running | complete
    elapsedMs: 0,
    progress: 0,
    telemetry: t0,
    trace: [{ value: t0.value, severity: t0.severity, integrity: t0.integrity, rpm: t0.rpm }],
    envelope: null,
    log: [{ id: 'intro', kind: 'system', message: `Bench armed — ramping ${stressor.label.toLowerCase()} to find the limit. Hit Start.` }],
  };
}

function step(prev, stressor, ctx) {
  if (prev.status !== 'running') return prev;
  const elapsedMs = prev.elapsedMs + TICK_MS;
  const progress = clamp(elapsedMs / BENCH_RAMP_MS, 0, 1);
  const t = evaluateBench(progress, stressor, ctx);
  const trace = [...prev.trace, { value: t.value, severity: t.severity, integrity: t.integrity, rpm: t.rpm }];
  const newLogs = [];

  // Cross-band annotations (only on the first crossing).
  const was = prev.telemetry.phase;
  if (t.phase !== was) {
    if (t.phase === 'stressed') newLogs.push({ id: `deg-${elapsedMs}`, kind: 'warning', message: `Leaving the safe zone — ${t.leadSystem ?? 'stress'} at ${t.value.toLocaleString()} ${stressor.unit}.` });
    else if (t.phase === 'critical') newLogs.push({ id: `crit-${elapsedMs}`, kind: 'warning', message: `⚠ ${t.leadSystem ?? 'critical'} — ${t.leadMode ?? ''} at ${t.value.toLocaleString()} ${stressor.unit}.` });
  }

  const failed = t.phase === 'failed';
  const settleDone = progress >= 1 && elapsedMs >= BENCH_RAMP_MS + BENCH_SETTLE_MS;

  if (!failed && !settleDone) {
    return { ...prev, status: 'running', elapsedMs, progress, telemetry: t, trace, log: cap([...prev.log, ...newLogs]) };
  }

  const envelope = envelopeFromTrace(trace, stressor);
  const verdict = failed
    ? { id: `fail-${elapsedMs}`, kind: 'failure', message: `💥 Failed — ${t.leadMode ?? 'destroyed'} at ${t.value.toLocaleString()} ${stressor.unit}.` }
    : { id: `survive-${elapsedMs}`, kind: 'verdict', message: `✅ Held together to the top of the sweep (${t.value.toLocaleString()} ${stressor.unit}). No limit reached in range.` };
  return { ...prev, status: 'complete', elapsedMs, progress, telemetry: t, trace, envelope, log: cap([...prev.log, ...newLogs, verdict]) };
}

/**
 * React hook driving a single-motor bench run. Fork of useEngineBattle: one motor,
 * no opponent, no winner — instead it records the operating envelope.
 * @param build       the {category: variantId} part map under test
 * @param engine      the active engine package
 * @param stressorId  which axis to ramp ('rpm' | 'load' | 'heat')
 * @param base        baseline operating conditions (defaults to WOT, warm day)
 * @returns { status, progress, value, telemetry, trace, envelope, log, stressor, start, reset }
 */
export function useEngineBench(build, engine = DEFAULT_ENGINE, stressorId = 'rpm', base = DEFAULT_CONDITIONS) {
  // Rebuild the run context whenever the motor / build / stressor changes.
  const { stressor, ctx } = useMemo(
    () => makeCtx(build, engine, base, stressorId),
    [JSON.stringify(build), engine, stressorId, JSON.stringify(base)]
  );

  const [state, setState] = useState(() => initialState(stressor, ctx));
  useEffect(() => setState(initialState(stressor, ctx)), [stressor, ctx]);

  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = window.setInterval(() => setState((p) => step(p, stressor, ctx)), TICK_MS);
    return () => window.clearInterval(id);
  }, [state.status, stressor, ctx]);

  const start = useCallback(() => setState((p) => (p.status === 'running' ? p : { ...initialState(stressor, ctx), status: 'running' })), [stressor, ctx]);
  const reset = useCallback(() => setState(initialState(stressor, ctx)), [stressor, ctx]);

  return { ...state, value: state.telemetry.value, stressor, start, reset };
}
