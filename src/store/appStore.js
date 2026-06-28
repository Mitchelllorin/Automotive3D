/**
 * Global application state managed with Zustand.
 * Handles active tab, selected subsystem, explode/isolate mode, and active faults.
 */
import { create } from 'zustand';
import { explodeState } from '../lib/explodeState';
import { setActiveCam } from '../data/engineSpec';
import { getActiveVariant } from '../data/products';
import { getEngine, DEFAULT_ENGINE_ID } from '../data/engines';
import {
  registerSavedCustomEngines,
  loadCustomSpecs,
  saveCustomEngine,
  deleteCustomEngine,
} from '../data/engines/customEngine';

// Synthesize + register every saved user-designed motor BEFORE the store initializes,
// so a persisted active engine id (which may be a custom one) resolves on first render.
registerSavedCustomEngines();

/** Push the selected camshaft's profile into the live valve animation. */
function applyCamProfile(variantId) {
  const cam = getActiveVariant('camshaft', variantId)?.cam;
  if (cam) setActiveCam(cam);
}

/** Optional initial teardown amount from the URL, e.g. ?explode=1 (deep links / screenshots). */
const initialExplode = (() => {
  if (typeof window === 'undefined') return 0;
  const raw = new URLSearchParams(window.location.search).get('explode');
  const v = parseFloat(raw);
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
})();
// Pre-seed the eased value so the first rendered frame already matches the target.
explodeState.factor = initialExplode;

/** Sidebar width is user-resizable and remembered across sessions. */
const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 560;
const clampSidebar = (w) => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w));
const initialSidebarWidth = (() => {
  if (typeof window === 'undefined') return 320;
  const raw = parseFloat(window.localStorage.getItem('a3d:sidebarWidth'));
  return Number.isFinite(raw) ? clampSidebar(raw) : 320;
})();

