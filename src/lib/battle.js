/**
 * battle.js — the engine Stress Battle: the F.U.S.E.-driven duel orchestration.
 *
 * Faithful to CircuiTry3D's Component Arena (stressTest.ts + useArenaBattle.ts),
 * adapted to engines. Two builds are run head-to-head on a stress ramp: absolute
 * rpm climbs from idle toward the moon while throttle load and underhood heat
 * build, and every tick F.U.S.E. (via engineStress.assessEngine) judges each
 * engine independently. Integrity falls as severity rises; the first motor to
 * grenade (severity ≥ 2) loses. Same physics that drive the dyno and the failure
 * effects — so the engine with the weaker combo for THIS abuse fails first, for a
 * real reason (valve float, detonation, overheat, thrown rod).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { assessEngine, DEFAULT_CONDITIONS } from './engineStress';
import { DEFAULT_ENGINE } from '../data/engines';

/** Rival builds you can square off against in the arena. */
export const RIVALS = [
  { id: 'stock', label: 'Bone-Stock 350', build: {} },
  {
    id: 'bolton',
    label: 'Weekend Bolt-Ons',
    build: { intake_manifold: 'edel-performer', carburetor: 'holley-4150', exhaust_manifold: 'hedman-black', air_cleaner: 'kn-chrome' },
  },
  {
    id: 'fullsend',
    label: 'Full-Send Street/Strip',
    build: { cylinder_head: 'afr-195', intake_manifold: 'edel-rpm-polished', camshaft: 'comp-xe292', carburetor: 'holley-sniper', exhaust_manifold: 'hooker-ceramic', air_cleaner: 'kn-chrome' },
  },
];

export const TICK_MS = 120; // bench loop period
export const RAMP_MS = 16000; // idle → ceiling
export const SETTLE_MS = 2000; // hold at the ceiling before calling survivors
export const IDLE_RPM = 800;
export const RPM_CEILING = 8000; // both engines get revved to the same absolute rpm
export const HEAT_SOAK_F = 40; // ambient climbs this much over the ramp (underhood soak)

/** Ramp progress 0→1 over RAMP_MS, clamped. */
export function rampAt(elapsedMs) {
  return Math.min(1, Math.max(0, elapsedMs) / RAMP_MS);
}

/** Absolute rpm both engines are spun to at a given ramp progress. */
export function rpmAt(progress) {
  return IDLE_RPM + progress * (RPM_CEILING - IDLE_RPM);
}

/** Conditions at a given progress: throttle opens up and the bay heat-soaks. */
export function conditionsAt(progress, base = DEFAULT_CONDITIONS) {
  return {
    ...base,
    loadFraction: 0.5 + 0.5 * progress,
    ambientF: base.ambientF + progress * HEAT_SOAK_F,
  };
}

function phaseFor(severity) {
  if (severity >= 2) return 'failed';
  if (severity >= 1.2) return 'critical';
  if (severity >= 0.45) return 'stressed';
  return 'nominal';
}

/** Evaluate one side at the current ramp state → live telemetry. */
export function evaluateSide(side, progress, engine = DEFAULT_ENGINE) {
  const rpm = rpmAt(progress);
  const conditions = conditionsAt(progress, side.conditions ?? DEFAULT_CONDITIONS);
  const { results, worst, state } = assessEngine(side.build ?? {}, rpm, conditions, engine);
  const severity = Math.max(0, Math.min(3, worst));
  // The single worst system, for the headline ("Valvetrain critical", etc.).
  const lead = results.reduce((m, r) => (r.result.severity > (m?.result.severity ?? -1) ? r : m), null);
  return {
    rpm,
    severity,
    integrity: Math.max(0, Math.min(100, 100 * (1 - severity / 2))),
    phase: phaseFor(severity),
    coolantF: state.coolantF,
    egtF: state.egtF,
    leadSystem: lead?.label ?? null,
    leadMode: lead?.result.name ?? null,
    leadVisual: lead?.result.visual ?? null,
  };
}

const cap = (entries) => entries.slice(-24);

