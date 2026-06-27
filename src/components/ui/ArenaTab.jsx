/**
 * ArenaTab — the battle arena for real, branded parts.
 *
 * Three ways to fight, all on the same dyno engine (lib/dyno.js + lib/scenarios.js):
 *   • Shootout — pick a category; every branded variant races in YOUR current
 *     build and the chosen weather. Ranked, with the metric that matters for the
 *     chosen arena, and a Buy/Equip on every row. This is the storefront.
 *   • Face-Off — your whole build vs a named rival build, side by side.
 *   • Drag Race — the Face-Off run down a real strip in real time.
 *
 * Everything recomputes live: change the weather or the track and the order can
 * flip, because a naturally-aspirated engine doesn't make the same power
 * everywhere. The part that wins at the coast can lose in Denver.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import useAppStore from '../../store/appStore';
import { PRODUCTS, getVariants } from '../../data/products';
import { computeDyno, ENVIRONMENTS } from '../../lib/dyno';
import { scoreBuild, ARENAS, DEFAULT_WEIGHT_LB } from '../../lib/scenarios';
import { getEngine } from '../../data/engines';
import { commerceEnabled, buyLink } from '../../data/affiliate';

const MEDALS = ['🥇', '🥈', '🥉'];

// Named rival builds for Face-Off / Drag Race (partVariants maps run through the
// same engine, so the comparison is always apples-to-apples on one 350).
const OPPONENTS = [
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

/** Format the headline metric for an arena. */
function headline(score, arena) {
  const v = score[arena.metric];
  if (arena.unit === 's') return `${v.toFixed(2)} s`;
  return `${Math.round(v)} ${arena.unit}`;
}

/** Sort racers best→worst for the arena (dir −1 means lower is better). */
function rank(rows, arena) {
  return [...rows].sort((a, b) => (a.score[arena.metric] - b.score[arena.metric]) * -arena.dir);
}

