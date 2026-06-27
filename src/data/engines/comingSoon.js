/**
 * comingSoon — motors announced in the roster before their geometry is drawn.
 *
 * Each is a real engine package flagged `available:false`, so it shows in the
 * Build/Arena roster as a locked "coming soon" tile without needing its own 3D
 * assembly or catalog yet. They reuse the shared structure so nothing downstream
 * crashes if one is previewed; the store refuses to make a locked motor active.
 * Drawing one later = building its assembly + catalog and flipping available:true.
 */
import { PRODUCTS } from '../products';

const cyl = (bore, stroke, n) => (Math.PI / 4) * bore * bore * stroke * n;

const base = {
  arch: 'ohv',
  assemblyId: 'engine', // placeholder until each gets its own assembly
  available: false,
  products: PRODUCTS,
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'carburetor', 'exhaust_manifold', 'air_cleaner'],
  airflowCategory: 'carburetor',
  dyno: { baseVe: 0.55, basePeakRpm: 2100, bmepAtVe1: 180, veCeiling: 1.06, carbK: 1.18, carbN: 3.2, idleRpm: 750 },
};

export const COMING_SOON = [
  {
    ...base,
    id: 'bbc454', name: 'Chevrolet 454 Big-Block', shortName: 'BBC 454',
    badge: 'V8 · Big-Block · Coming soon', cylinders: 8, weightLb: 3850,
    boreIn: 4.25, strokeIn: 4.0, displacementCI: cyl(4.25, 4.0, 8), // ≈ 454
    teaser: 'Rat motor torque — tall-deck big-block with the deep chambers and huge ports.',
  },
  {
    ...base,
    id: 'ls376', name: 'Chevrolet LS 6.2 (LS3)', shortName: 'LS 376',
    badge: 'V8 · OHV · EFI · Coming soon', cylinders: 8, weightLb: 3300,
    boreIn: 4.065, strokeIn: 3.622, displacementCI: cyl(4.065, 3.622, 8), // ≈ 376
    teaser: 'Modern aluminium LS — cathedral/rectangle ports, EFI throttle body airflow.',
  },
  {
    ...base,
    id: 'ford302', name: 'Ford 302 Windsor', shortName: '302 Windsor',
    badge: 'Ford V8 · OHV · Coming soon', cylinders: 8, weightLb: 3250,
    boreIn: 4.0, strokeIn: 3.0, displacementCI: cyl(4.0, 3.0, 8), // ≈ 302
    teaser: 'The 5.0 — Ford small-block, firing order and Windsor heads all its own.',
  },
];
