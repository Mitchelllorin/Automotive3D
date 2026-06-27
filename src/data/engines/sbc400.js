/**
 * sbc400 — the 400 Small-Block, the biggest factory small-block.
 *
 * 4.125" siamesed bores on a 3.75" stroke → ~406 ci. The torque king of the
 * small-block family, but the siamesed bores run it hotter, which is why a builder
 * watches cooling on a 400. Same external package as the rest of the SBC family, so
 * it reuses the assembly and catalog; the extra displacement is what moves the dyno.
 */
import { PRODUCTS } from '../products';

const BORE_IN = 4.125;
const STROKE_IN = 3.75;
const N_CYL = 8;

export const sbc400 = {
  id: 'sbc400',
  name: 'Chevrolet 400 Small-Block',
  shortName: 'SBC 400',
  badge: 'V8 · OHV · Big-Bore',
  arch: 'ohv',
  assemblyId: 'engine',
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN * BORE_IN * STROKE_IN * N_CYL, // ≈ 406
  boreIn: BORE_IN,
  strokeIn: STROKE_IN,
  cylinders: N_CYL,
  weightLb: 3450,

  products: PRODUCTS,
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'carburetor', 'exhaust_manifold', 'air_cleaner'],
  airflowCategory: 'carburetor',

  dyno: {
    baseVe: 0.55,
    basePeakRpm: 1950,
    bmepAtVe1: 182,
    veCeiling: 1.06,
    carbK: 1.18,
    carbN: 3.2,
    idleRpm: 750,
  },
};