function initialState(sides) {
  return {
    sides: sides.map((s) => ({ ...s, ...evaluateSide(s, 0), maxIntegrity: 100 })),
    status: 'ready', // ready | battling | complete
    elapsedMs: 0,
    progress: 0,
    winnerId: null,
    failOrder: [],
    log: [{ id: 'intro', kind: 'system', message: `Bench armed — F.U.S.E. watching ${sides.length} engines. Hit BATTLE to send them to the moon.` }],
  };
}

/** Most robust = best survivor (lowest severity), else last to grenade. */
function decideWinner(sides, failOrder) {
  const survivors = sides.filter((s) => s.phase !== 'failed');
  if (survivors.length) return [...survivors].sort((a, b) => a.severity - b.severity)[0].id;
  return failOrder.length ? failOrder[failOrder.length - 1] : null;
}

function step(prev, engine) {
  if (prev.status !== 'battling') return prev;
  const elapsedMs = prev.elapsedMs + TICK_MS;
  const progress = rampAt(elapsedMs);
  const failOrder = [...prev.failOrder];
  const newLogs = [];
  const rpm = Math.round(rpmAt(progress));

  const sides = prev.sides.map((s) => {
    if (s.phase === 'failed') return s;
    const t = evaluateSide(s, progress, engine);
    const next = { ...s, ...t };
    if (t.phase === 'failed' && s.phase !== 'failed') {
      next.integrity = 0;
      failOrder.push(s.id);
      newLogs.push({ id: `fail-${s.id}-${elapsedMs}`, kind: 'failure', actorId: s.id,
        message: `💥 ${s.label} GRENADED — ${t.leadMode ?? 'destroyed'} at ${rpm.toLocaleString()} rpm.` });
    } else if (t.phase === 'critical' && s.phase !== 'critical') {
      newLogs.push({ id: `crit-${s.id}-${elapsedMs}`, kind: 'warning', actorId: s.id,
        message: `⚠ ${s.label} — ${t.leadSystem} critical, ${Math.round(t.coolantF)}°F and climbing.` });
    }
    return next;
  });

  const survivors = sides.filter((s) => s.phase !== 'failed');
  const settleDone = progress >= 1 && elapsedMs >= RAMP_MS + SETTLE_MS;
  const concluded = survivors.length <= 1 || settleDone;

  if (!concluded) {
    return { ...prev, sides, elapsedMs, progress, log: cap([...prev.log, ...newLogs]), failOrder };
  }

  const winnerId = decideWinner(sides, failOrder);
  const winner = sides.find((s) => s.id === winnerId);
  const verdict = {
    id: `verdict-${elapsedMs}`, kind: 'verdict',
    message: survivors.length
      ? `🏁 ${winner?.label ?? '—'} takes it — last one running at ${rpm.toLocaleString()} rpm.`
      : `🏁 Both let go. ${winner?.label ?? '—'} held on longest.`,
  };
  return { ...prev, sides, elapsedMs, progress, status: 'complete', winnerId, failOrder, log: cap([...prev.log, ...newLogs, verdict]) };
}

/**
 * React hook driving a stress battle between sides ({id, label, build, conditions}).
 * Returns live side telemetry, status, winner, progress, and the battle log.
 */
export function useEngineBattle(sides, engine = DEFAULT_ENGINE) {
  const stable = useMemo(() => sides, [JSON.stringify(sides)]);
  const [state, setState] = useState(() => initialState(stable));

  useEffect(() => setState(initialState(stable)), [stable]);

  useEffect(() => {
    if (state.status !== 'battling') return undefined;
    const id = window.setInterval(() => setState((p) => step(p, engine)), TICK_MS);
    return () => window.clearInterval(id);
  }, [state.status, engine]);

  const start = useCallback(() => setState((p) => (p.status === 'battling' ? p : { ...initialState(p.sides), status: 'battling' })), []);
  const reset = useCallback(() => setState(initialState(stable)), [stable]);

  return { ...state, rpm: Math.round(rpmAt(state.progress)), start, reset };
}
