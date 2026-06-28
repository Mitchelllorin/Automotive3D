/**
 * engineInstance — per-engine context so more than one engine can run in a scene.
 *
 * Our engine was built as a singleton (one failure state, one build, one cam).
 * The Battle Arena needs two engines fighting side by side with independent
 * failures, parts, and valve timing. These contexts let an <EngineAssembly> read
 * its OWN state when wrapped in a provider, while the normal single-engine view —
 * which has no provider — falls back to the global singletons unchanged.
 */
import { createContext } from 'react';
import { failureState } from './failureState';
import { activeCam } from '../data/engineSpec';

/** Per-engine F.U.S.E. failure state (defaults to the global singleton). */
export const FailureContext = createContext(failureState);

/** Per-engine cam profile for the valve animation (defaults to the global activeCam). */
export const CamContext = createContext(activeCam);

/**
 * Per-engine build (the {category: variantId} map) used to resolve material looks
 * per engine. null → consumers read the store's partVariants as before.
 */
export const BuildContext = createContext(null);

/**
 * Per-engine *geometry* — the designed bore/stroke (+ compression/induction) of the
 * active motor, so a parametric assembly reflects the build: a longer stroke makes
 * the pistons travel further and the crank throw swing wider, a bigger bore widens
 * the cylinders. Defaults to the Small-Block 350 reference (4.00" × 3.48"); each
 * assembly normalises against its OWN base dimensions, so the same context drives the
 * V8 and the inline-four. Cylinder count / architecture still come from the chosen
 * assembly — changing those needs the parametric block generator (a later phase).
 */
export const GeomContext = createContext({
  boreIn: 4.0,
  strokeIn: 3.48,
  compression: 9.0,
  boostPsi: 0,
  induction: 'na',
});

/** Pull the geometry an assembly needs out of an engine package (safe defaults). */
export function engineGeom(engine) {
  return {
    boreIn: engine?.boreIn ?? 4.0,
    strokeIn: engine?.strokeIn ?? 3.48,
    compression: engine?.compression ?? 9.0,
    boostPsi: engine?.boostPsi ?? 0,
    induction: engine?.induction ?? 'na',
  };
}