// ── Shared control bar ────────────────────────────────────────────────────────
function ArenaControls({ envIdx, setEnvIdx, arenaId, setArenaId }) {
  const arena = ARENAS.find((a) => a.id === arenaId);
  return (
    <div className="arena-controls">
      <label className="arena-select">
        <span>🌎 Conditions</span>
        <select value={envIdx} onChange={(e) => setEnvIdx(+e.target.value)}>
          {ENVIRONMENTS.map((env, i) => (
            <option key={env.label} value={i}>{env.label}</option>
          ))}
        </select>
      </label>
      <label className="arena-select">
        <span>🏁 Arena</span>
        <select value={arenaId} onChange={(e) => setArenaId(e.target.value)}>
          {ARENAS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </label>
      <div className="arena-blurb">{arena.blurb}</div>
    </div>
  );
}

// ── Shootout ──────────────────────────────────────────────────────────────────
function Shootout({ env, arena }) {
  const partVariants = useAppStore((s) => s.partVariants);
  const setPartVariant = useAppStore((s) => s.setPartVariant);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const [category, setCategory] = useState('carburetor');

  const variants = getVariants(category) || [];
  const installedId = partVariants[category] || variants[0]?.id;

  const ranked = useMemo(() => {
    const rows = variants.map((v) => {
      const dyno = computeDyno({ ...partVariants, [category]: v.id }, env, engine);
      return { v, score: scoreBuild(dyno, engine.weightLb) };
    });
    return rank(rows, arena);
  }, [variants, partVariants, category, env, arena, engine]);

  const winnerVal = ranked[0]?.score[arena.metric];
  const runnerVal = ranked[1]?.score[arena.metric];
  const gap =
    winnerVal != null && runnerVal != null
      ? Math.abs(winnerVal - runnerVal)
      : 0;

  return (
    <div className="arena-shootout">
      <label className="arena-select wide">
        <span>⚔ Shoot out</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {engine.perfCategories.map((c) => (
            <option key={c} value={c}>{PRODUCTS[c].label}</option>
          ))}
        </select>
      </label>

      <div className="arena-context">
        in your current build · {env.label}
      </div>

      <div className="arena-board">
        {ranked.map((row, i) => {
          const installed = row.v.id === installedId;
          return (
            <div key={row.v.id} className={`arena-row ${i === 0 ? 'win' : ''} ${installed ? 'installed' : ''}`}>
              <span className="arena-rank">{MEDALS[i] || i + 1}</span>
              <div className="arena-row-main">
                <div className="arena-row-name">
                  <b>{row.v.brand}</b> {row.v.name}
                  {installed && <span className="arena-installed-tag">installed</span>}
                </div>
                <div className="arena-row-stats">
                  {row.score.peakHp} hp · {row.score.et.toFixed(2)}s @ {Math.round(row.score.trap)} · 0-60 {row.score.zeroSixty.toFixed(1)}s
                </div>
              </div>
              <div className="arena-row-metric">{headline(row.score, arena)}</div>
              <div className="arena-row-act">
                <button
                  className={`arena-equip ${installed ? 'on' : ''}`}
                  onClick={() => setPartVariant(category, row.v.id)}
                  title={installed ? 'Installed on your engine' : 'Bolt this onto your engine'}
                >
                  {installed ? '✓' : 'Equip'}
                </button>
                {commerceEnabled() && (
                  <a className="arena-buy" href={buyLink(row.v.buyUrl)} target="_blank" rel="noopener noreferrer">${Math.round(row.v.price)}</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {gap > 0 && (
        <div className="arena-verdict">
          🏆 <b>{ranked[0].v.brand} {ranked[0].v.name}</b> takes the {arena.label} by{' '}
          {arena.unit === 's' ? `${gap.toFixed(2)} s` : `${Math.round(gap)} ${arena.unit}`}
        </div>
      )}
    </div>
  );
}

// ── Drag race animation (real time) ───────────────────────────────────────────
function DragRace({ a, b }) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [state, setState] = useState({ aPos: 0, bPos: 0, aMph: 0, bMph: 0, t: 0 });
  const raf = useRef();

  const run = () => {
    setPhase('running');
    const start = performance.now();
    const maxEt = Math.max(a.score.et, b.score.et);
    const tick = (now) => {
      const t = (now - start) / 1000;
      const frac = (et) => Math.min(1, t / et);
      const pos = (et) => Math.min(1, frac(et) * frac(et)); // d ∝ t² under accel
      setState({
        t,
        aPos: pos(a.score.et),
        bPos: pos(b.score.et),
        aMph: a.score.trap * frac(a.score.et),
        bMph: b.score.trap * frac(b.score.et),
      });
      if (t < maxEt) raf.current = requestAnimationFrame(tick);
      else setPhase('done');
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  // Reset if the racers change.
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setPhase('ready');
    setState({ aPos: 0, bPos: 0, aMph: 0, bMph: 0, t: 0 });
  }, [a.label, b.label, a.score.et, b.score.et]);

  const winner = a.score.et <= b.score.et ? a : b;
  const Lane = ({ r, pos, mph, color }) => (
    <div className="drag-lane">
      <div className="drag-strip">
        <div className="drag-car" style={{ left: `${pos * 92}%`, color }}>🏎</div>
      </div>
      <div className="drag-lane-foot">
        <span className="drag-lane-name" style={{ color }}>{r.label}</span>
        <span className="drag-lane-mph">{Math.round(mph)} mph</span>
      </div>
    </div>
  );

  return (
    <div className="drag-race">
      <Lane r={a} pos={state.aPos} mph={state.aMph} color="#f0883e" />
      <Lane r={b} pos={state.bPos} mph={state.bMph} color="#58a6ff" />
      <div className="drag-foot">
        {phase === 'done' ? (
          <span className="drag-result">
            🏁 <b style={{ color: winner === a ? '#f0883e' : '#58a6ff' }}>{winner.label}</b> wins —{' '}
            {a.label} {a.score.et.toFixed(2)}s vs {b.label} {b.score.et.toFixed(2)}s
          </span>
        ) : (
          <button className="drag-go" onClick={run} disabled={phase === 'running'}>
            {phase === 'running' ? `${state.t.toFixed(2)} s…` : '🚦 Launch'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Face-Off ──────────────────────────────────────────────────────────────────
function StatBar({ label, you, rival, unit, lowerBetter }) {
  const youWins = lowerBetter ? you <= rival : you >= rival;
  const max = Math.max(you, rival) || 1;
  const fmt = (v) => (unit === 's' ? v.toFixed(2) : Math.round(v));
  return (
    <div className="faceoff-stat">
      <div className="faceoff-stat-label">{label}</div>
      <div className="faceoff-stat-bars">
        <div className={`faceoff-bar you ${youWins ? 'win' : ''}`}>
          <span style={{ width: `${(you / max) * 100}%` }} />
          <em>{fmt(you)}{youWins ? ' 🏆' : ''}</em>
        </div>
        <div className={`faceoff-bar rival ${!youWins ? 'win' : ''}`}>
          <span style={{ width: `${(rival / max) * 100}%` }} />
          <em>{fmt(rival)}{!youWins ? ' 🏆' : ''}</em>
        </div>
      </div>
    </div>
  );
}

function FaceOff({ env }) {
  const partVariants = useAppStore((s) => s.partVariants);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const [oppId, setOppId] = useState('stock');
  const opp = OPPONENTS.find((o) => o.id === oppId);

  const you = useMemo(() => scoreBuild(computeDyno(partVariants, env, engine), engine.weightLb), [partVariants, env, engine]);
  const rival = useMemo(() => scoreBuild(computeDyno(opp.build, env)), [opp, env]);

  return (
    <div className="arena-faceoff">
      <label className="arena-select wide">
        <span>🆚 Your build vs</span>
        <select value={oppId} onChange={(e) => setOppId(e.target.value)}>
          {OPPONENTS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </label>
      <div className="arena-context">{env.label}</div>

      <StatBar label="Peak HP" you={you.peakHp} rival={rival.peakHp} unit="hp" />
      <StatBar label="Peak torque" you={you.peakTq} rival={rival.peakTq} unit="lb-ft" />
      <StatBar label="¼-mile ET" you={you.et} rival={rival.et} unit="s" lowerBetter />
      <StatBar label="Trap speed" you={you.trap} rival={rival.trap} unit="mph" />
      <StatBar label="0–60 mph" you={you.zeroSixty} rival={rival.zeroSixty} unit="s" lowerBetter />

      <div className="arena-section-label">Run it down the strip</div>
      <DragRace a={{ label: 'Your build', score: you }} b={{ label: opp.label, score: rival }} />
    </div>
  );
}

// ── Tab root ──────────────────────────────────────────────────────────────────
export default function ArenaTab() {
  const [mode, setMode] = useState('shootout'); // shootout | faceoff
  const [envIdx, setEnvIdx] = useState(0);
  const [arenaId, setArenaId] = useState('drag');
  const env = ENVIRONMENTS[envIdx];
  const arena = ARENAS.find((a) => a.id === arenaId);

  return (
    <div className="arena-tab">
      <div className="arena-intro">
        Drop real branded parts into your 350 and <b>fight them</b>. Weather and track
        change who wins — same as real life.
      </div>

      <div className="arena-modes">
        <button className={mode === 'shootout' ? 'on' : ''} onClick={() => setMode('shootout')}>⚔ Part Shootout</button>
        <button className={mode === 'faceoff' ? 'on' : ''} onClick={() => setMode('faceoff')}>🆚 Face-Off</button>
      </div>

      <ArenaControls envIdx={envIdx} setEnvIdx={setEnvIdx} arenaId={arenaId} setArenaId={setArenaId} />

      {mode === 'shootout' ? <Shootout env={env} arena={arena} /> : <FaceOff env={env} />}

      <div className="arena-foot">
        Weight {DEFAULT_WEIGHT_LB.toLocaleString()} lb · numbers are estimates from the live dyno model.
      </div>
    </div>
  );
}
