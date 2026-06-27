/**
 * BuildTab — where the user builds their own engine.
 *
 * The core loop: pick every part (block, heads, cam, carb, intake, cooling, …),
 * watch horsepower, torque, cost and durability update live, then name and save it
 * as a custom build. Saved builds are what you take into the Arena and shop. It's
 * all data-driven off the catalog (data/products + the import API), so any part
 * registered into the catalog shows up here automatically.
 */
import { useMemo, useState } from 'react';
import useAppStore from '../../store/appStore';
import { computeDyno, buildCost } from '../../lib/dyno';
import { buildAdvisories } from '../../lib/engineStress';
import { commerceEnabled } from '../../data/affiliate';
import { getEngine, engineList } from '../../data/engines';

const ADVISE_ICON = { ok: '✓', info: 'ℹ', warn: '⚠', risk: '⛔' };
const SHOP = commerceEnabled();

/** Resolve a category's active/OEM variant from the ACTIVE engine's own catalog —
 *  NOT the global one, so a non-V8 motor (e.g. the turbo four) never reads a part
 *  that doesn't exist in its catalog (which used to crash the panel). */
const variantOf = (products, cat, id) => {
  const list = products[cat]?.variants;
  if (!list || !list.length) return null;
  return list.find((v) => v.id === id) || list.find((v) => v.oem) || list[0];
};
const oemOf = (products, cat) => {
  const list = products[cat]?.variants;
  if (!list || !list.length) return undefined;
  return (list.find((v) => v.oem) || list[0]).id;
};

// The order parts are presented in — biggest power/durability levers first.
const BUILD_ORDER = [
  'engine_block', 'cylinder_head', 'camshaft', 'intake_manifold', 'carburetor',
  'air_cleaner', 'exhaust_manifold', 'water_pump', 'cooling_fan', 'thermostat',
  'distributor', 'spark_plugs', 'alternator', 'drive_belt', 'fuel_pump',
  'oil_filter', 'valve_cover',
];

function idleNote(lop) {
  if (lop < 0.1) return 'smooth idle';
  if (lop < 0.25) return 'slight lope';
  if (lop < 0.55) return 'choppy idle';
  return 'race lope';
}
function durabilityLabel(strength) {
  if (strength >= 1.4) return { txt: 'Race', cls: 'race' };
  if (strength >= 1.2) return { txt: 'Strong', cls: 'strong' };
  return { txt: 'Stock', cls: 'stock' };
}
const money = (n) => `$${Math.round(n).toLocaleString()}`;

/** The category list, in display order, that actually has parts for this engine. */
const categories = (products) => {
  const known = BUILD_ORDER.filter((c) => products[c]);
  const rest = Object.keys(products).filter((c) => !BUILD_ORDER.includes(c));
  return [...known, ...rest];
};

