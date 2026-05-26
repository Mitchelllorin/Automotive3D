/**
 * Global application state managed with Zustand.
 * Handles active tab, selected subsystem, explode/isolate mode, and active faults.
 */
import { create } from 'zustand';

const useAppStore = create((set) => ({
  // ── Navigation ────────────────────────────────────────────────
  activeTab: 'systems', // 'systems' | 'parts' | 'faults' | 'info'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Subsystem selection ───────────────────────────────────────
  selectedSubsystem: null, // subsystem id string or null
  setSelectedSubsystem: (id) =>
    set((state) => ({
      selectedSubsystem: state.selectedSubsystem === id ? null : id,
    })),
  /** Set subsystem without toggling (used when navigating from a component click). */
  selectSubsystem: (id) => set({ selectedSubsystem: id }),
  clearSubsystem: () =>
    set({ selectedSubsystem: null, isExploded: false, isIsolated: false, selectedComponent: null }),

  // ── Component selection ───────────────────────────────────────
  selectedComponent: null, // mesh name / component id string or null
  setSelectedComponent: (id) =>
    set((state) => ({
      selectedComponent: state.selectedComponent === id ? null : id,
    })),

  // ── Explode / Isolate modes ───────────────────────────────────
  isExploded: false,
  isIsolated: false,
  toggleExplode: () =>
    set((state) => ({ isExploded: !state.isExploded, isIsolated: false })),
  toggleIsolate: () =>
    set((state) => ({ isIsolated: !state.isIsolated, isExploded: false })),

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

  // ── Camera reset ──────────────────────────────────────────────
  cameraResetSignal: 0,
  triggerCameraReset: () =>
    set((state) => ({ cameraResetSignal: state.cameraResetSignal + 1 })),
}));

export default useAppStore;
