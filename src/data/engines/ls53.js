/**
 * ls53 — GM LS 5.3 LM7, the ubiquitous truck V8.
 *
 * The LS 5.3 is a Gen-III LS architecture engine: aluminum block, deep-skirt
 * crankcase, cathedral-port heads, and electronic fuel injection through a 78mm
 * throttle body. It is the most popular LS swap engine because the LM7 iron-block
 * variant came in millions of trucks — it is cheap, light, and strong. Stock power
 * is modest (~295 hp) but the architecture responds enormously to heads and cam
 * work: a cam-and-heads build easily reaches 450+ hp, and the block takes it.
 *
 * Key differences from the SBC family:
 *  • EFI throttle body (not a carburettor) — that is the airflow category here.
 *  • Cathedral-port heads (LS6 243 casting is the stock-upgrade move).
 *  • Sequential fuel injection, so tuning lives in the ECU rather than a jet kit.
 *  • LS-specific cam specs (longer duration than classic SBC grinds for the same
 *    power band, because the factory heads flow better).
 *  • Dry sump-compatible block — good candidate for big power.
 *
 * The 3D assembly is the V8 OHV model (same visual as the SBC — parametric
 * geometry is a Phase-2 effort). The catalog and dyno calibration are fully
 * LS-specific.
 */