export default function BuildTab() {
  const partVariants = useAppStore((s) => s.partVariants);
  const setPartVariant = useAppStore((s) => s.setPartVariant);
  const preview = useAppStore((s) => s.preview);
  const setPreview = useAppStore((s) => s.setPreview);
  const clearPreview = useAppStore((s) => s.clearPreview);
  const savedBuilds = useAppStore((s) => s.savedBuilds);
  const activeBuildId = useAppStore((s) => s.activeBuildId);
  const saveBuild = useAppStore((s) => s.saveBuild);
  const loadBuild = useAppStore((s) => s.loadBuild);
  const deleteBuild = useAppStore((s) => s.deleteBuild);
  const newBuild = useAppStore((s) => s.newBuild);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const activeEngineId = useAppStore((s) => s.activeEngineId);
  const setEngine = useAppStore((s) => s.setEngine);

  const engine = getEngine(activeEngineId);
  const roster = useMemo(() => engineList(), []);
  const PRODUCTS = engine.products;
  const PERF = engine.perfCategories;

  const [expanded, setExpanded] = useState(null);
  const [name, setName] = useState('');

  // The "effective" build = committed parts with the ghost-preview part laid over,
  // so the engine + numbers show a part being tried before it's committed.
  const effective = useMemo(
    () => (preview ? { ...partVariants, [preview.category]: preview.variantId } : partVariants),
    [partVariants, preview]
  );
  const dyno = useMemo(() => computeDyno(effective, undefined, engine), [effective, engine]);
  const cost = useMemo(() => buildCost(effective, engine), [effective, engine]);
  const advisories = useMemo(() => buildAdvisories(effective, engine), [effective, engine]);
  const strength = variantOf(PRODUCTS, 'engine_block', effective.engine_block)?.perf?.strength ?? 1.0;
  const dura = durabilityLabel(strength);
  const cats = useMemo(() => categories(PRODUCTS), [PRODUCTS]);

  // Per-variant peak-HP delta for the open category (so each option shows what it's worth).
  const gains = useMemo(() => {
    if (!expanded || !PERF.includes(expanded)) return null;
    const oem = oemOf(PRODUCTS, expanded);
    const base = computeDyno({ ...partVariants, [expanded]: oem }, undefined, engine).peakHp.value;
    const out = {};
    for (const v of PRODUCTS[expanded].variants) {
      out[v.id] = computeDyno({ ...partVariants, [expanded]: v.id }, undefined, engine).peakHp.value - base;
    }
    return out;
  }, [expanded, partVariants, engine, PRODUCTS, PERF]);

  return (
    <div className="build-tab">
      {/* Engine roster — pick the motor you're building on */}
      <div className="build-engine">
        <div className="build-engine-head">
          <span className="build-engine-label">MOTOR</span>
          <span className="build-engine-active">{engine.name}</span>
        </div>
        <div className="build-engine-roster">
          {roster.map((e) => {
            const sel = e.id === activeEngineId;
            const locked = !e.available;
            return (
              <button
                key={e.id}
                className={`build-engine-tile ${sel ? 'sel' : ''} ${locked ? 'locked' : ''}`}
                disabled={locked}
                title={locked ? `${e.name} — coming soon` : e.name}
                onClick={() => !locked && setEngine(e.id)}
              >
                <span className="build-engine-name">{e.shortName}</span>
                <span className="build-engine-ci">{Math.round(e.displacementCI)} ci</span>
                {locked && <span className="build-engine-soon">SOON</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live build summary */}
      <div className={`build-summary ${preview ? 'previewing' : ''}`}>
        <div className="build-summary-top">
          <span className="build-hp"><b>{dyno.peakHp.value}</b> hp</span>
          <span className="build-tq"><b>{dyno.peakTq.value}</b> lb-ft</span>
          {preview && <span className="build-preview-tag">👁 preview</span>}
        </div>
        <div className="build-summary-sub">
          <span>{Math.round(dyno.displacementCI)} ci</span>
          <span>{idleNote(dyno.lopiness)}</span>
          <span className={`build-dura ${dura.cls}`}>{dura.txt} bottom end</span>
          {SHOP && <span className="build-cost">{money(cost)}</span>}
        </div>
      </div>

      {/* F.U.S.E. build check — what'll break, before you run it */}
      <div className="build-fuse">
        <div className="build-fuse-head"><b>F.U.S.E.</b> build check</div>
        {advisories.map((a, i) => (
          <div key={i} className={`build-advise ${a.level}`}>
            <span className="build-advise-icon">{ADVISE_ICON[a.level]}</span>
            <span>{a.text}</span>
          </div>
        ))}
      </div>

      {/* Saved custom builds */}
      <div className="build-saved">
        <div className="build-saved-row">
          <input
            className="build-name-input"
            placeholder="Name this build…"
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { saveBuild(name); setName(''); } }}
          />
          <button className="build-save-btn" disabled={!name.trim()} onClick={() => { saveBuild(name); setName(''); }}>Save</button>
          <button className="build-new-btn" onClick={newBuild} title="Reset to a bone-stock baseline">New</button>
        </div>
        {savedBuilds.length > 0 && (
          <div className="build-saved-list">
            {savedBuilds.map((b) => (
              <span key={b.id} className={`build-saved-chip ${activeBuildId === b.id ? 'active' : ''}`}>
                <button className="build-load" onClick={() => loadBuild(b.id)} title="Load this build">
                  {b.name} · {computeDyno(b.partVariants, undefined, getEngine(b.engineId)).peakHp.value} hp
                </button>
                <button className="build-del" onClick={() => deleteBuild(b.id)} aria-label="Delete build">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The configurator — every part, tap to choose */}
      <div className="build-list">
        {cats.map((cat) => {
          const def = PRODUCTS[cat];
          const active = variantOf(PRODUCTS, cat, effective[cat]);
          if (!def || !active) return null; // catalog gap — skip rather than crash
          const open = expanded === cat;
          return (
            <div key={cat} className={`build-row ${open ? 'open' : ''}`}>
              <button className="build-row-head" onClick={() => setExpanded(open ? null : cat)}>
                <span className="build-row-cat">{def.label}</span>
                <span className="build-row-pick">{active.brand} {active.name}</span>
                <span className="build-row-chev">{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="build-options">
                  {def.variants.map((v) => {
                    const sel = active.id === v.id;
                    const isPreview = preview && preview.category === cat && preview.variantId === v.id;
                    const g = gains?.[v.id];
                    // Tap commits (reliable on touch); pressing also ghost-previews
                    // it on the engine, and sliding off / scrolling cancels the ghost.
                    const commit = () => { setPartVariant(cat, v.id); clearPreview(); };
                    return (
                      <button
                        key={v.id}
                        className={`build-option ${sel ? 'sel' : ''} ${isPreview ? 'previewing' : ''}`}
                        onClick={commit}
                        onPointerDown={() => setPreview(cat, v.id)}
                        onPointerUp={clearPreview}
                        onPointerLeave={clearPreview}
                        onPointerCancel={clearPreview}
                      >
                        <span className="build-option-name">
                          <b>{v.brand}</b> {v.name}{v.oem && <span className="build-oem">OEM</span>}
                        </span>
                        <span className="build-option-meta">
                          {g != null && g !== 0 && <span className={`build-gain ${g > 0 ? 'up' : 'down'}`}>{g > 0 ? '+' : ''}{g} hp</span>}
                          {SHOP && v.price > 0 && <span className="build-option-price">{money(v.price)}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="build-to-arena" onClick={() => setActiveTab('arena')}>
        🏆 Take it to the Arena →
      </button>
    </div>
  );
}
