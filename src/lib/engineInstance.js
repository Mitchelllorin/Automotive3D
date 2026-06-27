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
