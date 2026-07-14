/**
 * DynoReadout — the live dyno for the current build.
 *
 * This is the buy-in moment: it reads the parts the user has bolted on (the
 * store's partVariants) and draws the torque & horsepower curves they produce,
 * with the peak numbers called out. Swap a cam, a carb, a set of heads in the
 * Garage and the curves and peaks move here instantly — the same physics a real
 * engine dyno would show (see lib/dyno.js).
 *
 * The thin vertical marker tracks the engine's current rpm while it's running, so
 * you can watch where on the curve you actually are and read instantaneous power.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import useAppStore from '../../store/appStore';
import { computeDyno, outputAtRpm, dynoMetrics, buildCost } from '../../lib/dyno';
import { simState } from '../../lib/simState';
import { getEngine } from '../../data/engines';

/**
 * DynoMetricsStrip — the six secondary dyno stats rendered as bare floating text,
 * outside any container box.  Lives as an absolutely-positioned overlay in the
 * scene so it never adds to the engine-control panel height.
 */
export function DynoMetricsStrip() {
  const partVariants = useAppStore((s) => s.partVariants);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const dyno = useMemo(() => computeDyno(partVariants, undefined, engine), [partVariants, engine]);
  const metrics = useMemo(() => dynoMetrics(dyno, engine), [dyno, engine]);
  const cost = useMemo(() => buildCost(partVariants, engine), [partVariants, engine]);

  return (
    <div className="dyno-metrics-float">
      <span className="dmf-item">
        <i className="dmf-label">spec output</i>
        <b className="dmf-value">{metrics.hpPerL.toFixed(0)} hp/L</b>
      </span>
      <span className="dmf-item">
        <i className="dmf-label">BMEP</i>
        <b className="dmf-value">{Math.round(metrics.bmep)} psi</b>
      </span>
      <span className={`dmf-item${metrics.pistonSpeed > 4000 ? ' hot' : ''}`}>
        <i className="dmf-label">piston speed</i>
        <b className="dmf-value">{Math.round(metrics.pistonSpeed).toLocaleString()} ft/min</b>
      </span>
      <span className="dmf-item">
        <i className="dmf-label">power-to-wt</i>
        <b className="dmf-value">{metrics.lbPerHp.toFixed(1)} lb/hp</b>
      </span>
      <span className="dmf-item">
        <i className="dmf-label">power band</i>
        <b className="dmf-value">{metrics.band.lo.toLocaleString()}–{metrics.band.hi.toLocaleString()}</b>
      </span>
      <span className="dmf-item">
        <i className="dmf-label">build cost</i>
        <b className="dmf-value">${Math.round(cost).toLocaleString()}</b>
      </span>
    </div>
  );
}

const W = 232; // svg viewbox
const H = 78;
const PAD = 4;

/** Map a value in [0,max] to a y pixel (inverted: 0 at bottom). */
const yOf = (v, max) => H - PAD - (v / max) * (H - 2 * PAD);

function curvePath(curve, key, max, x0, xSpan, rpm0, rpmSpan) {
  return curve
    .map((p, i) => {
      const x = x0 + ((p.rpm - rpm0) / rpmSpan) * xSpan;
      const y = yOf(p[key], max);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function idleNote(lopiness) {
  if (lopiness < 0.1) return 'smooth idle';
  if (lopiness < 0.25) return 'slight lope';
  if (lopiness < 0.55) return 'choppy idle';
  return 'race lope';
}

export default function DynoReadout() {
  const partVariants = useAppStore((s) => s.partVariants);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const dyno = useMemo(() => computeDyno(partVariants, undefined, engine), [partVariants, engine]);

  // Poll the live (eased) rpm each frame for the moving marker + instantaneous power.
  const [rpm, setRpm] = useState(0);
  const markerRef = useRef();
  const liveRef = useRef();
  useEffect(() => {
    let raf;
    const tick = () => {
      const r = simState.rpm;
      setRpm(Math.round(r));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rpm0 = dyno.curve[0]?.rpm ?? 750;
  const rpmSpan = (dyno.redline - rpm0) || 1;
  const max = Math.max(dyno.peakHp.value, dyno.peakTq.value) * 1.08;
  const x0 = PAD;
  const xSpan = W - 2 * PAD;

  const hpPath = curvePath(dyno.curve, 'hp', max, x0, xSpan, rpm0, rpmSpan);
  const tqPath = curvePath(dyno.curve, 'tq', max, x0, xSpan, rpm0, rpmSpan);
  const peakHpX = x0 + ((dyno.peakHp.rpm - rpm0) / rpmSpan) * xSpan;

  const live = outputAtRpm(dyno, rpm);
  const markerX =
    rpm > rpm0 ? x0 + ((Math.min(rpm, dyno.redline) - rpm0) / rpmSpan) * xSpan : null;

  return (
    <div className="dyno-readout">
      <div className="dyno-head">
        <span className="dyno-title">DYNO</span>
        <span className="dyno-disp">{Math.round(dyno.displacementCI)} ci · {idleNote(dyno.lopiness)}</span>
      </div>

      <div className="dyno-peaks">
        <span className="dyno-peak hp">
          <b>{dyno.peakHp.value}</b> hp
          <i>@ {dyno.peakHp.rpm.toLocaleString()}</i>
        </span>
        <span className="dyno-peak tq">
          <b>{dyno.peakTq.value}</b> lb-ft
          <i>@ {dyno.peakTq.rpm.toLocaleString()}</i>
        </span>
      </div>

      <svg className="dyno-graph" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* peak-HP guide */}
        <line className="dyno-guide" x1={peakHpX} y1={PAD} x2={peakHpX} y2={H - PAD} />
        <path className="dyno-line tq" d={tqPath} />
        <path className="dyno-line hp" d={hpPath} />
        {markerX != null && (
          <line ref={markerRef} className="dyno-marker" x1={markerX} y1={0} x2={markerX} y2={H} />
        )}
      </svg>

      <div className="dyno-live" ref={liveRef}>
        {rpm > rpm0 ? (
          <span>
            now <b>{Math.round(live.hp)}</b> hp · <b>{Math.round(live.tq)}</b> lb-ft @{' '}
            {rpm.toLocaleString()} rpm
          </span>
        ) : (
          <span className="dyno-live-off">start the engine to read live power</span>
        )}
      </div>
    </div>
  );
}