const buy = (q) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}`;

const BORE_IN = 3.78;   // 96 mm
const STROKE_IN = 3.62; // 92 mm — factory 5.3 LM7
const N_CYL = 8;

export const LS_PRODUCTS = {

  valve_cover: {
    label: 'Valve Covers',
    variants: [
      { id: 'ls-oem-black', brand: 'OEM', name: 'OEM Black Plastic (Stock)', tint: '#23262b',
        price: 79.0, rating: 4.3, reviews: 710, oem: true,
        blurb: 'Factory black plastic coil-on-plug valve covers.',
        look: { color: '#1b1d21', metalness: 0.1, roughness: 0.9, finish: 'painted' },
        buyUrl: buy('LS 5.3 valve covers OEM') },
      { id: 'ls-proform-chrome', brand: 'ProForm', name: 'Chrome Steel Conversion', tint: '#cfd4da',
        price: 129.0, rating: 4.6, reviews: 420,
        blurb: 'Chrome-steel covers with tall clearance for roller rockers.',
        look: { mat: 'chrome' }, buyUrl: buy('ProForm chrome LS valve covers') },
      { id: 'ls-edel-black', brand: 'Edelbrock', name: 'Pro-Flo Anodized Black', tint: '#212429',
        price: 179.0, rating: 4.8, reviews: 590,
        blurb: 'Billet-look anodized covers with round coil ports — track-day style.',
        look: { color: '#1c1f24', metalness: 0.55, roughness: 0.45, finish: 'painted' },
        buyUrl: buy('Edelbrock Pro-Flo LS valve covers black') },
    ],
  },

  air_cleaner: {
    label: 'Cold-Air Intake',
    variants: [
      { id: 'ls-oem-airbox', brand: 'OEM', name: 'Factory Airbox (Stock)', tint: '#23262b',
        price: 0, rating: 4.3, reviews: 530, oem: true,
        blurb: 'Stock plastic airbox and paper filter — quiet but not maximum flow.',
        perf: {}, look: { color: '#1b1d21', metalness: 0.1, roughness: 0.9 },
        buyUrl: buy('LS 5.3 factory airbox air filter') },
      { id: 'ls-kn-cai', brand: 'K&N', name: '57 Series Cold-Air Intake', tint: '#c2122a',
        price: 399.0, rating: 4.8, reviews: 2900,
        blurb: 'Open-cone cold-air — colder, denser charge into the throttle body.',
        perf: { ve: 0.02 },
        look: { color: '#b01020', metalness: 0.6, roughness: 0.35 },
        buyUrl: buy('K&N 57 Series cold air intake LS swap') },
      { id: 'ls-airaid-mit', brand: 'AIRAID', name: 'MXP Cold Air System', tint: '#c9a23a',
        price: 449.0, rating: 4.7, reviews: 1800,
        blurb: 'Dry-filter MXP system — tuned for maximum mass-airflow at WOT.',
        perf: { ve: 0.025 },
        look: { color: '#c9a03a', metalness: 0.5, roughness: 0.4 },
        buyUrl: buy('AIRAID MXP LS cold air intake') },
    ],
  },

  oil_filter: {
    label: 'Oil Filter',
    variants: [
      { id: 'ls-acdelco', brand: 'ACDelco', name: 'PF48E Professional (Stock)', tint: '#2b6cb0',
        price: 8.99, rating: 4.7, reviews: 7200, oem: true,
        blurb: 'Factory LS blue spin-on, correct thread pitch.',
        look: { color: '#2b6cb0', metalness: 0.5, roughness: 0.46 },
        buyUrl: buy('ACDelco PF48E LS oil filter') },
      { id: 'ls-mobil1', brand: 'Mobil 1', name: 'M1-113 Extended Perf.', tint: '#d6dbe1',
        price: 14.97, rating: 4.9, reviews: 9100,
        blurb: 'Synthetic-media filter, 20k-mile rating for synthetic oil.',
        look: { color: '#d3d8de', metalness: 0.55, roughness: 0.4 },
        buyUrl: buy('Mobil 1 M1-113 LS oil filter') },
      { id: 'ls-kn-gold', brand: 'K&N', name: 'HP-2002 Gold Chrome', tint: '#c9a23a',
        price: 12.99, rating: 4.8, reviews: 4100,
        blurb: 'Gold-chrome racing can — 1" weld nut for easy track removal.',
        look: { color: '#caa53b', metalness: 1.0, roughness: 0.15, finish: 'smooth' },
        buyUrl: buy('K&N HP-2002 LS oil filter') },
    ],
  },

  // ── Performance-critical LS parts ─────────────────────────────────────────

  throttle_body: {
    label: 'Throttle Body',
    variants: [
      { id: 'ls-stock-tb', brand: 'GM', name: '78mm DBW (Stock)', tint: '#b0b5be',
        price: 0, rating: 4.3, reviews: 920, oem: true,
        blurb: 'Factory drive-by-wire 78mm throttle body — borderline on big builds.',
        perf: { cfm: 800, ve: 0.01 }, spec: '78mm · drive-by-wire',
        look: { mat: 'castAluminum' }, buyUrl: buy('GM LS 5.3 throttle body 78mm') },
      { id: 'ls-fast-90', brand: 'FAST', name: 'LSXR 90mm Billet', tint: '#cfd4db',
        price: 429.0, rating: 4.8, reviews: 1650,
        blurb: 'Billet 90mm LSXR — removes the TB restriction on cammed builds.',
        perf: { cfm: 1050, ve: 0.02, peakRpm: 200 }, spec: '90mm · billet bore · drive-by-wire',
        look: { mat: 'machinedAlu', color: '#d2d7de', roughness: 0.18 },
        buyUrl: buy('FAST LSXR 90mm throttle body') },
      { id: 'ls-nw-102', brand: 'Nick Williams', name: '102mm Billet Drive-By-Wire', tint: '#3c8abf',
        price: 649.0, rating: 4.9, reviews: 820,
        blurb: '102mm CNC-billet unit — flows for big-cam 450+ hp LS builds.',
        perf: { cfm: 1250, ve: 0.03, peakRpm: 350 }, spec: '102mm · CNC billet · DBW',
        look: { color: '#3080b0', metalness: 0.85, roughness: 0.2, finish: 'machined' },
        buyUrl: buy('Nick Williams 102mm billet throttle body LS') },
    ],
  },

  intake_manifold: {
    label: 'Intake Manifold',
    variants: [
      { id: 'ls-oem-intake', brand: 'OEM', name: 'Stock Cathedral-Port Plastic', tint: '#b0b5be',
        price: 129.0, rating: 4.2, reviews: 450, oem: true,
        blurb: 'Factory plastic cathedral-port manifold — limiting on bigger cams.',
        perf: { ve: 0.06, peakRpm: 200 }, spec: 'plastic cathedral · stock runners',
        look: { mat: 'castAluminum', color: '#b0b5be' }, buyUrl: buy('LS 5.3 intake manifold stock') },
      { id: 'ls-fast-lsxr', brand: 'FAST', name: 'LSXR 102mm Manifold', tint: '#d2d7de',
        price: 799.0, rating: 4.8, reviews: 1350,
        blurb: 'FAST LSXR — redesigned runners match the 90/102mm TB perfectly.',
        perf: { ve: 0.095, peakRpm: 550 }, spec: '102mm · cathedral-to-rectangle transition',
        look: { mat: 'castAluminum', color: '#bcc1c9' }, buyUrl: buy('FAST LSXR 102mm intake manifold') },
      { id: 'ls-edel-super', brand: 'Edelbrock', name: 'Super Victor LS Single-Plane', tint: '#b89a3e',
        price: 649.0, rating: 4.7, reviews: 790,
        blurb: 'Single-plane race intake — moves the power band up for cammed builds.',
        perf: { ve: 0.11, peakRpm: 700 }, spec: 'single-plane · 3000–7500 rpm',
        look: { color: '#b6993f', metalness: 0.72, roughness: 0.34, finish: 'machined' },
        buyUrl: buy('Edelbrock Super Victor LS single plane intake') },
    ],
  },

  camshaft: {
    label: 'Camshaft',
    variants: [
      { id: 'ls-oem-cam', brand: 'GM', name: 'Stock Hydraulic Roller (Stock)', tint: '#9aa0a8',
        price: 159.0, rating: 4.4, reviews: 560, oem: true,
        blurb: 'Factory hydraulic roller — quiet, emissions-legal, modest grind.',
        spec: '200°/207° @ 0.050" · 0.467"/0.479" lift · 116° LSA',
        perf: { ve: 0.07, peakRpm: 400, redline: 5600, lowWidth: 1800, highWidth: 2900, lopiness: 0.05 },
        buyUrl: buy('LS 5.3 stock camshaft hydraulic roller') },
      { id: 'ls-comp-224', brand: 'COMP Cams', name: 'Thumpr 227/241 HR Cam', tint: '#c2122a',
        price: 299.0, rating: 4.8, reviews: 2400,
        blurb: 'COMP Thumpr — notorious idle lope, fat mid-range, streetable.',
        spec: '227°/241° @ 0.050" · 0.510"/0.510" lift · 107° LSA',
        perf: { ve: 0.10, peakRpm: 800, redline: 6200, lowWidth: 1650, highWidth: 2850, lopiness: 0.60 },
        buyUrl: buy('COMP Cams Thumpr LS camshaft 227 241') },
      { id: 'ls-comp-stage2', brand: 'COMP Cams', name: 'Stage 2 HRT 236/242', tint: '#b89a3e',
        price: 399.0, rating: 4.9, reviews: 1800,
        blurb: 'HRT stage 2 — big lift for the LS heads, strong top-end pull.',
        spec: '236°/242° @ 0.050" · 0.603"/0.601" lift · 114° LSA',
        perf: { ve: 0.115, peakRpm: 1100, redline: 6800, lowWidth: 1500, highWidth: 3000, lopiness: 0.80 },
        buyUrl: buy('COMP Cams HRT 236 242 LS camshaft stage 2') },
      { id: 'ls-texas-speed', brand: 'Texas Speed', name: 'TSP Stage 3 Truck Cam', tint: '#1f7a3d',
        price: 349.0, rating: 4.9, reviews: 2900,
        blurb: 'The LSx street favourite — massive torque, easy to tune, pulls hard.',
        spec: '228°/228° @ 0.050" · 0.560"/0.560" lift · 112° LSA',
        perf: { ve: 0.105, peakRpm: 900, redline: 6500, lowWidth: 1600, highWidth: 2900, lopiness: 0.50 },
        buyUrl: buy('Texas Speed TSP stage 3 LS cam 228') },
    ],
  },

  cylinder_head: {
    label: 'Cylinder Heads',
    variants: [
      { id: 'ls-706-casting', brand: 'GM', name: '706/862 Cathedral Iron (Stock)', tint: '#9aa0a8',
        price: 229.0, rating: 4.2, reviews: 340, oem: true,
        blurb: 'Factory iron cathedral-port — decent stock flow, the swap-engine standard.',
        spec: 'iron cathedral · ~210 cfm @ 0.500" · 64cc',
        perf: { ve: 0.13, peakRpm: 400, cr: 9.5 },
        buyUrl: buy('LS 706 862 cylinder heads iron 5.3') },
      { id: 'ls-243-casting', brand: 'GM Performance', name: 'LS6/243 Aluminum 64cc', tint: '#cfd4db',
        price: 749.0, rating: 4.8, reviews: 1600,
        blurb: 'LS6 243-casting aluminum — the most popular bolt-on head upgrade.',
        spec: 'aluminum cathedral · ~250 cfm @ 0.500" · 64cc',
        perf: { ve: 0.185, peakRpm: 650, cr: 10.0 },
        buyUrl: buy('GM LS6 243 aluminum cylinder heads') },
      { id: 'ls-trick-flow-225', brand: 'Trick Flow', name: 'GenX 225 Aluminum', tint: '#cfd4db',
        price: 1449.0, rating: 4.9, reviews: 890,
        blurb: 'CNC-ported 225cc runners — the serious street/strip LS upgrade.',
        spec: 'aluminum rectangular · ~280 cfm @ 0.600" · 63cc',
        perf: { ve: 0.225, peakRpm: 850, cr: 10.5 },
        buyUrl: buy('Trick Flow GenX 225 LS cylinder heads') },
      { id: 'ls-afr-210', brand: 'AFR', name: 'LSXpress 210 Aluminum', tint: '#cfd4db',
        price: 1899.0, rating: 4.9, reviews: 520,
        blurb: 'AFR fully CNC-ported — maximum flow, race-ready on the street.',
        spec: 'aluminum rectangular · ~310 cfm @ 0.600" · 64cc',
        perf: { ve: 0.25, peakRpm: 950, cr: 10.9 },
        buyUrl: buy('AFR LSXpress 210 LS cylinder heads') },
    ],
  },

  spark_plugs: {
    label: 'Spark Plugs',
    variants: [
      { id: 'ls-acdelco-41101', brand: 'ACDelco', name: '41-101 Iridium (Stock)', tint: '#c9ccd1',
        price: 8.99, rating: 4.8, reviews: 8400, oem: true,
        blurb: 'Factory iridium plug — the LS ships with iridium stock.',
        buyUrl: buy('ACDelco 41-101 iridium LS spark plug') },
      { id: 'ls-ngk-tr6', brand: 'NGK', name: 'TR6 Iridium IX (Colder)', tint: '#c2122a',
        price: 9.49, rating: 4.9, reviews: 12000,
        blurb: 'NGK TR6 one range colder — the go-to plug for cammed LS builds.',
        buyUrl: buy('NGK TR6 iridium spark plug LS') },
    ],
  },

  exhaust_manifold: {
    label: 'Headers',
    variants: [
      { id: 'ls-oem-manifolds', brand: 'OEM', name: 'Cast-Iron Log Manifolds (Stock)', tint: '#56595e',
        price: 159.0, rating: 4.0, reviews: 240, oem: true,
        blurb: 'Factory cast manifolds — leave power on the table but quiet.',
        perf: { ve: 0.02, peakRpm: 50 }, spec: 'restrictive cast-iron log manifolds',
        look: { mat: 'castIron' }, buyUrl: buy('LS swap cast iron exhaust manifolds') },
      { id: 'ls-hooker-blackheart', brand: 'Hooker', name: 'Blackheart 1-7/8" Swap Headers', tint: '#1c1e22',
        price: 599.0, rating: 4.8, reviews: 1650,
        blurb: 'LS-swap long-tube 1-7/8" headers — the biggest bolt-on power move.',
        perf: { ve: 0.07, peakRpm: 350 }, spec: '1-7/8" long-tube · LS swap fitment',
        look: { color: '#1a1c20', metalness: 0.45, roughness: 0.55, finish: 'painted' },
        buyUrl: buy('Hooker Blackheart LS swap headers 1-7/8') },
      { id: 'ls-arh-longtube', brand: 'American Racing Headers', name: 'ARH 1-7/8" Stepped', tint: '#cfcfc8',
        price: 899.0, rating: 4.9, reviews: 730,
        blurb: 'Stepped-diameter primaries — the tuner standard for 450+ hp LS builds.',
        perf: { ve: 0.08, peakRpm: 400 }, spec: '1-7/8" to 2" stepped · full-length',
        look: { color: '#d3d3cb', metalness: 0.35, roughness: 0.5, finish: 'matte' },
        buyUrl: buy('American Racing Headers ARH LS swap 1-7/8 stepped') },
    ],
  },

  water_pump: {
    label: 'Water Pump',
    variants: [
      { id: 'ls-oem-pump', brand: 'ACDelco', name: 'OEM Plastic Impeller (Stock)', tint: '#aeb3bb',
        price: 49.0, rating: 4.4, reviews: 1200, oem: true,
        blurb: 'Factory plastic-impeller pump — adequate for stock builds.', cool: 0.3,
        look: { mat: 'castAluminum' }, buyUrl: buy('LS 5.3 water pump OEM') },
      { id: 'ls-edel-victor', brand: 'Edelbrock', name: 'Victor Pro-Flo Aluminum', tint: '#b9bec6',
        price: 159.0, rating: 4.7, reviews: 620,
        blurb: 'Aluminum high-flow pump with steel impeller for cammed builds.', cool: 0.46,
        look: { mat: 'machinedAlu' }, buyUrl: buy('Edelbrock Victor LS water pump') },
    ],
  },

  cooling_fan: {
    label: 'Cooling Fan',
    variants: [
      { id: 'ls-oem-electric', brand: 'OEM', name: 'Electric Fan (Stock)', tint: '#3a3f47',
        price: 0, rating: 4.4, reviews: 980, oem: true,
        blurb: 'Factory single electric pusher fan — no parasitic draw.', cool: 0.2,
        look: { color: '#26292f', metalness: 0.4, roughness: 0.6 },
        buyUrl: buy('LS swap electric cooling fan') },
      { id: 'ls-derale-dual', brand: 'Derale', name: 'Dual 12" PWM Electric', tint: '#1c1e22',
        price: 379.0, rating: 4.8, reviews: 790,
        blurb: 'Dual PWM fans — way more airflow for big-power swap builds.', cool: 0.35,
        look: { color: '#14161a', metalness: 0.35, roughness: 0.7, finish: 'painted' },
        buyUrl: buy('Derale dual 12 inch PWM electric fans') },
    ],
  },

  thermostat: {
    label: 'Thermostat',
    variants: [
      { id: 'ls-stant-195', brand: 'Stant', name: 'OEM 195°F (Stock)', tint: '#aeb3bb',
        price: 9.99, rating: 4.7, reviews: 4100, oem: true,
        blurb: 'Factory 195-degree thermostat for the LS coolant routing.',
        buyUrl: buy('LS 5.3 thermostat 195 degree') },
      { id: 'ls-stant-180', brand: 'Stant', name: '180°F Performance', tint: '#c2122a',
        price: 12.99, rating: 4.5, reviews: 2200,
        blurb: 'Cooler 180-degree stat — slightly denser charge on a hot day.',
        buyUrl: buy('LS 180 thermostat performance') },
    ],
  },
};

export const ls53 = {
  id: 'ls53',
  name: 'GM LS 5.3 (LM7)',
  shortName: 'LS 5.3',
  badge: 'V8 · OHV · EFI',
  arch: 'ohv',
  assemblyId: 'engine', // V8 OHV layout — same 3D assembly as the SBC family
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN * BORE_IN * STROKE_IN * N_CYL, // ≈ 325
  boreIn: BORE_IN,
  strokeIn: STROKE_IN,
  cylinders: N_CYL,
  weightLb: 3200, // lighter car assumed; LS swaps land in lighter platforms

  products: LS_PRODUCTS,
  // Throttle body owns the airflow ceiling (EFI equivalent of the carb role).
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'throttle_body', 'exhaust_manifold', 'air_cleaner'],
  airflowCategory: 'throttle_body',

  // LS calibration: higher base VE (cathedral-port EFI breathes better from the
  // factory), higher redline potential, EFI's tighter fuel curve raises the BMEP
  // reference vs an equivalently-displaced carb engine.
  dyno: {
    baseVe: 0.62,          // EFI starts from a higher baseline
    basePeakRpm: 2400,     // LS torque peak slightly higher than an old pushrod carb motor
    bmepAtVe1: 188,        // strong EFI BMEP
    veCeiling: 1.06,
    carbK: 1.30,           // LS TB is large relative to displacement — not the bottleneck
    carbN: 2.8,
    idleRpm: 600,          // LS idle sits lower and smoother than an SBC
  },
};
