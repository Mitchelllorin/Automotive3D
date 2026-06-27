/**
 * Tour — the guided, interactive walkthrough overlay.
 *
 * Drives the real UI: each step's `setup` opens the right tab / panel, then the
 * tour measures the step's target element, spotlights it (a transparent box with a
 * huge dark box-shadow), and floats a tooltip card beside it with Back / Next /
 * Skip. Centred steps (no target) dim the whole screen with the card in the middle.
 *
 * Robust to layout: it re-measures on resize/scroll and after the setup settles, and
 * clamps the tooltip on-screen so it works on a phone too.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useAppStore from '../../store/appStore';
import { TOUR_STEPS } from '../../lib/tourSteps';

const PAD = 8; // spotlight padding around the target
const CARD_W = 300;
const GAP = 14; // gap between target and card

/** Apply a step's required UI state via the store before measuring. */
function useApplySetup(step) {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const setControlsCollapsed = useAppStore((s) => s.setControlsCollapsed);
  useEffect(() => {
    const s = step?.setup;
    if (!s) return;
    if (s.tab) {
      setSidebarCollapsed(false);
      setActiveTab(s.tab);
    } else if (s.sidebar === 'open') {
      setSidebarCollapsed(false);
    } else if (s.sidebar === 'closed') {
      setSidebarCollapsed(true);
    }
    if (s.controls === 'open') setControlsCollapsed(false);
    else if (s.controls === 'closed') setControlsCollapsed(true);
  }, [step, setActiveTab, setSidebarCollapsed, setControlsCollapsed]);
}

export default function Tour() {
  const active = useAppStore((s) => s.tourActive);
  const stepIdx = useAppStore((s) => s.tourStep);
  const next = useAppStore((s) => s.tourNext);
  const prev = useAppStore((s) => s.tourPrev);
  const end = useAppStore((s) => s.endTour);

  const step = TOUR_STEPS[stepIdx];
  const isLast = stepIdx >= TOUR_STEPS.length - 1;
  useApplySetup(active ? step : null);

  const [rect, setRect] = useState(null); // target bounding rect (null = centred)
  const rafRef = useRef(0);

  // Measure the target after the setup has had a frame or two to apply (tab switch,
  // panel open). Retry a few times because layout/animation may not be settled yet.
  useLayoutEffect(() => {
    if (!active || !step) return undefined;
    let tries = 0;
    let timer;
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          return;
        }
      }
      if (tries++ < 40) timer = setTimeout(measure, 80); // keep retrying as UI settles (~3.2s)
      else setRect(null); // give up → show as a centred message
    };
    // wait one frame for the setup effect to flush
    rafRef.current = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, [active, step, stepIdx]);

  // Keep the spotlight glued to the target on resize/scroll.
  useEffect(() => {
    if (!active) return undefined;
    const onMove = () => {
      if (!step?.target) return;
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [active, step]);

  // Keyboard: Esc skips, arrows / Enter navigate.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') end();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') (isLast ? end : next)();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, isLast, next, prev, end]);

  if (!active || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Card position: centred when no target, else beside the spotlight, clamped.
  let cardStyle;
  if (!rect) {
    cardStyle = { left: vw / 2 - CARD_W / 2, top: Math.max(80, vh / 2 - 120) };
  } else {
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP;
    const roomBelow = vh - below;
    let top;
    if (roomBelow > 200 || roomBelow > rect.top) top = below; // prefer below
    else top = Math.max(12, above - 220); // else above
    let left = rect.left + rect.width / 2 - CARD_W / 2;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    top = Math.max(12, Math.min(top, vh - 12 - 200));
    cardStyle = { left, top };
  }

  return (
    <div className="tour-root" role="dialog" aria-modal="true">
      {rect ? (
        <div
          className="tour-spot"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      ) : (
        <div className="tour-dim" onClick={end} />
      )}

      <div className="tour-card" style={cardStyle}>
        <div className="tour-progress">
          {TOUR_STEPS.map((s, i) => (
            <span key={s.id} className={`tour-dot ${i === stepIdx ? 'on' : ''}`} />
          ))}
        </div>
        <div className="tour-step-num">
          Step {stepIdx + 1} of {TOUR_STEPS.length}
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={end}>
            Skip
          </button>
          <div className="tour-nav">
            {stepIdx > 0 && (
              <button className="tour-btn" onClick={prev}>
                Back
              </button>
            )}
            <button className="tour-btn primary" onClick={isLast ? end : next}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
