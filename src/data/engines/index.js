/**
 * Engine registry — the roster of motors you can build and battle.
 *
 * Each entry is a self-contained engine package (see smallBlockV8.js). To add a
 * motor, write its package and `registerEngine(pkg)` (or add it to ENGINES); the
 * dyno, garage, and arena all read whichever engine is active in the store.
 * Packages flagged `available:false` show in the roster as "coming soon" without
 * needing their geometry finished — so a motor can be announced before it's drawn.
 */
import { smallBlockV8 } from './smallBlockV8';
import { sbc383 } from './sbc383';
import { sbc400 } from './sbc400';
import { inline4 } from './inline4';
import { bbc454 } from './bbc454';
import { ls53 } from './ls53';
import { COMING_SOON } from './comingSoon';
// Side-effect imports: part packs that register themselves into the catalog.
// (Imported here because the engine registry is on every consumer's import path,
// so the catalog is fully populated before the dyno/garage/arena read it.)
import '../parts/engineBlock';

export const ENGINES = {
  [smallBlockV8.id]: smallBlockV8,
  [sbc383.id]: sbc383,
  [sbc400.id]: sbc400,
  [inline4.id]: inline4,
  [bbc454.id]: bbc454,
  [ls53.id]: ls53,
  ...Object.fromEntries(COMING_SOON.map((e) => [e.id, e])),
};

/** Register a motor package at load (the extension point for new engines). */
export function registerEngine(pkg) {
  if (!pkg || !pkg.id) throw new Error('registerEngine: a package needs an { id }');
  ENGINES[pkg.id] = pkg;
  return pkg;
}

/** Remove a registered motor (used to drop a deleted custom engine). */
export function unregisterEngine(id) {
  if (id && id !== DEFAULT_ENGINE_ID) delete ENGINES[id];
}

/** Every registered motor (available + coming-soon), for roster UIs. */
export function engineList() {
  return Object.values(ENGINES);
}

/** Only the motors you can actually build/battle right now. */
export function availableEngines() {
  return Object.values(ENGINES).filter((e) => e.available);
}

export const ENGINE_LIST = Object.values(ENGINES);
export const DEFAULT_ENGINE_ID = smallBlockV8.id;

export function getEngine(id) {
  return ENGINES[id] ?? ENGINES[DEFAULT_ENGINE_ID];
}

export const DEFAULT_ENGINE = ENGINES[DEFAULT_ENGINE_ID];
