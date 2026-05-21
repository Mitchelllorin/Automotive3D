/**
 * Global application state managed with Zustand.
 * Handles active tab, selected subsystem, explode/isolate mode, and active faults.
 */
import { create } from 'zustand';

const useAppStore = create((set) => ({
  // ── Navigation ────────────────────────────────────────────────
  activeTab: 'systems', // 'systems' | 'faults' | 'info'
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Subsystem selection ───────────────────────────────────────
  selectedSubsystem: null, // subsystem id string or null
  setSelectedSubsystem: (id) =>
    set((state) => ({
      selectedSubsystem: state.selectedSubsystem === id ? null : id,
    })),
  clearSubsystem: () => set({ selectedSubsystem: null, isExploded: false, isIsolated: false }),

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
}));

export default useAppStore;