const useAppStore = create((set) => ({
  // ── Navigation ────────────────────────────────────────────────
  activeTab: 'build', // 'build' | 'arena' | 'faults' | 'parts' | 'systems' | 'info'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Guided tour / tutorial ────────────────────────────────────
  // A step-through coachmark walkthrough (see components/ui/Tour + lib/tourSteps).
  // Auto-runs once for new users; replayable from the ? button.
  tutorialSeen: typeof window !== 'undefined' && window.localStorage.getItem('a3d:tutorialSeen') === '1',
  tourActive: false,
  tourStep: 0,
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  tourNext: () => set((s) => ({ tourStep: s.tourStep + 1 })),
  tourPrev: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
  tourGoto: (i) => set({ tourStep: Math.max(0, i) }),
  endTour: () => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('a3d:tutorialSeen', '1'); } catch { /* ignore */ }
    }
    return set({ tourActive: false, tutorialSeen: true });
  },

  // ── Workspace layout ──────────────────────────────────────────
  // Collapsing the side panel hands the full viewport to the 3D scene.
  // Default COLLAPSED so the engine — not the Build/product panel — is the hero
  // on load (it would otherwise eat ~42vh on a phone). The choice is remembered.
  sidebarCollapsed: (() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('a3d:sidebarCollapsed') !== 'false';
  })(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      try {
        window.localStorage.setItem('a3d:sidebarCollapsed', String(next));
      } catch {
        /* private mode / storage full — non-fatal, just won't persist */
      }
      return { sidebarCollapsed: next };
    }),
  /** Explicit setter (used by the guided tour to open the panel for a step). */
  setSidebarCollapsed: (v) =>
    set(() => {
      try { window.localStorage.setItem('a3d:sidebarCollapsed', String(!!v)); } catch { /* ignore */ }
      return { sidebarCollapsed: !!v };
    }),
  // The floating engine-control menu is dismissable; the camera re-centers the
  // engine into the freed space when it's collapsed (see ViewOffsetController).
  controlsCollapsed: false,
  toggleControls: () => set((state) => ({ controlsCollapsed: !state.controlsCollapsed })),
  setControlsCollapsed: (v) => set({ controlsCollapsed: !!v }),

  // ── Active engine — which motor you're building / battling ─────
  // The whole roster lives in data/engines; the dyno, garage, F.U.S.E. and arena
  // all read whichever package is active. Persisted so your motor sticks.
  activeEngineId: (() => {
    if (typeof window === 'undefined') return DEFAULT_ENGINE_ID;
    const saved = window.localStorage.getItem('a3d:engineId');
    const pkg = saved && getEngine(saved);
    return pkg && pkg.available ? pkg.id : DEFAULT_ENGINE_ID;
  })(),
  /** Switch the motor being built. Locked ("coming soon") packages are refused. */
  setEngine: (id) =>
    set(() => {
      const pkg = getEngine(id);
      if (!pkg || !pkg.available) return {};
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:engineId', pkg.id);
      return { activeEngineId: pkg.id };
    }),

  // ── Custom motors — the user designs their own (bore/stroke/CR/induction) ──────
  // A custom motor is a small spec synthesized into a full engine package on the fly
  // (see data/engines/customEngine). Specs persist; packages register so the dyno,
  // garage, F.U.S.E. and arena treat a designed motor exactly like a roster one.
  customEngines: loadCustomSpecs(), // the saved specs (for the roster + re-editing)
  customVersion: 0, // bumped on add/remove so roster UIs (engineList) recompute
  designerOpen: false,
  designerSpec: null, // the spec being edited (null when designing fresh)
  /** Open the engine designer — optionally seeded with an existing spec to edit. */
  openDesigner: (spec = null) => set({ designerOpen: true, designerSpec: spec }),
  closeDesigner: () => set({ designerOpen: false, designerSpec: null }),
  /** Create or update a custom motor, register it, and make it the active engine. */
  addCustomEngine: (spec) =>
    set((state) => {
      const pkg = saveCustomEngine(spec);
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:engineId', pkg.id);
      return {
        customEngines: loadCustomSpecs(),
        customVersion: state.customVersion + 1,
        activeEngineId: pkg.id,
        designerOpen: false,
        designerSpec: null,
      };
    }),
  /** Delete a custom motor; if it was active, fall back to the default platform. */
  removeCustomEngine: (id) =>
    set((state) => {
      deleteCustomEngine(id);
      const active = state.activeEngineId === id ? DEFAULT_ENGINE_ID : state.activeEngineId;
      if (typeof window !== 'undefined' && active !== state.activeEngineId) {
        window.localStorage.setItem('a3d:engineId', active);
      }
      return {
        customEngines: loadCustomSpecs(),
        customVersion: state.customVersion + 1,
        activeEngineId: active,
      };
    }),

  // ── Garage: part swapping / product placement ─────────────────
  // Maps a component id → chosen variant id (see data/products.js). A part with
  // no entry shows its OEM/default look. Persisted so a built engine sticks.
  partVariants: (() => {
    if (typeof window === 'undefined') return {};
    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem('a3d:partVariants')) || {};
    } catch {
      saved = {};
    }
    applyCamProfile(saved.camshaft); // restore the built cam's valve timing on load
    return saved;
  })(),
  setPartVariant: (componentId, variantId) =>
    set((state) => {
      const next = { ...state.partVariants, [componentId]: variantId };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('a3d:partVariants', JSON.stringify(next));
      }
      if (componentId === 'camshaft') applyCamProfile(variantId);
      return { partVariants: next };
    }),

  // ── 3D logo FX — floating logo controls (matches the sibling apps), persisted ──
  logoFx: (() => {
    // The floating workspace logo defaults to nearly transparent — a subtle ghosted
    // watermark, not a label competing with the engine. (The header mark is opaque;
    // it passes useFx={false}.) Adjustable in Settings; raise opacity to make it pop.
    const def = { opacity: 0.12, speed: 1, bounce: 0.5 };
    if (typeof window === 'undefined') return def;
    try {
      return { ...def, ...(JSON.parse(window.localStorage.getItem('a3d:logoFx')) || {}) };
    } catch {
      return def;
    }
  })(),
  setLogoFx: (partial) =>
    set((s) => {
      const logoFx = { ...s.logoFx, ...partial };
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:logoFx', JSON.stringify(logoFx));
      return { logoFx };
    }),
  logoSettingsOpen: false,
  toggleLogoSettings: () => set((s) => ({ logoSettingsOpen: !s.logoSettingsOpen })),

  // ── Ghost preview — try a part on the engine before committing it ────────────
  // While set, the 3D engine + build numbers show this part as a translucent
  // "ghost"; releasing commits it (setPartVariant), sliding off clears it.
  preview: null, // { category, variantId } | null
  setPreview: (category, variantId) =>
    set((s) =>
      s.preview && s.preview.category === category && s.preview.variantId === variantId
        ? {}
        : { preview: { category, variantId } }
    ),
  clearPreview: () => set((s) => (s.preview ? { preview: null } : {})),

  // ── Custom builds — the user's saved engine combos ───────────────────────────
  savedBuilds: (() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('a3d:savedBuilds')) || [];
    } catch {
      return [];
    }
  })(),
  activeBuildId: null,
  /** Persist the current part selection as a named custom build. */
  saveBuild: (name) =>
    set((state) => {
      const id = `b_${Date.now()}`;
      const build = { id, name: name?.trim() || `Build ${state.savedBuilds.length + 1}`, engineId: state.activeEngineId, partVariants: { ...state.partVariants } };
      const next = [...state.savedBuilds, build];
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:savedBuilds', JSON.stringify(next));
      return { savedBuilds: next, activeBuildId: id };
    }),
  /** Load a saved build into the active part selection. */
  loadBuild: (id) =>
    set((state) => {
      const build = state.savedBuilds.find((b) => b.id === id);
      if (!build) return {};
      const pv = { ...build.partVariants };
      // Restore the motor this build was made on (if it's still selectable).
      const enginePkg = build.engineId && getEngine(build.engineId);
      const engineId = enginePkg && enginePkg.available ? enginePkg.id : state.activeEngineId;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('a3d:partVariants', JSON.stringify(pv));
        window.localStorage.setItem('a3d:engineId', engineId);
      }
      applyCamProfile(pv.camshaft);
      return { partVariants: pv, activeBuildId: id, activeEngineId: engineId };
    }),
  deleteBuild: (id) =>
    set((state) => {
      const next = state.savedBuilds.filter((b) => b.id !== id);
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:savedBuilds', JSON.stringify(next));
      return { savedBuilds: next, activeBuildId: state.activeBuildId === id ? null : state.activeBuildId };
    }),
  /** Start fresh — reset every category to its OEM/stock part. */
  newBuild: () =>
    set(() => {
      if (typeof window !== 'undefined') window.localStorage.setItem('a3d:partVariants', JSON.stringify({}));
      applyCamProfile(undefined);
      return { partVariants: {}, activeBuildId: null };
    }),

  // User-draggable panel width (px), clamped and persisted to localStorage.
  sidebarWidth: initialSidebarWidth,
  setSidebarWidth: (w) => {
    const clamped = clampSidebar(w);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('a3d:sidebarWidth', String(clamped));
    }
    set({ sidebarWidth: clamped });
  },

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
  setEngineRunning: (v) => set({ engineRunning: !!v }),
  setTargetRpm: (v) => set({ targetRpm: Math.max(0, Math.min(7000, Math.round(v))) }),
  setTimeScale: (v) => set({ timeScale: Math.max(0.02, Math.min(1, v)) }),
  // ── Battle Arena (head-to-head stress duel staged in the workspace) ──────────
  arena: { active: false, status: 'ready', winner: null, rivalId: 'stock' },
  toggleArena: () =>
    set((s) => ({ arena: { ...s.arena, active: !s.arena.active, status: 'ready', winner: null } })),
  setArenaRival: (rivalId) => set((s) => ({ arena: { ...s.arena, rivalId, status: 'ready', winner: null } })),
  startArena: () => set((s) => ({ arena: { ...s.arena, status: 'battling', winner: null } })),
  resetArena: () => set((s) => ({ arena: { ...s.arena, status: 'ready', winner: null } })),
  finishArena: (winner) => set((s) => ({ arena: { ...s.arena, status: 'complete', winner } })),

  // ── F.U.S.E. operating conditions (shared by the panel + the 3D failure FX) ──
  // Which environment / fuel / engine load the failure engine evaluates against.
  fuseConditions: { envIdx: 0, fuelIdx: 1, load: 1 },
  setFuseConditions: (patch) =>
    set((state) => ({ fuseConditions: { ...state.fuseConditions, ...patch } })),

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
