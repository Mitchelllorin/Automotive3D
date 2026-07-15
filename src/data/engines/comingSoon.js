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
    id: 'ls376', name: 'Chevrolet LS 6.2 (LS3)', shortName: 'LS 376',
    badge: 'V8 · OHV · EFI · Coming soon', cylinders: 8, weightLb: 3300,
    boreIn: 4.065, strokeIn: 3.622, displacementCI: cyl(4.065, 3.622, 8), // ≈ 376
    teaser: 'Big-brother LS — rectangle-port heads and 6.2L displacement. Same architecture as the 5.3 but bred for higher rpm.',
  },
  {
    ...base,
    id: 'ford50coyote', name: 'Ford 5.0 Coyote V8', shortName: '5.0 Coyote',
    badge: 'Ford V8 · DOHC · EFI · Coming soon', arch: 'dohc', cylinders: 8, weightLb: 3200,
    boreIn: 3.629, strokeIn: 3.649, displacementCI: cyl(3.629, 3.649, 8), // ≈ 302
    teaser: 'The modern Mustang engine — DOHC four-cam V8, Ti-VCT on both banks, 5.0L of Ford fury.',
  },
  {
    ...base,
    id: 'dodgehemi392', name: 'Dodge 392 HEMI V8', shortName: '392 HEMI',
    badge: 'Mopar V8 · OHV · HEMI · Coming soon', cylinders: 8, weightLb: 3600,
    boreIn: 4.09, strokeIn: 3.578, displacementCI: cyl(4.09, 3.578, 8), // ≈ 392
    teaser: 'The modern 6.4 HEMI — hemispherical combustion chambers, MDS cylinder deactivation, and a mean torque curve.',
  },
  {
    ...base,
    id: '2jzgte', name: 'Toyota 2JZ-GTE Inline-6', shortName: '2JZ-GTE',
    badge: 'Toyota I6 · DOHC · Twin-Turbo · Coming soon', arch: 'dohc', cylinders: 6, weightLb: 3100,
    boreIn: 3.386, strokeIn: 3.386, displacementCI: cyl(3.386, 3.386, 6), // ≈ 183
    teaser: 'The legendary 2JZ-GTE — sequential twin-turbo 3.0L DOHC inline-six, famous for handling 1000+ hp on the stock block.',
  },
  {
    ...base,
    id: 'hondak20c', name: 'Honda K20C Type R', shortName: 'K20C',
    badge: 'Honda I4 · DOHC · Turbo · Coming soon', arch: 'dohc', cylinders: 4, weightLb: 2800,
    boreIn: 3.386, strokeIn: 3.386, displacementCI: cyl(3.386, 3.386, 4), // ≈ 122
    teaser: 'The Civic Type R engine — direct-injection turbocharged DOHC four, VTEC on intake, screams to 7000 rpm.',
  },
  {
    ...base,
    id: 'ford302', name: 'Ford 302 Windsor', shortName: '302 Windsor',
    badge: 'Ford V8 · OHV · Coming soon', cylinders: 8, weightLb: 3250,
    boreIn: 4.0, strokeIn: 3.0, displacementCI: cyl(4.0, 3.0, 8), // ≈ 302
    teaser: 'The classic 5.0 — Ford small-block with its own firing order, Windsor heads, and a lifetime of aftermarket support.',
  },
];
