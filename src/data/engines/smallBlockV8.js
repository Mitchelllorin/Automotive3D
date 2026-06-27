/**
 * smallBlockV8 — the Chevy 350 as a self-contained engine package.
 *
 * An "engine package" is everything that varies from one motor to the next, in
 * one object: its identity, architecture, real displacement, the 3D assembly that
 * draws it, the parts catalog you can bolt onto it, and the dyno calibration that
 * makes its power curve land where a builder expects. Adding a motor (the Coyote,
 * a Hemi, a boosted import) means writing another one of these — not editing the
 * model. The dyno and arena read whichever package is active.
 */
import { BORE, STROKE, SCALE, CYLINDER_IDS } from '../engineSpec';
import { PRODUCTS } from '../products';

const BORE_IN = BORE / SCALE;
const STROKE_IN = STROKE / SCALE;
const N_CYL = CYLINDER_IDS.length;

export const smallBlockV8 = {
  id: 'sbc350',
  name: 'Chevrolet 350 Small-Block',
  shortName: 'SBC 350',
  badge: 'V8 · OHV · Carbureted',
  arch: 'ohv', // pushrod, cam-in-block
  assemblyId: 'engine', // which 3D assembly in the registry draws it
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN * BORE_IN * STROKE_IN * N_CYL, // ≈ 350
  boreIn: BORE_IN,
  strokeIn: STROKE_IN,
  cylinders: N_CYL,
  weightLb: 3400, // the car it lives in, for the drag/0-60 estimates

  // Its shoppable catalog and which categories actually make power.
  products: PRODUCTS,
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'carburetor', 'exhaust_manifold', 'air_cleaner'],
  // The category that owns the airflow ceiling (the carb here; a throttle body on EFI motors).
  airflowCategory: 'carburetor',

  // Dyno calibration — tuned so a stock 4-bbl 350 lands ~254 hp / 345 lb-ft and a
  // full build walks up toward ~425. See lib/dyno.js for what each knob does.
  dyno: {
    baseVe: 0.55,
    basePeakRpm: 2100,
    bmepAtVe1: 180,
    veCeiling: 1.06,
    carbK: 1.18,
    carbN: 3.2,
    idleRpm: 750,
  },
};
