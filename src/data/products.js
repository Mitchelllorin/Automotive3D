/**
 * Garage catalog — the product-placement + part-swap system.
 *
 * Each entry maps a COMPONENTS key to a list of real-world purchasable variants.
 * A variant carries BOTH:
 *   • `look` — a material override applied live in the 3D scene to any <Surface>
 *     tagged `swap` inside that part (see Part.jsx / EngineAssembly.jsx). The look
 *     is authoritative: fields it omits fall back to the named `mat` preset then
 *     defaults, so each variant fully defines the part's finish.
 *   • product placement — brand, name, sku, price, rating, buyUrl, image.
 *
 * The first variant in each list is the OEM/stock baseline and reproduces the
 * part's hand-tuned default appearance, so selecting it is a true "revert".
 *
 * `image` is a real product-photo URL when supplied; when empty the storefront
 * card falls back to a brand-tinted thumbnail (productThumb.js). Drop real URLs
 * in here (or local /public paths) and they take over automatically.
 */

/** Build a RockAuto search URL so every Buy link resolves to a real listing. */
const buy = (q) => `https://www.rockauto.com/en/catalog/?partfilter=${encodeURIComponent(q)}`;

export const PRODUCTS = {
  valve_cover: {
    label: 'Valve Covers',
    variants: [
      { id: 'oem-chrome', brand: 'OEM', name: 'Chrome Steel (Stock)', tint: '#c7ccd2',
        sku: 'GM-12341191', price: 59.99, rating: 4.3, reviews: 412, oem: true,
        blurb: 'Stock triple-chrome stamped steel covers.', look: { mat: 'chrome' },
        buyUrl: buy('SBC chrome valve covers') },
      { id: 'edel-black', brand: 'Edelbrock', name: 'Signature Black Crinkle', tint: '#23262b',
        sku: 'EDL-4159', price: 129.0, rating: 4.7, reviews: 1380,
        blurb: 'Cast-aluminum, black crinkle powder finish, raised logo.',
        look: { color: '#1b1d21', metalness: 0.25, roughness: 0.82, finish: 'painted' },
        buyUrl: buy('Edelbrock 4159 valve covers') },
      { id: 'edel-polished', brand: 'Edelbrock', name: 'Elite II Polished Alloy', tint: '#cfd4db',
        sku: 'EDL-4259', price: 179.0, rating: 4.8, reviews: 940,
        blurb: 'Polished cast-aluminum with finned top — show-quality.',
        look: { mat: 'machinedAlu', color: '#d2d7de', roughness: 0.22 },
        buyUrl: buy('Edelbrock 4259 polished valve covers') },
      { id: 'gm-orange', brand: 'GM Performance', name: 'Chevy Orange Steel', tint: '#bf4a1e',
        sku: 'GMP-141-779', price: 74.99, rating: 4.4, reviews: 256,
        blurb: 'Factory-orange enamel stamped-steel covers.',
        look: { color: '#bf4a1e', metalness: 0.0, roughness: 0.4, finish: 'painted' },
        buyUrl: buy('Chevy orange valve covers') },
    ],
  },

  air_cleaner: {
    label: 'Air Cleaner',
    variants: [
      { id: 'oem-round', brand: 'OEM', name: '14" Chrome Round (Stock)', tint: '#c7ccd2',
        sku: 'GM-6421913', price: 39.99, rating: 4.2, reviews: 521, oem: true,
        blurb: 'Classic 14-inch chrome lid and base with paper element.',
        perf: { ve: 0.01 },
        spec: '14" paper element',
        look: { mat: 'chrome' }, buyUrl: buy('14 inch chrome air cleaner') },
      { id: 'kn-chrome', brand: 'K&N', name: '14" Chrome w/ Washable Filter', tint: '#c2122a',
        sku: 'KN-60-1080', price: 89.99, rating: 4.8, reviews: 2240,
        blurb: 'Chrome housing over a washable high-flow cotton element.',
        perf: { ve: 0.02, peakRpm: 30 },
        spec: '14" washable high-flow cotton',
        look: { mat: 'chrome' }, buyUrl: buy('K&N 14 inch air cleaner') },
      { id: 'spectre-black', brand: 'Spectre', name: '14" Black Powder Coat', tint: '#212327',
        sku: 'SPE-47624', price: 54.99, rating: 4.5, reviews: 610,
        blurb: 'Matte-black steel air cleaner, drop-base for hood clearance.',
        perf: { ve: 0.014 },
        spec: '14" drop-base · high-flow element',
        look: { color: '#161820', metalness: 0.35, roughness: 0.78, finish: 'painted' },
        buyUrl: buy('Spectre black 14 inch air cleaner') },
    ],
  },

  oil_filter: {
    label: 'Oil Filter',
    variants: [
      { id: 'acdelco', brand: 'ACDelco', name: 'PF2 Professional (Stock)', tint: '#2b6cb0',
        sku: 'ACD-PF2', price: 8.49, rating: 4.6, reviews: 5300, oem: true,
        blurb: 'Factory blue spin-on with built-in bypass valve.',
        look: { color: '#2b6cb0', metalness: 0.5, roughness: 0.46 },
        buyUrl: buy('ACDelco PF2 oil filter') },
      { id: 'fram', brand: 'FRAM', name: 'Extra Guard PH8A', tint: '#e0631b',
        sku: 'FRM-PH8A', price: 7.97, rating: 4.5, reviews: 8800,
        blurb: 'Orange-can everyday filter, 10k-mile media.',
        look: { color: '#e0631b', metalness: 0.45, roughness: 0.5 },
        buyUrl: buy('FRAM PH8A oil filter') },
      { id: 'mobil1', brand: 'Mobil 1', name: 'M1-301 Extended Perf.', tint: '#d6dbe1',
        sku: 'MOB-M1-301', price: 12.97, rating: 4.8, reviews: 6100,
        blurb: 'Silver synthetic-media filter, 20k-mile rating.',
        look: { color: '#d3d8de', metalness: 0.55, roughness: 0.4 },
        buyUrl: buy('Mobil 1 M1-301 oil filter') },
      { id: 'kn-gold', brand: 'K&N', name: 'HP-1002 Gold Chrome', tint: '#c9a23a',
        sku: 'KN-HP-1002', price: 14.99, rating: 4.8, reviews: 3400,
        blurb: 'Gold-chrome racing can with a 1" weld nut for easy removal.',
        look: { color: '#caa53b', metalness: 1.0, roughness: 0.15, finish: 'smooth' },
        buyUrl: buy('K&N HP-1002 oil filter') },
    ],
  },

  drive_belt: {
    label: 'Drive Belt',
    variants: [
      { id: 'gates-black', brand: 'Gates', name: 'Hi-Power V-Belt (Stock)', tint: '#1a1c20',
        sku: 'GAT-9395', price: 14.49, rating: 4.6, reviews: 1900, oem: true,
        blurb: 'Standard black wrapped V-belt.',
        look: { color: '#15171a', metalness: 0.15, roughness: 0.88, finish: 'rubber' },
        buyUrl: buy('Gates Hi-Power V-belt') },
      { id: 'gates-green', brand: 'Gates', name: 'Green Stripe Racing', tint: '#1f7a3d',
        sku: 'GAT-9395GR', price: 21.99, rating: 4.7, reviews: 540,
        blurb: 'High-temp green-stripe belt for high-rpm accessory drives.',
        look: { color: '#1f7a3d', metalness: 0.15, roughness: 0.8, finish: 'rubber' },
        buyUrl: buy('Gates green stripe racing belt') },
    ],
  },

  alternator: {
    label: 'Alternator',
    variants: [
      { id: 'delco', brand: 'ACDelco', name: '10SI 63A Cast (Stock)', tint: '#aeb3bb',
        sku: 'ACD-321-270', price: 89.0, rating: 4.5, reviews: 760, oem: true,
        blurb: 'Factory cast-aluminum 10SI internally-regulated alternator.',
        look: { mat: 'castAluminum' }, buyUrl: buy('Delco 10SI alternator') },
      { id: 'powermaster-chrome', brand: 'Powermaster', name: '100A Chrome', tint: '#cfd4da',
        sku: 'PWM-17294', price: 199.0, rating: 4.7, reviews: 430,
        blurb: 'Chrome 100-amp one-wire street/show alternator.',
        look: { mat: 'chrome' }, buyUrl: buy('Powermaster chrome alternator') },
      { id: 'powermaster-black', brand: 'Powermaster', name: '150A XS Black', tint: '#212429',
        sku: 'PWM-58236', price: 269.0, rating: 4.8, reviews: 290,
        blurb: 'High-output 150A unit, black anodized for big stereo/EFI loads.',
        look: { color: '#1c1f24', metalness: 0.5, roughness: 0.6, finish: 'painted' },
        buyUrl: buy('Powermaster 150 amp alternator') },
    ],
  },

  intake_manifold: {
    label: 'Intake Manifold',
    variants: [
      { id: 'oem-cast', brand: 'OEM', name: 'Cast-Iron Dual Plane (Stock)', tint: '#aeb3bb',
        sku: 'GM-14096011', price: 119.0, rating: 4.2, reviews: 210, oem: true,
        blurb: 'Factory cast dual-plane intake.', look: { mat: 'castAluminum' },
        perf: { ve: 0.06, peakRpm: 300 },
        spec: 'cast-iron dual-plane · idle–4500 rpm',
        buyUrl: buy('SBC dual plane intake manifold') },
      { id: 'edel-performer', brand: 'Edelbrock', name: 'Performer 2101', tint: '#b9bec6',
        sku: 'EDL-2101', price: 189.0, rating: 4.8, reviews: 3100,
        blurb: 'Aluminum dual-plane — better throttle response and economy.',
        perf: { ve: 0.08, peakRpm: 350 },
        spec: 'aluminum dual-plane · idle–5500 rpm',
        look: { mat: 'castAluminum', color: '#bcc1c9' }, buyUrl: buy('Edelbrock Performer 2101') },
      { id: 'edel-rpm-polished', brand: 'Edelbrock', name: 'Performer RPM Polished', tint: '#d2d7de',
        sku: 'EDL-71011', price: 329.0, rating: 4.9, reviews: 1450,
        blurb: 'Polished air-gap intake for 1500–6500 rpm power.',
        perf: { ve: 0.095, peakRpm: 550 },
        spec: 'air-gap dual-plane · 1500–6500 rpm',
        look: { mat: 'machinedAlu', color: '#d4d9e0', roughness: 0.24 },
        buyUrl: buy('Edelbrock Performer RPM Air Gap polished') },
    ],
  },

  carburetor: {
    label: 'Carburettor',
    variants: [
      { id: 'edel-1406', brand: 'Edelbrock', name: 'Performer 600 CFM (Stock)', tint: '#b4b9c1',
        sku: 'EDL-1406', price: 379.0, rating: 4.6, reviews: 2600, oem: true,
        blurb: 'Satin 600 cfm electric-choke 4-barrel — easy street tune.',
        perf: { cfm: 600, ve: 0.01 },
        spec: '600 cfm · vacuum secondary · electric choke',
        look: { mat: 'castAluminum' }, buyUrl: buy('Edelbrock 1406 carburetor') },
      { id: 'holley-4150', brand: 'Holley', name: '4150 750 CFM Double Pump', tint: '#b89a3e',
        sku: 'HLY-0-4779C', price: 549.0, rating: 4.7, reviews: 1800,
        blurb: 'Gold-dichromate 750 cfm mechanical-secondary double pumper.',
        perf: { cfm: 750, ve: 0.02, peakRpm: 150 },
        spec: '750 cfm · mechanical secondaries · dual accelerator pumps',
        look: { color: '#b6993f', metalness: 0.72, roughness: 0.34, finish: 'machined' },
        buyUrl: buy('Holley 0-4779 double pumper carburetor') },
      { id: 'holley-sniper', brand: 'Holley', name: 'Sniper EFI Black', tint: '#202327',
        sku: 'HLY-550-511', price: 1099.0, rating: 4.6, reviews: 2100,
        blurb: 'Self-tuning throttle-body EFI in a black 4150 footprint.',
        perf: { cfm: 800, ve: 0.03, peakRpm: 200 },
        spec: '~800 cfm equiv · 4-injector self-tuning EFI',
        look: { color: '#1b1e22', metalness: 0.55, roughness: 0.5, finish: 'painted' },
        buyUrl: buy('Holley Sniper EFI 550-511') },
    ],
  },

  // The two biggest power levers on a Small-Block. Both are "perf-only" swaps
  // (no live material change), but the camshaft ALSO retimes and re-lifts the
  // valve animation — one selection drives both the dyno and the moving parts.
  camshaft: {
    label: 'Camshaft',
    variants: [
      { id: 'oem-hyd', brand: 'GM', name: 'Stock Hydraulic (Stock)', tint: '#9aa0a8',
        sku: 'GM-14060653', price: 119.0, rating: 4.3, reviews: 410, oem: true,
        blurb: 'Mild factory hydraulic flat-tappet — smooth idle, strong low end.',
        spec: '~262° adv · 0.450" lift · 112° LSA',
        perf: { ve: 0.07, peakRpm: 400, redline: 5600, lowWidth: 1800, highWidth: 2950, lopiness: 0.05 },
        cam: { events: { exhaustOpen: 130, exhaustClose: 370, intakeOpen: 350, intakeClose: 590 }, maxLiftIn: 0.45 },
        buyUrl: buy('SBC stock hydraulic camshaft') },
      { id: 'comp-rv', brand: 'COMP Cams', name: 'High Energy 252H (Towing)', tint: '#1f7a3d',
        sku: 'CCA-12-202-2', price: 139.0, rating: 4.7, reviews: 980,
        blurb: 'RV/towing grind — fattens up low-end torque and vacuum.',
        spec: '252° adv · 0.435" lift · 114° LSA',
        perf: { ve: 0.06, peakRpm: 200, redline: 5200, lowWidth: 1950, highWidth: 2500, lopiness: 0.12 },
        cam: { events: { exhaustOpen: 120, exhaustClose: 375, intakeOpen: 345, intakeClose: 595 }, maxLiftIn: 0.435 },
        buyUrl: buy('COMP Cams 252H High Energy camshaft SBC') },
      { id: 'comp-xe268', brand: 'COMP Cams', name: 'Xtreme Energy XE268H', tint: '#c2122a',
        sku: 'CCA-12-242-2', price: 169.0, rating: 4.8, reviews: 2100,
        blurb: 'Street/strip favorite — noticeable lope, big mid-range punch.',
        spec: '268° adv · 0.488" lift · 110° LSA',
        perf: { ve: 0.10, peakRpm: 900, redline: 6000, lowWidth: 1650, highWidth: 2700, lopiness: 0.45 },
        cam: { events: { exhaustOpen: 115, exhaustClose: 382, intakeOpen: 335, intakeClose: 602 }, maxLiftIn: 0.488 },
        buyUrl: buy('COMP Cams XE268H Xtreme Energy camshaft SBC') },
      { id: 'comp-xe292', brand: 'COMP Cams', name: 'Xtreme Energy XE292H', tint: '#b89a3e',
        sku: 'CCA-12-509-8', price: 199.0, rating: 4.7, reviews: 760,
        blurb: 'Big aggressive grind — race idle, all the power lives up top.',
        spec: '292° adv · 0.520" lift · 108° LSA',
        perf: { ve: 0.115, peakRpm: 1250, redline: 6500, lowWidth: 1500, highWidth: 3000, lopiness: 0.85 },
        cam: { events: { exhaustOpen: 105, exhaustClose: 392, intakeOpen: 325, intakeClose: 612 }, maxLiftIn: 0.52 },
        buyUrl: buy('COMP Cams XE292H Xtreme Energy camshaft SBC') },
    ],
  },

  cylinder_head: {
    label: 'Cylinder Heads',
    variants: [
      { id: 'oem-iron', brand: 'OEM', name: 'Cast-Iron 76cc (Stock)', tint: '#9aa0a8',
        sku: 'GM-10039906', price: 210.0, rating: 4.1, reviews: 240, oem: true,
        blurb: 'Factory iron heads — small ports, modest flow, bulletproof.',
        spec: 'iron · ~170 cfm @ 0.500" · 76cc',
        perf: { ve: 0.14, peakRpm: 450, cr: 8.5 },
        buyUrl: buy('SBC cast iron cylinder heads') },
      { id: 'gm-vortec', brand: 'GM Performance', name: 'Vortec Iron 64cc', tint: '#bf6a2e',
        sku: 'GMP-12558060', price: 549.0, rating: 4.7, reviews: 1300,
        blurb: 'The legendary Vortec casting — great flow for an iron head, more squeeze.',
        spec: 'iron · ~210 cfm @ 0.500" · 64cc',
        perf: { ve: 0.19, peakRpm: 600, cr: 9.6 },
        buyUrl: buy('GM Vortec cylinder heads 062') },
      { id: 'afr-195', brand: 'AFR', name: 'Eliminator 195 Aluminum', tint: '#cfd4db',
        sku: 'AFR-1040', price: 1399.0, rating: 4.9, reviews: 540,
        blurb: 'CNC-ported aluminum — the single biggest top-end power lever here.',
        spec: 'aluminum · ~245 cfm @ 0.500" · 65cc',
        perf: { ve: 0.235, peakRpm: 800, cr: 10.2 },
        buyUrl: buy('AFR 195 Eliminator aluminum cylinder heads SBC') },
    ],
  },

  spark_plugs: {
    label: 'Spark Plugs & Wires',
    variants: [
      { id: 'acdelco-r45', brand: 'ACDelco', name: 'R45TS Copper (Stock)', tint: '#c9ccd1',
        sku: 'ACD-R45TS', price: 3.29, rating: 4.6, reviews: 4200, oem: true,
        blurb: 'Factory copper-core plug — the SBC tune-up standard.',
        buyUrl: buy('ACDelco R45TS spark plug') },
      { id: 'ngk-iridium', brand: 'NGK', name: 'Iridium IX', tint: '#c2122a',
        sku: 'NGK-BPR6EIX', price: 9.49, rating: 4.9, reviews: 7600,
        blurb: 'Fine-wire iridium — sharper spark, long service life.',
        buyUrl: buy('NGK BPR6EIX iridium spark plug') },
      { id: 'denso', brand: 'Denso', name: 'Platinum TT', tint: '#0a59a8',
        sku: 'DEN-PK20TT', price: 6.99, rating: 4.7, reviews: 3100,
        blurb: 'Twin-tip platinum for a stable idle and clean burn.',
        buyUrl: buy('Denso Platinum TT spark plug') },
    ],
  },

  distributor: {
    label: 'Distributor',
    variants: [
      { id: 'oem-points', brand: 'OEM', name: 'Points Distributor (Stock)', tint: '#23262b',
        sku: 'GM-1112883', price: 79.0, rating: 4.0, reviews: 180, oem: true,
        blurb: 'Factory breaker-point distributor with vacuum advance.',
        buyUrl: buy('SBC points distributor') },
      { id: 'msd-pro', brand: 'MSD', name: 'Pro-Billet Ready-to-Run', tint: '#c2122a',
        sku: 'MSD-8360', price: 329.0, rating: 4.8, reviews: 1900,
        blurb: 'Billet housing, built-in module — no external box needed.',
        buyUrl: buy('MSD 8360 Pro-Billet distributor') },
      { id: 'pertronix', brand: 'PerTronix', name: 'Flame-Thrower Billet', tint: '#1f7a3d',
        sku: 'PRX-D100710', price: 249.0, rating: 4.7, reviews: 1200,
        blurb: 'Billet distributor with Ignitor electronic conversion built in.',
        buyUrl: buy('PerTronix Flame-Thrower billet distributor') },
    ],
  },

  exhaust_manifold: {
    label: 'Headers',
    variants: [
      { id: 'oem-castiron', brand: 'OEM', name: 'Cast-Iron Manifolds (Stock)', tint: '#56595e',
        sku: 'GM-14097752', price: 149.0, rating: 4.1, reviews: 220, oem: true,
        blurb: 'Factory cast-iron exhaust manifolds — quiet and durable.',
        perf: { ve: 0.02, peakRpm: 50 },
        spec: 'restrictive cast-iron log manifolds',
        look: { mat: 'castIron' }, buyUrl: buy('SBC cast iron exhaust manifolds') },
      { id: 'hooker-ceramic', brand: 'Hooker', name: 'Super Comp Ceramic', tint: '#cfcfc8',
        sku: 'HOK-2453HKR', price: 379.0, rating: 4.7, reviews: 540,
        blurb: 'Ceramic-coated long-tube headers — lower underhood temps.',
        perf: { ve: 0.06, peakRpm: 250 },
        spec: '1-5/8" long-tube · scavenges the top end',
        look: { color: '#d3d3cb', metalness: 0.35, roughness: 0.5, finish: 'matte' },
        buyUrl: buy('Hooker Super Comp ceramic headers SBC') },
      { id: 'patriot-chrome', brand: 'Patriot', name: 'Chrome Block-Hugger', tint: '#cfd4da',
        sku: 'PAT-H8007', price: 219.0, rating: 4.4, reviews: 410,
        blurb: 'Chrome-plated tight-tuck headers for street/show.',
        perf: { ve: 0.04, peakRpm: 150 },
        spec: 'tight-tuck shorty primaries',
        look: { mat: 'chrome' }, buyUrl: buy('Patriot chrome block hugger headers SBC') },
      { id: 'hedman-black', brand: 'Hedman', name: 'Hedders Black Maxx', tint: '#1c1e22',
        sku: 'HED-68306', price: 199.0, rating: 4.5, reviews: 360,
        blurb: 'High-temp black-coated headers, corrosion resistant.',
        perf: { ve: 0.055, peakRpm: 220 },
        spec: '1-5/8" long-tube · high-temp coated',
        look: { color: '#1a1c20', metalness: 0.4, roughness: 0.6, finish: 'painted' },
        buyUrl: buy('Hedman Hedders black SBC headers') },
    ],
  },

  water_pump: {
    label: 'Water Pump',
    variants: [
      { id: 'oem-cast', brand: 'ACDelco', name: 'Cast Short-Style (Stock)', tint: '#aeb3bb',
        sku: 'ACD-252-846', price: 49.0, rating: 4.5, reviews: 980, oem: true,
        blurb: 'Factory cast-iron/alloy short water pump.', cool: 0.3,
        look: { mat: 'castAluminum' }, buyUrl: buy('SBC short water pump') },
      { id: 'edel-victor', brand: 'Edelbrock', name: 'Victor Series Aluminum', tint: '#b9bec6',
        sku: 'EDL-8810', price: 139.0, rating: 4.7, reviews: 520,
        blurb: 'High-flow polished aluminum pump for performance cooling.', cool: 0.45,
        look: { mat: 'machinedAlu' }, buyUrl: buy('Edelbrock Victor water pump SBC') },
      { id: 'tuffstuff-chrome', brand: 'Tuff Stuff', name: 'Chrome High-Flow', tint: '#cfd4da',
        sku: 'TFS-1431B', price: 109.0, rating: 4.6, reviews: 300,
        blurb: 'Chrome-plated high-volume pump — show-engine staple.', cool: 0.4,
        look: { mat: 'chrome' }, buyUrl: buy('Tuff Stuff chrome water pump SBC') },
    ],
  },

  cooling_fan: {
    label: 'Cooling Fan',
    variants: [
      { id: 'oem-steel', brand: 'OEM', name: '6-Blade Steel (Stock)', tint: '#3a3f47',
        sku: 'GM-3947772', price: 34.0, rating: 4.3, reviews: 410, oem: true,
        blurb: 'Factory fixed steel fan.', cool: 0.18,
        look: { color: '#26292f', metalness: 0.4, roughness: 0.6 },
        buyUrl: buy('SBC 6 blade engine fan') },
      { id: 'flexalite', brand: 'Flex-a-lite', name: 'Belt-Driven Flex Fan', tint: '#c2c7ce',
        sku: 'FLX-1316', price: 89.0, rating: 4.5, reviews: 260,
        blurb: 'Stainless flex blades flatten at rpm to free up power.', cool: 0.22,
        look: { mat: 'steel' }, buyUrl: buy('Flex-a-lite flex fan') },
      { id: 'black-clutch', brand: 'Hayden', name: 'Thermal Clutch Fan (Black)', tint: '#16181c',
        sku: 'HAY-2747', price: 74.0, rating: 4.6, reviews: 340,
        blurb: 'Black thermal-clutch fan — engages only when hot.', cool: 0.28,
        look: { color: '#15171b', metalness: 0.2, roughness: 0.72, finish: 'painted' },
        buyUrl: buy('Hayden thermal clutch fan') },
    ],
  },

  fuel_pump: {
    label: 'Fuel Pump',
    variants: [
      { id: 'acdelco-mech', brand: 'ACDelco', name: 'Mechanical Pump (Stock)', tint: '#aeb3bb',
        sku: 'ACD-41594', price: 29.0, rating: 4.4, reviews: 520, oem: true,
        blurb: 'Factory cam-driven mechanical fuel pump.',
        buyUrl: buy('SBC mechanical fuel pump') },
      { id: 'holley-mech', brand: 'Holley', name: '110 GPH Mechanical', tint: '#b89a3e',
        sku: 'HLY-12-327-13', price: 79.0, rating: 4.7, reviews: 680,
        blurb: 'High-volume mechanical pump for big carburetors.',
        buyUrl: buy('Holley 110 GPH mechanical fuel pump') },
      { id: 'edel-mech', brand: 'Edelbrock', name: 'Performer 120 GPH', tint: '#b4b9c1',
        sku: 'EDL-1721', price: 99.0, rating: 4.6, reviews: 290,
        blurb: 'Performer mechanical pump, 6.5 psi street pressure.',
        buyUrl: buy('Edelbrock Performer fuel pump 1721') },
    ],
  },

  thermostat: {
    label: 'Thermostat & Outlet',
    variants: [
      { id: 'stant-180', brand: 'Stant', name: 'SuperStat 180°F (Stock)', tint: '#aeb3bb',
        sku: 'STA-45358', price: 9.49, rating: 4.7, reviews: 3200, oem: true,
        blurb: 'High-flow 180-degree thermostat.',
        buyUrl: buy('Stant SuperStat 180 thermostat') },
      { id: 'mrgasket-160', brand: 'Mr. Gasket', name: '160°F High-Flow', tint: '#c2122a',
        sku: 'MRG-4365', price: 12.99, rating: 4.5, reviews: 740,
        blurb: 'Cooler 160-degree thermostat for performance builds.',
        buyUrl: buy('Mr Gasket 160 thermostat') },
      { id: 'edel-housing', brand: 'Edelbrock', name: 'Polished Outlet Housing', tint: '#cfd4da',
        sku: 'EDL-8170', price: 34.99, rating: 4.6, reviews: 410,
        blurb: 'Polished aluminum thermostat housing with O-ring seal.',
        buyUrl: buy('Edelbrock polished thermostat housing') },
    ],
  },
};

/** Components that have a Garage catalog (for "swappable" badges, etc.). */
export const SWAPPABLE = new Set(Object.keys(PRODUCTS));

/** All variants for a component, or null. */
export function getVariants(componentId) {
  return PRODUCTS[componentId]?.variants ?? null;
}

/** The default (OEM/stock) variant id for a component, or null. */
export function defaultVariantId(componentId) {
  const v = PRODUCTS[componentId]?.variants;
  return v && v.length ? v[0].id : null;
}

/** Resolve the active variant object given the store's selection. */
export function getActiveVariant(componentId, selectedId) {
  const list = PRODUCTS[componentId]?.variants;
  if (!list) return null;
  return list.find((v) => v.id === selectedId) ?? list[0];
}

/**
 * The material look override to apply in 3D for the active variant, or null if
 * the component isn't swappable. Consumed by Part.jsx → PartContext → Surface.
 */
export function getVariantLook(componentId, selectedId) {
  const v = getActiveVariant(componentId, selectedId);
  return v ? v.look ?? null : null;
}
