/**
 * EngineDesigner — design your own motor.
 *
 * The crucial custom-build surface: instead of only picking a roster engine and
 * bolting on parts, the user designs the long-block itself — base platform, bore,
 * stroke (→ live displacement), compression, and induction (NA / turbo / blower).
 * Everything is previewed live on the dyno as a stock-parts estimate, with F.U.S.E.
 * calling out what the combination will and won't tolerate, then named and saved as
 * a real engine you can build on, dyno, and battle.
 *
 * It's a thin form over makeCustomEngine: the draft spec is synthesized into a full
 * engine package every render, so the preview is the *exact* motor you'll get.
 */
import { useMemo, useState } from 'react';
import useAppStore from '../../store/appStore';
import {
  makeCustomEngine,
  defaultSpec,
  designLimits,
  basePlatforms,
  displacementOf,
} from '../../data/engines/customEngine';
import { computeDyno, dynoMetrics } from '../../lib/dyno';
import { buildAdvisories } from '../../lib/engineStress';

const ADVISE_ICON = { ok: '✓', info: 'ℹ', warn: '⚠', risk: '⛔' };
const INDUCTIONS = [
  { id: 'na', label: 'NA', long: 'Naturally aspirated' },
  { id: 'turbo', label: 'Turbo', long: 'Turbocharged' },
  { id: 'super', label: 'Blower', long: 'Supercharged' },
];

function Slider({ label, value, min, max, step, unit, onChange, fmt }) {
  return (
    <label className="design-slider">
      <span className="design-slider-top">
        <span>{label}</span>
        <b>{fmt ? fmt(value) : value}{unit}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

export default function EngineDesigner() {
  const designerSpec = useAppStore((s) => s.designerSpec);
  const addCustomEngine = useAppStore((s) => s.addCustomEngine);
  const closeDesigner = useAppStore((s) => s.closeDesigner);

  const platforms = useMemo(() => basePlatforms(), []);
  // Seed from the spec being edited, else a fresh spec on the first platform.
  const [spec, setSpec] = useState(
    () => designerSpec || defaultSpec(platforms[0]?.id)
  );

  const lim = useMemo(() => designLimits(spec.baseEngineId), [spec.baseEngineId]);
  const set = (patch) => setSpec((s) => ({ ...s, ...patch }));

  // Switching platform resets the rotating-assembly numbers to that block's sane
  // defaults (keeping the user's name), since limits + base dims differ.
  const pickBase = (id) => setSpec((s) => ({ ...defaultSpec(id), name: s.name }));

  // The synthesized package + a stock-parts dyno estimate, recomputed live.
  const pkg = useMemo(() => makeCustomEngine({ ...spec, id: 'custom:draft' }), [spec]);
  const dyno = useMemo(() => computeDyno({}, undefined, pkg), [pkg]);
  const metrics = useMemo(() => dynoMetrics(dyno, pkg), [dyno, pkg]);
  const advisories = useMemo(() => buildAdvisories({}, pkg), [pkg]);
  const disp = displacementOf(spec.boreIn, spec.strokeIn, spec.cylinders);

  const editing = !!designerSpec?.id;
  const canSave = true; // a name is optional — we fall back to "Custom NNN ci"

  return (
    <div className="design-overlay" role="dialog" aria-label="Engine designer">
      <div className="design-panel">
        <div className="design-head">
          <h3>{editing ? 'Edit motor' : 'Design your motor'}</h3>
          <button className="design-close" onClick={closeDesigner} aria-label="Close designer">✕</button>
        </div>

        {/* Live result — the payoff, kept at the top so every change is felt */}
        <div className="design-result">
          <div className="design-result-power">
            <span className="design-hp"><b>{dyno.peakHp.value}</b> hp</span>
            <span className="design-tq"><b>{dyno.peakTq.value}</b> lb-ft</span>
          </div>
          <div className="design-result-sub">
            <span><b>{Math.round(disp)}</b> ci · {(disp * 0.0163871).toFixed(1)} L</span>
            <span>{spec.boreIn.toFixed(3)}" × {spec.strokeIn.toFixed(3)}"</span>
            <span>{metrics.hpPerL.toFixed(0)} hp/L</span>
          </div>
          <div className="design-result-note">stock-parts estimate — bolt-ons add more in Build</div>
        </div>

        {/* Base platform */}
        <div className="design-section">
          <div className="design-label">Platform</div>
          <div className="design-platforms">
            {platforms.map((p) => (
              <button
                key={p.id}
                className={`design-platform ${spec.baseEngineId === p.id ? 'sel' : ''}`}
                onClick={() => pickBase(p.id)}
                title={p.name}
              >
                <span className="design-platform-name">{p.shortName}</span>
                <span className="design-platform-arch">{p.cylinders}-cyl · {p.badge?.split(' · ')[0]}</span>
              </button>
            ))}
          </div>
          <div className="design-hint">The 3D model + parts catalog follow the platform.</div>
        </div>

        {/* Bore / stroke / compression */}
        <div className="design-section">
          <Slider
            label="Bore" value={spec.boreIn} min={lim.bore[0]} max={lim.bore[1]} step={0.005}
            unit='"' onChange={(v) => set({ boreIn: v })} fmt={(v) => v.toFixed(3)}
          />
          <Slider
            label="Stroke" value={spec.strokeIn} min={lim.stroke[0]} max={lim.stroke[1]} step={0.01}
            unit='"' onChange={(v) => set({ strokeIn: v })} fmt={(v) => v.toFixed(3)}
          />
          <Slider
            label="Compression" value={spec.compression} min={lim.comp[0]} max={lim.comp[1]} step={0.1}
            unit=":1" onChange={(v) => set({ compression: v })} fmt={(v) => v.toFixed(1)}
          />
        </div>

        {/* Induction */}
        <div className="design-section">
          <div className="design-label">Induction</div>
          <div className="design-induction">
            {INDUCTIONS.map((ind) => (
              <button
                key={ind.id}
                className={`design-ind ${spec.induction === ind.id ? 'sel' : ''}`}
                onClick={() => set({ induction: ind.id, boostPsi: ind.id === 'na' ? 0 : spec.boostPsi || 7 })}
                title={ind.long}
              >
                {ind.label}
              </button>
            ))}
          </div>
          {spec.induction !== 'na' && (
            <Slider
              label="Boost" value={spec.boostPsi || 0} min={3} max={25} step={1}
              unit=" psi" onChange={(v) => set({ boostPsi: v })}
            />
          )}
        </div>

        {/* F.U.S.E. design check */}
        <div className="design-section design-fuse">
          <div className="design-label"><b>F.U.S.E.</b> design check</div>
          {advisories.map((a, i) => (
            <div key={i} className={`build-advise ${a.level}`}>
              <span className="build-advise-icon">{ADVISE_ICON[a.level]}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </div>

        {/* Name + save */}
        <div className="design-section design-save">
          <input
            className="design-name"
            placeholder="Name this motor…"
            value={spec.name}
            maxLength={28}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) addCustomEngine(spec); }}
          />
          <button className="design-save-btn" disabled={!canSave} onClick={() => addCustomEngine(spec)}>
            {editing ? 'Save changes' : 'Build it'}
          </button>
        </div>
      </div>
    </div>
  );
}
