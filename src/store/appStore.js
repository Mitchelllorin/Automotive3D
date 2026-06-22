/**
 * Global application state managed with Zustand.
 * Handles active tab, selected subsystem, explode/isolate mode, and active faults.
 */
import { create } from 'zustand';
import { explodeState } from '../lib/explodeState';

/** Optional initial teardown amount from the URL, e.g. ?explode=1 (deep links / screenshots). */
const initialExplode = (() => {
  if (typeof window === 'undefined') return 0;
  const raw = new URLSearchParams(window.location.search).get('explode');
  const v = parseFloat(raw);
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
})();
// Pre-seed the eased value so the first rendered frame already matches the target.
explodeState.factor = initialExplode;

const useAppStore = create((set) => ({
  // ── Navigation ────────────────────────────────────────────────
  activeTab: 'systems', // 'systems' | 'parts' | 'faults' | 'info'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Subsystem selection ───────────────────────────────────────
  selectedSubsystem: null, // subsystem id string or null
  // Toggle a whole system (Systems tab). Clearing any specific component lets the
  // depth-aware fade anchor on the system as a whole, not a part picked earlier.
  setSelectedSubsystem: (id) =>
    set((state) => ({
      selectedSubsystem: state.selectedSubsystem === id ? null : id,
      selectedComponent: null,
    })),
  /** Set subsystem without toggling (used when navigating from a component click). */
  selectSubsystem: (id) => set({ selectedSubsystem: id }),
  clearSubsystem: () =>
    set({ selectedSubsystem: null, isIsolated: false, selectedComponent: null }),

  // ── Component selection ───────────────────────────────────────
  selectedComponent: null, // mesh name / component id string or null
  setSelectedComponent: (id) =>
    set((state) => ({
      selectedComponent: state.selectedComponent === id ? null : id,
    })),

  // ── Hover (drives the floating nameplate) ─────────────────────
  hoveredComponent: null, // mesh name / component id currently under the cursor
  setHoveredComponent: (id) => set({ hoveredComponent: id }),
  // Clear only if `id` is still the hovered one, so leaving part A doesn't
  // wipe the nameplate after the cursor has already entered part B.
  clearHoveredComponent: (id) =>
    set((state) =>
      id == null || state.hoveredComponent === id ? { hoveredComponent: null } : {}
    ),

  // ── Explode / Isolate modes ───────────────────────────────────
  // explodeFactor is the continuous teardown amount (0 = assembled, 1 = fully apart).
  // isExploded is kept as a derived convenience flag for existing UI bits.
  isExploded: initialExplode > 0.001,
  explodeFactor: initialExplode,
  isIsolated: false,
  setExplodeFactor: (v) => {
    const f = Math.max(0, Math.min(1, v));
    set({ explodeFactor: f, isExploded: f > 0.001 });
  },
  toggleExplode: () =>
    set((state) => {
      const next = state.explodeFactor > 0.001 ? 0 : 1;
      return { explodeFactor: next, isExploded: next > 0.001 };
    }),
  toggleIsolate: () =>
    set((state) => ({ isIsolated: !state.isIsolated })),

  // ── Active faults ─────────────────────────────────────────────
  activeFaults: {}, // { [faultId]: boolean }
  toggleFault: (faultId) =>
    set((state) => ({
      activeFaults: {
        ...state.activeFaults,
        [faultId]: !state.activeFaults[faultId],
      },
    })),
  clearAllFaults: () => set({ activeFaults: {} }),

  // ── Animation control ─────────────────────────────────────────
  animationsEnabled: true,
  toggleAnimations: () =>
    set((state) => ({ animationsEnabled: !state.animationsEnabled })),

  // ── Engine simulation ─────────────────────────────────────────
  // running gates the crank; targetRpm is the idle/rev setpoint; timeScale is
  // a slow-motion factor so the internals can be studied while "running".
  engineRunning: false,
  targetRpm: 850, // idle
  timeScale: 0.15, // start in gentle slow-mo so motion reads clearly
  toggleEngine: () => set((state) => ({ engineRunning: !state.engineRunning })),
  setTargetRpm: (v) => set({ targetRpm: Math.max(0, Math.min(7000, Math.round(v))) }),
  setTimeScale: (v) => set({ timeScale: Math.max(0.02, Math.min(1, v)) }),
  // Cross-section: slice the front half away to watch pistons/valves run inside.
  // The cutaway plane follows the focused part's depth (see focusState).
  cutaway: false,
  toggleCutaway: () => set((state) => ({ cutaway: !state.cutaway })),

  // Hold-to-reveal ("peek"): while held, ghost every system except the selected
  // one so you can trace a single sub-assembly through the engine. Momentary —
  // driven by holding the X key or pressing-and-holding the reveal button.
  peek: false,
  setPeek: (v) => set({ peek: !!v }),

  // ── Camera reset ──────────────────────────────────────────────
  cameraResetSignal: 0,
  triggerCameraReset: () =>
    set((state) => ({ cameraResetSignal: state.cameraResetSignal + 1 })),
}));

export default useAppStore;
