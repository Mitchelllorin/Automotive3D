/**
 * inline4 — a 2.0L turbocharged DOHC four, the first motor with its OWN 3D model
 * (assemblyId 'inline4') and its OWN parts catalog, separate from the small-block.
 *
 * It's deliberately a different machine: small displacement making big power on
 * boost, so the build levers are the turbo (the airflow ceiling here, the way the
 * carb is on the V8), the cams, the charge cooling and the exhaust. Its catalog is
 * self-contained (I4_PRODUCTS) so swapping a part on the four never shows a V8 part
 * and vice-versa — the dyno, builder and arena all read whichever engine is active.
 */
const buy = (q) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}`;

const BORE_IN = 3.386; // 86 mm
const STROKE_IN = 3.386; // 86 mm — a square 2.0
const N_CYL = 4;

/** The turbo-four's own shoppable, swappable catalog (perf-only; geometry is fixed). */
export const I4_PRODUCTS = {
  turbo: {
    label: 'Turbocharger',
    variants: [
      { id: 'oem-twinscroll', brand: 'OEM', name: 'Twin-Scroll (Stock)', oem: true,
        price: 0, rating: 4.4, reviews: 510, spec: 'stock twin-scroll · ~14 psi',
        blurb: 'Factory twin-scroll turbo — fast spool, modest top-end.',
        perf: { ve: 0.42, cfm: 340, redline: 6800, peakRpm: 1100, lowWidth: 1650, highWidth: 2200 },
        buyUrl: buy('twin scroll turbocharger 2.0') },
      { id: 'garrett-g25', brand: 'Garrett', name: 'G25-660 Ball-Bearing', tint: '#c7ccd2',
        price: 1749, rating: 4.9, reviews: 430, spec: 'ball-bearing · ~22 psi · 660 hp class',
        blurb: 'Modern dual-ball-bearing turbo — wider map, big mid-range under boost.',
        perf: { ve: 0.64, cfm: 440, redline: 7200, peakRpm: 1500, lowWidth: 1550, highWidth: 2600, lopiness: 0.1 },
        buyUrl: buy('Garrett G25-660 turbo') },
      { id: 'borg-efr', brand: 'BorgWarner', name: 'EFR 8474 Big-Single', tint: '#b5651d',
        price: 2399, rating: 4.8, reviews: 260, spec: 'gamma-Ti · ~30 psi · top-end monster',
        blurb: 'Big EFR single — laggier down low, screams up top. Built-motor territory.',
        perf: { ve: 0.82, cfm: 540, redline: 7600, peakRpm: 2100, lowWidth: 1450, highWidth: 2900, lopiness: 0.2 },
        buyUrl: buy('BorgWarner EFR 8474 turbo') },
    ],
  },
  camshaft: {
    label: 'Camshafts',
    variants: [
      { id: 'oem-cam', brand: 'OEM', name: 'Stock DOHC', oem: true,
        price: 0, rating: 4.5, reviews: 320, spec: 'stock duration · VVT',
        blurb: 'Factory cams — smooth, torquey, emissions-friendly.', perf: {},
        buyUrl: buy('2.0 turbo camshaft stock') },
      { id: 'stage2-cam', brand: 'Kelford', name: 'Stage 2 Billet', tint: '#c7ccd2',
        price: 689, rating: 4.7, reviews: 140, spec: '+1 mm lift · regrind',
        blurb: 'Bigger billet cams — wakes up the top end past the stock turbo.',
        perf: { ve: 0.05, peakRpm: 450, lopiness: 0.12 },
        buyUrl: buy('Kelford stage 2 cams 2.0 turbo') },
      { id: 'stage3-cam', brand: 'Kelford', name: 'Stage 3 Race', tint: '#b5651d',
        price: 949, rating: 4.6, reviews: 90, spec: 'race duration · solid lash',
        blurb: 'Race-duration sticks — lumpy idle, all top end. Big-turbo partner.',
        perf: { ve: 0.09, peakRpm: 750, lopiness: 0.28 },
        buyUrl: buy('Kelford stage 3 race cams') },
    ],
  },
  intercooler: {
    label: 'Intercooler',
    variants: [
      { id: 'oem-ic', brand: 'OEM', name: 'Stock Bar-&-Plate', oem: true,
        price: 0, rating: 4.3, reviews: 280, spec: 'stock core',
        blurb: 'Factory intercooler — heat-soaks on repeat pulls.', perf: {},
        buyUrl: buy('2.0 turbo intercooler stock') },
      { id: 'fmic', brand: 'Mishimoto', name: 'Front-Mount Race Core', tint: '#c7ccd2',
        price: 595, rating: 4.8, reviews: 770, spec: 'big front-mount · denser charge',
        blurb: 'Front-mount race core — colder, denser charge means more power up top.',
        perf: { ve: 0.06, highWidth: 100 },
        buyUrl: buy('Mishimoto front mount intercooler') },
    ],
  },
  exhaust_manifold: {
    label: 'Downpipe / Exhaust',
    variants: [
      { id: 'oem-dp', brand: 'OEM', name: 'Stock Cat Downpipe', oem: true,
        price: 0, rating: 4.2, reviews: 410, spec: 'stock cat · restrictive',
        blurb: 'Factory catted downpipe — quiet, but chokes boost up top.', perf: {},
        buyUrl: buy('2.0 turbo downpipe stock') },
      { id: 'catless-dp', brand: 'CTS', name: '3" Catless Downpipe', tint: '#c7ccd2',
        price: 329, rating: 4.7, reviews: 980, spec: '3" · catless',
        blurb: 'Opens the exhaust side so the turbo breathes — spool and top-end gains.',
        perf: { ve: 0.05, peakRpm: 200 },
        buyUrl: buy('CTS 3 inch catless downpipe') },
    ],
  },
  intake_manifold: {
    label: 'Intake Manifold',
    variants: [
      { id: 'oem-intake', brand: 'OEM', name: 'Stock Plenum', oem: true,
        price: 0, rating: 4.4, reviews: 230, spec: 'stock plenum',
        blurb: 'Factory intake — fine for stock-ish power.', perf: {},
        buyUrl: buy('2.0 turbo intake manifold') },
      { id: 'ported-intake', brand: 'IE', name: 'Ported Billet Plenum', tint: '#c7ccd2',
        price: 749, rating: 4.6, reviews: 160, spec: 'ported · billet runners',
        blurb: 'Bigger ported plenum — flows for the larger turbos.',
        perf: { ve: 0.04, peakRpm: 200 },
        buyUrl: buy('IE ported intake manifold 2.0 turbo') },
    ],
  },
  air_cleaner: {
    label: 'Intake / Air',
    variants: [
      { id: 'oem-airbox', brand: 'OEM', name: 'Stock Airbox', oem: true,
        price: 0, rating: 4.3, reviews: 300, spec: 'stock airbox',
        blurb: 'Factory airbox and paper filter.', perf: {},
        buyUrl: buy('2.0 turbo air intake stock') },
      { id: 'cai', brand: 'K&N', name: 'Cold-Air Intake', tint: '#c2122a',
        price: 369, rating: 4.7, reviews: 1450, spec: 'open cone · larger tube',
        blurb: 'Cold-air intake — a little more flow feeding the compressor.',
        perf: { ve: 0.02 },
        buyUrl: buy('K&N cold air intake 2.0 turbo') },
    ],
  },
};

export const inline4 = {
  id: 'i4turbo',
  name: '2.0L Turbo Inline-4',
  shortName: 'I4 Turbo',
  badge: 'I4 · DOHC · Turbo',
  arch: 'dohc',
  assemblyId: 'inline4',
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN * BORE_IN * STROKE_IN * N_CYL, // ≈ 122
  boreIn: BORE_IN,
  strokeIn: STROKE_IN,
  cylinders: N_CYL,
  weightLb: 3100, // a light sport compact

  products: I4_PRODUCTS,
  // The turbo owns the airflow ceiling, the way the carb does on the V8.
  perfCategories: ['turbo', 'camshaft', 'intercooler', 'exhaust_manifold', 'intake_manifold', 'air_cleaner'],
  airflowCategory: 'turbo',

  // Boosted calibration: high reference BMEP, VE able to exceed 1.0 on boost.
  dyno: {
    baseVe: 0.62,
    basePeakRpm: 3200,
    bmepAtVe1: 252,
    veCeiling: 1.55,
    carbK: 1.5,
    carbN: 3.0,
    idleRpm: 850,
  },
};
