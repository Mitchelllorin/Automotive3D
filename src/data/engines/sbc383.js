/**
 * sbc383 — the 383 stroker, the small-block torque favourite.
 *
 * A 350 block bored .030" over (4.030") swinging a 3.75" stroke crank → 383 ci.
 * Externally it is a Small-Block Chevy — same castings, same dress-up — so it
 * draws the SAME 3D assembly and bolts on the SAME catalog. What changes is what
 * you can't see: ~33 more cubic inches make noticeably more torque everywhere, and
 * the longer stroke lights up the bottom end. All of that falls out of the dyno
 * automatically because torque is computed from this package's displacementCI.
 */
import { PRODUCTS } from '../products';

const BORE_IN = 4.03;
const STROKE_IN = 3.75;
const N_CYL = 8;

export const sbc383 = {
  id: 'sbc383',
  name: 'Chevrolet 383 Stroker',
  shortName: 'SBC 383',
  badge: 'V8 · OHV · Stroker',
  arch: 'ohv',
  assemblyId: 'engine',
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN * BORE_IN * STROKE_IN * N_CYL, // ≈ 383
  boreIn: BORE_IN,
  strokeIn: STROKE_IN,
  cylinders: N_CYL,
  weightLb: 3400,

  products: PRODUCTS,
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'carburetor', 'exhaust_manifold', 'air_cleaner'],
  airflowCategory: 'carburetor',

  // Same calibration knobs as the 350 — the extra 33 ci does the work. The longer
  // stroke biases the torque hump a touch lower, so the curve fattens down low.
  dyno: {
    baseVe: 0.55,
    basePeakRpm: 2000,
    bmepAtVe1: 182,
    veCeiling: 1.06,
    carbK: 1.18,
    carbN: 3.2,
    idleRpm: 750,
  },
};
