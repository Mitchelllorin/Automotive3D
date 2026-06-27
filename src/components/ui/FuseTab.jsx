/**
 * FuseTab — the live face of F.U.S.E.™ in Automotive3D.
 *
 * This replaces the old static fault list. Instead of reading what *could* go
 * wrong, you watch *your* engine react to how you run it: rev past the cam's
 * redline and the valvetrain floats; run high-compression heads on cheap gas and
 * it detonates; lean on it in Denver heat with a tired pump and it cooks. Every
 * verdict comes from the same proprietary engine that powers CircuiTry3D — it
 * reads the build's real specs and the live operating conditions and reports the
 * failure mode, a 0–3 severity, and what's physically happening inside the part.
 */
import { useEffect, useMemo, useState } from 'react';
import useAppStore from '../../store/appStore';
import { simState } from '../../lib/simState';
import { assessEngine, FUELS } from '../../lib/engineStress';
import { ENVIRONMENTS } from '../../lib/dyno';
import { SEVERITY_LABELS, FUSE_VERSION } from '../../lib/fuse';
import { getEngine } from '../../data/engines';

const SEV_COLOR = ['#3fb950', '#d2a106', '#f0883e', '#f85149']; // OK, stressed, critical, destroyed
const band = (sev) => Math.min(3, Math.floor(sev));

/** A 0–3 severity meter. */
function SevBar({ sev }) {
  const pct = Math.min(100, (sev / 3) * 100);
  return (
    <div className="fuse-sevbar">
      <span style={{ width: `${pct}%`, background: SEV_COLOR[band(sev)] }} />
    </div>
  );
}

export default function FuseTab() {
  const partVariants = useAppStore((s) => s.partVariants);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const { envIdx, fuelIdx, load } = useAppStore((s) => s.fuseConditions);
  const setFuseConditions = useAppStore((s) => s.setFuseConditions);
  const setEnvIdx = (v) => setFuseConditions({ envIdx: v });
  const setFuelIdx = (v) => setFuseConditions({ fuelIdx: v });
  const setLoad = (v) => setFuseConditions({ load: v });
  const [rpm, setRpm] = useState(0);

  // Track live engine rpm so the panel reacts in real time as you rev it.
  useEffect(() => {
    let raf;
    const tick = () => {
      setRpm(Math.round(simState.rpm / 50) * 50);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const env = ENVIRONMENTS[envIdx];
  const conditions = useMemo(
    () => ({ ambientF: env.airTempF, altitudeFt: env.altitudeFt, octane: FUELS[fuelIdx].octane, loadFraction: load }),
    [env, fuelIdx, load]
  );

  const assessment = useMemo(
    () => assessEngine(partVariants, rpm, conditions, engine),
    [partVariants, rpm, conditions, engine]
  );
  const { results, worst, state } = assessment;
  const overBand = band(worst);

  return (
    <div className="fuse-tab">
      <div className="fuse-head">
        <span className="fuse-logo">⚡ F.U.S.E.<sup>™</sup></span>
        <span className="fuse-sub">Failure Understanding Simulation Engine</span>
      </div>
      <div className="fuse-intro">
        Live failure analysis from your build's real specs. Start the engine and work the
        throttle — push it past what the parts can take and watch it let go.
      </div>

      {/* Operating conditions */}
      <div className="fuse-conditions">
        <label className="arena-select">
          <span>🌎 Conditions</span>
          <select value={envIdx} onChange={(e) => setEnvIdx(+e.target.value)}>
            {ENVIRONMENTS.map((en, i) => (
              <option key={en.label} value={i}>{en.label}</option>
            ))}
          </select>
        </label>
        <label className="arena-select">
          <span>⛽ Fuel</span>
          <select value={fuelIdx} onChange={(e) => setFuelIdx(+e.target.value)}>
            {FUELS.map((f, i) => (
              <option key={f.octane} value={i}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="fuse-load">
          <span>Load {Math.round(load * 100)}%</span>
          <input type="range" min={0} max={1} step={0.05} value={load} onChange={(e) => setLoad(+e.target.value)} />
        </label>
      </div>

      {/* Live vitals */}
      <div className="fuse-vitals">
        <span><b>{rpm.toLocaleString()}</b> rpm</span>
        <span className={rpm > state.redline ? 'over' : ''}>redline <b>{state.redline.toLocaleString()}</b></span>
        <span>{state.compressionRatio.toFixed(1)}:1</span>
      </div>

      {/* Temperatures */}
      <div className="fuse-temps">
        <span className={state.coolantF > 235 ? 'over' : ''}><i>coolant</i><b>{Math.round(state.coolantF)}°</b></span>
        <span className={state.oilF > 270 ? 'over' : ''}><i>oil</i><b>{Math.round(state.oilF)}°</b></span>
        <span className={state.iatF > 150 ? 'over' : ''}><i>intake air</i><b>{Math.round(state.iatF)}°</b></span>
        <span className={state.egtF > 1550 ? 'over' : ''}><i>EGT</i><b>{Math.round(state.egtF)}°</b></span>
      </div>

      {/* Overall health */}
      <div className="fuse-overall" style={{ borderColor: SEV_COLOR[overBand] }}>
        <span className="fuse-status-dot" style={{ background: SEV_COLOR[overBand] }} />
        <span className="fuse-status-label">{worst <= 0 ? 'All systems healthy' : SEVERITY_LABELS[overBand]}</span>
        {worst >= 2 && <span className="fuse-status-fail">FAILURE</span>}
      </div>

      {/* Per-system breakdown */}
      <div className="fuse-systems">
        {results.map(({ id, label, result }) => (
          <div key={id} className={`fuse-system ${result.severity >= 2 ? 'failed' : ''}`}>
            <div className="fuse-system-top">
              <span className="fuse-system-name">{label}</span>
              <span className="fuse-system-sev" style={{ color: SEV_COLOR[band(result.severity)] }}>
                {result.name || 'OK'}
              </span>
            </div>
            <SevBar sev={result.severity} />
            {result.description && result.severity >= 1 && (
              <p className="fuse-system-desc">{result.description}</p>
            )}
          </div>
        ))}
      </div>

      <div className="fuse-foot">
        Powered by Proprietary <b>F.U.S.E.™</b> Technology · v{FUSE_VERSION}
      </div>
    </div>
  );
}
