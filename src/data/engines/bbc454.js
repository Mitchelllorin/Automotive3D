/**
 * bbc454 — the Chevy 454 Big-Block, the original rat motor.
 *
 * 4.25" bores on a 4.00" stroke → 454 ci of brute torque. The BBC is a taller-deck,
 * heavier, big-ported engine than the SBC family — it has its own cylinder heads
 * (oval and rectangular port), its own intake manifold bolt pattern, and its own
 * carburettor requirements (750–850+ cfm). It shares the V8 OHV architecture and
 * the same 3D assembly (visually identical to the SBC for now; parametric geometry
 * is a Phase-2 effort). Where it really differs is the catalog and the dyno numbers:
 * 454 ci of torque makes everything feel bigger.
 */

const buy = (q) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}`;

const BORE_IN = 4.25;
const STROKE_IN = 4.0;
const N_CYL = 8;

// ── BBC-specific parts catalog ───────────────────────────────────────────────
// Perf-critical categories use big-block specific heads, intake, cam, headers.
// Cosmetic/maintenance categories (valve covers, cooling, ignition, etc.) are
// similar in concept to the SBC and share the same structure.

export const BBC_PRODUCTS = {

  valve_cover: {
    label: 'Valve Covers',
    variants: [
      { id: 'bbc-oem-chrome', brand: 'OEM', name: 'Chrome Steel (Stock)', tint: '#c7ccd2',
        price: 69.99, rating: 4.2, reviews: 310, oem: true,
        blurb: 'Stock triple-chrome stamped steel covers, tall-deck fitment.',
        look: { mat: 'chrome' }, buyUrl: buy('BBC chrome valve covers big block') },
      { id: 'bbc-edel-black', brand: 'Edelbrock', name: 'Signature Black Crinkle', tint: '#23262b',
        price: 139.0, rating: 4.7, reviews: 870,
        blurb: 'Cast-aluminum, black crinkle powder finish, BBC bolt pattern.',
        look: { color: '#1b1d21', metalness: 0.25, roughness: 0.82, finish: 'painted' },
        buyUrl: buy('Edelbrock big block Chevy valve covers black') },
      { id: 'bbc-edel-polished', brand: 'Edelbrock', name: 'Elite II Polished Alloy', tint: '#cfd4db',
        price: 199.0, rating: 4.8, reviews: 560,
        blurb: 'Polished cast-aluminum with finned top — show-quality BBC dress.',
        look: { mat: 'machinedAlu', color: '#d2d7de', roughness: 0.22 },
        buyUrl: buy('Edelbrock polished big block Chevy valve covers') },
      { id: 'bbc-gm-orange', brand: 'GM Performance', name: 'Chevy Orange Steel', tint: '#bf4a1e',
        price: 79.99, rating: 4.3, reviews: 180,
        blurb: 'Factory-orange enamel covers — the full-race rat motor look.',
        look: { color: '#bf4a1e', metalness: 0.0, roughness: 0.4, finish: 'painted' },
        buyUrl: buy('Chevy orange big block valve covers') },
    ],
  },

  air_cleaner: {
    label: 'Air Cleaner',
    variants: [
      { id: 'bbc-oem-round', brand: 'OEM', name: '14" Chrome Round (Stock)', tint: '#c7ccd2',
        price: 39.99, rating: 4.2, reviews: 440, oem: true,
        blurb: 'Classic 14-inch chrome lid on the OEM 4-bbl carb.',
        perf: { ve: 0.01 }, spec: '14" paper element',
        look: { mat: 'chrome' }, buyUrl: buy('14 inch chrome air cleaner BBC') },
      { id: 'bbc-kn-chrome', brand: 'K&N', name: '14" Chrome w/ Washable Filter', tint: '#c2122a',
        price: 89.99, rating: 4.8, reviews: 1650,
        blurb: 'Chrome housing, washable high-flow cotton element — colder, denser charge.',
        perf: { ve: 0.02, peakRpm: 30 }, spec: '14" washable high-flow cotton',
        look: { mat: 'chrome' }, buyUrl: buy('K&N 14 inch air cleaner BBC big block') },
      { id: 'bbc-spectre-black', brand: 'Spectre', name: '14" Black Drop-Base', tint: '#212327',
        price: 59.99, rating: 4.5, reviews: 490,
        blurb: 'Matte-black drop-base — hood clearance for tall BBC intakes.',
        perf: { ve: 0.014 }, spec: '14" drop-base · high-flow element',
        look: { color: '#161820', metalness: 0.35, roughness: 0.78, finish: 'painted' },
        buyUrl: buy('Spectre black big block air cleaner drop base') },
    ],
  },

  oil_filter: {
    label: 'Oil Filter',
    variants: [
      { id: 'bbc-acdelco', brand: 'ACDelco', name: 'PF25 Professional (Stock)', tint: '#2b6cb0',
        price: 9.49, rating: 4.6, reviews: 3100, oem: true,
        blurb: 'Factory blue spin-on, BBC thread pitch.',
        look: { color: '#2b6cb0', metalness: 0.5, roughness: 0.46 },
        buyUrl: buy('ACDelco PF25 big block oil filter') },
      { id: 'bbc-mobil1', brand: 'Mobil 1', name: 'M1-301 Extended Perf.', tint: '#d6dbe1',
        price: 13.97, rating: 4.8, reviews: 4800,
        blurb: 'Silver synthetic-media filter, 20k-mile rating.',
        look: { color: '#d3d8de', metalness: 0.55, roughness: 0.4 },
        buyUrl: buy('Mobil 1 M1-301 big block oil filter') },
      { id: 'bbc-kn-gold', brand: 'K&N', name: 'HP-6001 Gold Chrome', tint: '#c9a23a',
        price: 14.99, rating: 4.8, reviews: 2200,
        blurb: 'Gold-chrome racing can with 1" nut for easy track removal.',
        look: { color: '#caa53b', metalness: 1.0, roughness: 0.15, finish: 'smooth' },
        buyUrl: buy('K&N HP-6001 big block oil filter') },
    ],
  },

  drive_belt: {
    label: 'Drive Belt',
    variants: [
      { id: 'bbc-gates-black', brand: 'Gates', name: 'Hi-Power V-Belt (Stock)', tint: '#1a1c20',
        price: 15.49, rating: 4.6, reviews: 1400, oem: true,
        blurb: 'Standard black V-belt, BBC accessory pattern.',
        look: { color: '#15171a', metalness: 0.15, roughness: 0.88, finish: 'rubber' },
        buyUrl: buy('Gates big block Chevy V-belt') },
      { id: 'bbc-gates-green', brand: 'Gates', name: 'Green Stripe Racing', tint: '#1f7a3d',
        price: 22.99, rating: 4.7, reviews: 390,
        blurb: 'High-temp green-stripe for big-block high-rpm accessory drives.',
        look: { color: '#1f7a3d', metalness: 0.15, roughness: 0.8, finish: 'rubber' },
        buyUrl: buy('Gates green stripe racing belt BBC') },
    ],
  },

  alternator: {
    label: 'Alternator',
    variants: [
      { id: 'bbc-delco', brand: 'ACDelco', name: '10SI 63A Cast (Stock)', tint: '#aeb3bb',
        price: 89.0, rating: 4.5, reviews: 640, oem: true,
        blurb: 'Factory 10SI alternator — same unit as the SBC family.',
        look: { mat: 'castAluminum' }, buyUrl: buy('Delco 10SI alternator big block') },
      { id: 'bbc-powermaster-chrome', brand: 'Powermaster', name: '100A Chrome', tint: '#cfd4da',
        price: 199.0, rating: 4.7, reviews: 380,
        blurb: 'Chrome 100-amp one-wire street/show alternator.',
        look: { mat: 'chrome' }, buyUrl: buy('Powermaster chrome alternator big block') },
    ],
  },

  // ── Performance-critical BBC parts ──────────────────────────────────────────

  intake_manifold: {
    label: 'Intake Manifold',
    variants: [
      { id: 'bbc-oem-cast', brand: 'OEM', name: 'Cast-Iron Dual Plane (Stock)', tint: '#aeb3bb',
        price: 149.0, rating: 4.1, reviews: 160, oem: true,
        blurb: 'Factory cast BBC dual-plane — torquey low-end, brick on top.',
        perf: { ve: 0.06, peakRpm: 200 }, spec: 'cast-iron dual-plane · idle–4500 rpm',
        look: { mat: 'castAluminum' }, buyUrl: buy('BBC big block cast iron dual plane intake') },
      { id: 'bbc-edel-performer', brand: 'Edelbrock', name: 'Performer BBC 2101', tint: '#b9bec6',
        price: 249.0, rating: 4.8, reviews: 1800,
        blurb: 'Aluminum dual-plane BBC — stock power band moved up one step.',
        perf: { ve: 0.08, peakRpm: 300 }, spec: 'aluminum dual-plane · idle–5500 rpm',
        look: { mat: 'castAluminum', color: '#bcc1c9' }, buyUrl: buy('Edelbrock Performer BBC intake 2501') },
      { id: 'bbc-edel-rpm', brand: 'Edelbrock', name: 'Performer RPM BBC', tint: '#d2d7de',
        price: 399.0, rating: 4.9, reviews: 980,
        blurb: 'Rectangular-port RPM intake — moves the power band up where the big-block loves to live.',
        perf: { ve: 0.105, peakRpm: 600 }, spec: 'single-plane rect-port · 2500–7000 rpm',
        look: { mat: 'machinedAlu', color: '#d4d9e0', roughness: 0.24 },
        buyUrl: buy('Edelbrock Performer RPM BBC big block intake') },
      { id: 'bbc-weiand-tg', brand: 'Weiand', name: 'Team G Single-Plane', tint: '#b89a3e',
        price: 449.0, rating: 4.7, reviews: 590,
        blurb: 'Weiand Team G open-plenum single-plane — big cfm, all top-end.',
        perf: { ve: 0.115, peakRpm: 750 }, spec: 'open-plenum single-plane · 3500+ rpm',
        look: { color: '#b6993f', metalness: 0.72, roughness: 0.34, finish: 'machined' },
        buyUrl: buy('Weiand Team G BBC single plane intake') },
    ],
  },

  carburetor: {
    label: 'Carburettor',
    variants: [
      { id: 'bbc-holley-750', brand: 'Holley', name: '4150 750 CFM (Stock)', tint: '#b89a3e',
        price: 449.0, rating: 4.6, reviews: 1600, oem: true,
        blurb: 'Gold-dichromate 750 cfm double pumper — the right size for a 454.',
        perf: { cfm: 750, ve: 0.01 }, spec: '750 cfm · mechanical secondaries',
        look: { color: '#b6993f', metalness: 0.72, roughness: 0.34, finish: 'machined' },
        buyUrl: buy('Holley 750 cfm double pumper 4150') },
      { id: 'bbc-holley-850', brand: 'Holley', name: '4150 850 CFM Double-Pump', tint: '#b89a3e',
        price: 599.0, rating: 4.7, reviews: 1100,
        blurb: '850 cfm gives the big-block room to breathe all the way to redline.',
        perf: { cfm: 850, ve: 0.02, peakRpm: 200 }, spec: '850 cfm · mechanical secondaries',
        look: { color: '#b6993f', metalness: 0.75, roughness: 0.3, finish: 'machined' },
        buyUrl: buy('Holley 850 double pumper carburetor') },
      { id: 'bbc-holley-sniper', brand: 'Holley', name: 'Sniper EFI Black', tint: '#202327',
        price: 1099.0, rating: 4.6, reviews: 1450,
        blurb: 'Self-tuning throttle-body EFI — perfect fuel curve at every throttle angle.',
        perf: { cfm: 950, ve: 0.03, peakRpm: 250 }, spec: '~950 cfm equiv · EFI self-tuning',
        look: { color: '#1b1e22', metalness: 0.55, roughness: 0.5, finish: 'painted' },
        buyUrl: buy('Holley Sniper EFI big block') },
    ],
  },

  camshaft: {
    label: 'Camshaft',
    variants: [
      { id: 'bbc-oem-hyd', brand: 'GM', name: 'Stock Hydraulic (Stock)', tint: '#9aa0a8',
        price: 139.0, rating: 4.3, reviews: 320, oem: true,
        blurb: 'Factory hydraulic flat-tappet — smooth, loads of torque down low.',
        spec: '~268° adv · 0.461" lift · 112° LSA',
        perf: { ve: 0.07, peakRpm: 350, redline: 5400, lowWidth: 1900, highWidth: 2850, lopiness: 0.05 },
        buyUrl: buy('BBC big block Chevy stock hydraulic camshaft') },
      { id: 'bbc-comp-rv', brand: 'COMP Cams', name: 'High Energy 268H (Towing)', tint: '#1f7a3d',
        price: 149.0, rating: 4.7, reviews: 740,
        blurb: 'RV/tow grind — fattens the torque curve right where big-blocks excel.',
        spec: '268° adv · 0.465" lift · 114° LSA',
        perf: { ve: 0.065, peakRpm: 150, redline: 5100, lowWidth: 2000, highWidth: 2400, lopiness: 0.1 },
        buyUrl: buy('COMP Cams BBC high energy RV cam') },
      { id: 'bbc-comp-xe274', brand: 'COMP Cams', name: 'Xtreme Energy XE274H', tint: '#c2122a',
        price: 179.0, rating: 4.8, reviews: 1450,
        blurb: 'Street/strip BBC cam — big idle sound, strong mid-range pull.',
        spec: '274° adv · 0.488" lift · 110° LSA',
        perf: { ve: 0.105, peakRpm: 950, redline: 6200, lowWidth: 1600, highWidth: 2800, lopiness: 0.48 },
        buyUrl: buy('COMP Cams XE274H big block Xtreme Energy cam') },
      { id: 'bbc-comp-xr300', brand: 'COMP Cams', name: 'XR300 Hydraulic Roller', tint: '#b89a3e',
        price: 399.0, rating: 4.9, reviews: 610,
        blurb: 'Hydraulic roller — same aggressive lobe but less valvetrain wear.',
        spec: '300° adv · 0.541" lift · 108° LSA',
        perf: { ve: 0.12, peakRpm: 1300, redline: 6600, lowWidth: 1450, highWidth: 3100, lopiness: 0.88 },
        buyUrl: buy('COMP Cams XR300 BBC hydraulic roller camshaft') },
    ],
  },

  cylinder_head: {
    label: 'Cylinder Heads',
    variants: [
      { id: 'bbc-oem-oval', brand: 'OEM', name: 'Oval-Port Iron 118cc (Stock)', tint: '#9aa0a8',
        price: 249.0, rating: 4.0, reviews: 190, oem: true,
        blurb: 'Factory oval-port iron — heavy but reliable, correct for stock builds.',
        spec: 'oval-port iron · ~260 cfm @ 0.500" · 118cc',
        perf: { ve: 0.14, peakRpm: 400, cr: 8.7 },
        buyUrl: buy('BBC 454 oval port cylinder heads') },
      { id: 'bbc-rect-iron', brand: 'GM Performance', name: 'Rect-Port Iron 108cc', tint: '#bf6a2e',
        price: 699.0, rating: 4.6, reviews: 830,
        blurb: 'Factory rectangular-port heads — bigger ports, more top-end flow.',
        spec: 'rect-port iron · ~310 cfm @ 0.500" · 108cc',
        perf: { ve: 0.20, peakRpm: 700, cr: 9.4 },
        buyUrl: buy('BBC rectangular port cylinder heads iron') },
      { id: 'bbc-dart-pro1', brand: 'Dart', name: 'Pro 1 Aluminum 320cc', tint: '#cfd4db',
        price: 1799.0, rating: 4.9, reviews: 420,
        blurb: 'CNC-ported aluminum big-block heads — the real horsepower move on a 454.',
        spec: 'aluminum · ~330 cfm @ 0.600" · 108cc',
        perf: { ve: 0.245, peakRpm: 900, cr: 10.3 },
        buyUrl: buy('Dart Pro 1 big block Chevy aluminum heads') },
    ],
  },

  spark_plugs: {
    label: 'Spark Plugs & Wires',
    variants: [
      { id: 'bbc-acdelco-r44', brand: 'ACDelco', name: 'R44TS Copper (Stock)', tint: '#c9ccd1',
        price: 3.49, rating: 4.5, reviews: 3100, oem: true,
        blurb: 'Factory copper plug, BBC heat range.',
        buyUrl: buy('ACDelco R44TS big block spark plug') },
      { id: 'bbc-ngk-iridium', brand: 'NGK', name: 'Iridium IX', tint: '#c2122a',
        price: 9.49, rating: 4.9, reviews: 5800,
        blurb: 'Fine-wire iridium — sharper spark, longer service life.',
        buyUrl: buy('NGK iridium spark plug big block Chevy') },
    ],
  },

  distributor: {
    label: 'Distributor',
    variants: [
      { id: 'bbc-oem-points', brand: 'OEM', name: 'Points Distributor (Stock)', tint: '#23262b',
        price: 89.0, rating: 4.0, reviews: 140, oem: true,
        blurb: 'Factory breaker-point distributor with vacuum advance.',
        buyUrl: buy('BBC big block points distributor') },
      { id: 'bbc-msd-pro', brand: 'MSD', name: 'Pro-Billet Ready-to-Run', tint: '#c2122a',
        price: 349.0, rating: 4.8, reviews: 1500,
        blurb: 'Billet housing, built-in module — no external ignition box needed.',
        buyUrl: buy('MSD Pro-Billet big block distributor') },
    ],
  },

  exhaust_manifold: {
    label: 'Headers',
    variants: [
      { id: 'bbc-oem-castiron', brand: 'OEM', name: 'Cast-Iron Manifolds (Stock)', tint: '#56595e',
        price: 179.0, rating: 4.0, reviews: 180, oem: true,
        blurb: 'Factory cast-iron log manifolds — restrictive but durable.',
        perf: { ve: 0.02, peakRpm: 50 }, spec: 'restrictive cast-iron log manifolds',
        look: { mat: 'castIron' }, buyUrl: buy('BBC big block cast iron exhaust manifolds') },
      { id: 'bbc-hooker-ceramic', brand: 'Hooker', name: 'Super Comp Ceramic 2"', tint: '#cfcfc8',
        price: 499.0, rating: 4.7, reviews: 420,
        blurb: 'Ceramic 2" primaries — scavenges the top end on a big-block.',
        perf: { ve: 0.065, peakRpm: 300 }, spec: '2" long-tube · ceramic coated',
        look: { color: '#d3d3cb', metalness: 0.35, roughness: 0.5, finish: 'matte' },
        buyUrl: buy('Hooker Super Comp BBC headers ceramic') },
      { id: 'bbc-hedman-black', brand: 'Hedman', name: 'Hedders Black Maxx BBC', tint: '#1c1e22',
        price: 279.0, rating: 4.5, reviews: 310,
        blurb: 'High-temp black headers, 1-7/8" primary tubes.',
        perf: { ve: 0.06, peakRpm: 250 }, spec: '1-7/8" long-tube · high-temp coated',
        look: { color: '#1a1c20', metalness: 0.4, roughness: 0.6, finish: 'painted' },
        buyUrl: buy('Hedman big block Chevy headers black') },
    ],
  },

  water_pump: {
    label: 'Water Pump',
    variants: [
      { id: 'bbc-oem-cast', brand: 'ACDelco', name: 'Cast Long-Style (Stock)', tint: '#aeb3bb',
        price: 59.0, rating: 4.4, reviews: 760, oem: true,
        blurb: 'Factory cast-iron long-style BBC water pump.', cool: 0.3,
        look: { mat: 'castAluminum' }, buyUrl: buy('BBC big block long water pump') },
      { id: 'bbc-edel-victor', brand: 'Edelbrock', name: 'Victor Series Aluminum', tint: '#b9bec6',
        price: 159.0, rating: 4.7, reviews: 410,
        blurb: 'High-flow polished aluminum pump — cools the big-block on the strip.', cool: 0.46,
        look: { mat: 'machinedAlu' }, buyUrl: buy('Edelbrock Victor water pump BBC') },
    ],
  },

  cooling_fan: {
    label: 'Cooling Fan',
    variants: [
      { id: 'bbc-oem-steel', brand: 'OEM', name: '7-Blade Steel (Stock)', tint: '#3a3f47',
        price: 44.0, rating: 4.3, reviews: 320, oem: true,
        blurb: 'Factory 7-blade fixed steel fan — extra blade for the thirsty 454.', cool: 0.2,
        look: { color: '#26292f', metalness: 0.4, roughness: 0.6 },
        buyUrl: buy('BBC big block cooling fan 7 blade') },
      { id: 'bbc-flexalite', brand: 'Flex-a-lite', name: 'Belt-Driven Flex Fan', tint: '#c2c7ce',
        price: 99.0, rating: 4.5, reviews: 210,
        blurb: 'Stainless flex blades flatten at rpm — frees power up top.', cool: 0.25,
        look: { mat: 'steel' }, buyUrl: buy('Flex-a-lite flex fan big block') },
    ],
  },

  fuel_pump: {
    label: 'Fuel Pump',
    variants: [
      { id: 'bbc-holley-mech', brand: 'Holley', name: '130 GPH Mechanical (Stock)', tint: '#b89a3e',
        price: 89.0, rating: 4.6, reviews: 510, oem: true,
        blurb: 'High-volume mechanical pump to keep the big-carb fed.',
        buyUrl: buy('Holley 130 GPH mechanical fuel pump big block') },
      { id: 'bbc-edel-mech', brand: 'Edelbrock', name: 'Performer 140 GPH', tint: '#b4b9c1',
        price: 109.0, rating: 4.6, reviews: 240,
        blurb: '140-GPH mechanical pump for 850+ cfm carbs and big-ci builds.',
        buyUrl: buy('Edelbrock Performer fuel pump BBC 140 GPH') },
    ],
  },

  thermostat: {
    label: 'Thermostat & Outlet',
    variants: [
      { id: 'bbc-stant-180', brand: 'Stant', name: 'SuperStat 180°F (Stock)', tint: '#aeb3bb',
        price: 9.49, rating: 4.7, reviews: 2800, oem: true,
        blurb: 'High-flow 180-degree thermostat, BBC housing.',
        buyUrl: buy('Stant big block 180 thermostat') },
      { id: 'bbc-mrgasket-160', brand: 'Mr. Gasket', name: '160°F High-Flow', tint: '#c2122a',
        price: 12.99, rating: 4.5, reviews: 610,
        blurb: 'Cooler 160-degree stat for high-output 454 builds.',
        buyUrl: buy('Mr Gasket 160 thermostat big block') },
    ],
  },
};

const BORE_IN_CONST = BORE_IN;
const STROKE_IN_CONST = STROKE_IN;

export const bbc454 = {
  id: 'bbc454',
  name: 'Chevrolet 454 Big-Block',
  shortName: 'BBC 454',
  badge: 'V8 · Big-Block · OHV',
  arch: 'ohv',
  assemblyId: 'engine', // V8 OHV layout — shares the 3D assembly with the SBC family
  available: true,

  displacementCI: (Math.PI / 4) * BORE_IN_CONST * BORE_IN_CONST * STROKE_IN_CONST * N_CYL, // ≈ 454
  boreIn: BORE_IN_CONST,
  strokeIn: STROKE_IN_CONST,
  cylinders: N_CYL,
  weightLb: 3850,

  products: BBC_PRODUCTS,
  perfCategories: ['cylinder_head', 'intake_manifold', 'camshaft', 'carburetor', 'exhaust_manifold', 'air_cleaner'],
  airflowCategory: 'carburetor',

  // Tall-deck big-block calibration: bigger BMEP (more thermal mass, more torque per ci),
  // slightly lower redline than the SBC — the 454 is a torque engine, not a revver.
  dyno: {
    baseVe: 0.55,
    basePeakRpm: 1900,     // peak torque comes earlier — that's the rat motor flavour
    bmepAtVe1: 192,        // higher BMEP than the SBC: more thermal mass, better breathing
    veCeiling: 1.06,
    carbK: 1.15,           // BBC drinks harder for the same displacement-to-cfm ratio
    carbN: 3.0,
    idleRpm: 750,
  },
};
