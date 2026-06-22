/**
 * Component definitions for the active assembly (inline-4 engine).
 * Each entry maps a Part mesh name to rich metadata shown in the Parts tab and
 * the component detail panel. Structure: Assembly → Sub-assembly → Component.
 *
 * The whole-vehicle component set is preserved in ./vehicle_archive.
 */

export const COMPONENTS = {
  // ── Short block ────────────────────────────────────────────────────────────
  engine_block: {
    id: 'engine_block',
    label: 'Cylinder Block',
    subsystemId: 'block',
    function:
      'The main structural casting of the engine. Contains the cylinder bores the pistons travel in, plus coolant passages and oil galleries. Everything else bolts to it.',
    tags: ['structural', 'engine-core'],
    relatedComponents: ['pistons', 'crankshaft', 'cylinder_head', 'oil_pan'],
    failureSymptoms: [
      'Oil or coolant leaks from gaskets or cracks',
      'Loss of compression across cylinders',
      'Coolant contamination in the oil (milky oil)',
      'Overheating from blocked coolant passages',
    ],
    maintenanceNote:
      'Inspect the deck for warping and pressure-test the block during a rebuild. Always torque mating parts to factory spec in sequence.',
  },
  oil_pan: {
    id: 'oil_pan',
    label: 'Oil Pan',
    subsystemId: 'block',
    function:
      'Bolts to the bottom of the block and holds the engine’s oil supply. The drain plug at its lowest point is removed for oil changes.',
    tags: ['lubrication', 'structural'],
    relatedComponents: ['engine_block', 'crankshaft', 'pan_bolts'],
    failureSymptoms: [
      'Oil drips/puddles under the engine',
      'Stripped or weeping drain plug',
      'Dented pan from road debris reducing oil capacity',
      'Leaking pan gasket after a cold start',
    ],
    maintenanceNote:
      'Replace the drain-plug washer at every oil change. Torque pan bolts evenly to avoid distorting the sealing flange.',
  },
  crankshaft: {
    id: 'crankshaft',
    label: 'Crankshaft',
    subsystemId: 'block',
    function:
      'Converts the up-and-down motion of the pistons into rotation that drives the transmission and accessories. Rides in main bearings inside the block.',
    tags: ['engine-core', 'moving'],
    relatedComponents: ['pistons', 'engine_block'],
    failureSymptoms: [
      'Deep knocking from the lower engine',
      'Sudden oil-pressure loss',
      'Excessive vibration',
      'Engine seizure in severe cases',
    ],
    maintenanceNote:
      'Check main- and rod-bearing clearances with Plastigage during a rebuild. Inspect journals for scoring or out-of-round.',
  },
  pistons: {
    id: 'pistons',
    label: 'Pistons & Rods',
    subsystemId: 'block',
    function:
      'Reciprocating slugs that compress the air–fuel charge and transfer combustion force to the crankshaft through the connecting rods. One per cylinder.',
    tags: ['engine-core', 'moving'],
    relatedComponents: ['engine_block', 'crankshaft', 'cylinder_head'],
    failureSymptoms: [
      'Blue smoke from the exhaust (oil burning past the rings)',
      'Low or uneven compression',
      'Piston slap — a hollow knock when cold',
      'Engine knock or pinging under load',
    ],
    maintenanceNote:
      'Replace piston rings during a rebuild and check ring end-gap to spec. Inspect skirts for scuffing.',
  },

  // ── Cylinder head ───────────────────────────────────────────────────────────
  cylinder_head: {
    id: 'cylinder_head',
    label: 'Cylinder Head',
    subsystemId: 'head',
    function:
      'Bolts to the top of the block and forms the top of the combustion chambers. Carries the intake and exhaust ports, valves, and the camshaft.',
    tags: ['engine-core', 'valve-train'],
    relatedComponents: ['camshaft', 'valve_cover', 'engine_block', 'head_bolts'],
    failureSymptoms: [
      'White exhaust smoke / coolant loss (blown head gasket)',
      'Warping from overheating',
      'Ticking valvetrain noise',
      'Compression loss between adjacent cylinders',
    ],
    maintenanceNote:
      'Check the head for flatness and torque head bolts in the correct sequence and stages. Many head bolts are torque-to-yield and single-use.',
  },
  camshaft: {
    id: 'camshaft',
    label: 'Camshaft',
    subsystemId: 'head',
    function:
      'Lobed shaft that opens and closes the valves in time with the crankshaft. Driven by a timing belt or chain.',
    tags: ['valve-train', 'moving'],
    relatedComponents: ['cylinder_head', 'valve_cover'],
    failureSymptoms: [
      'Rough or unstable idle',
      'Repetitive ticking from the top of the engine',
      'Loss of power',
      'Worn or pitted lobes',
    ],
    maintenanceNote:
      'Inspect lobes and journals during a timing service. Replace the timing belt/chain at the recommended interval.',
  },
  valve_cover: {
    id: 'valve_cover',
    label: 'Valve Covers',
    subsystemId: 'head',
    function:
      'The chrome covers seal the top of each cylinder head over the rocker arms, keeping oil in and dirt out, and carry the oil filler cap and a breather.',
    tags: ['valve-train', 'sealing', 'chrome'],
    relatedComponents: ['cylinder_head', 'camshaft', 'cover_bolts'],
    failureSymptoms: [
      'Oil seeping from the valve-cover gasket',
      'Oil burning on the exhaust manifold (smell/smoke)',
      'Misfires if oil reaches the spark plugs',
    ],
    maintenanceNote:
      'Replace the gasket when it hardens or leaks. Snug the cover bolts evenly — overtightening cracks the cover and crushes the gasket.',
  },

  // ── Induction ─────────────────────────────────────────────────────────────────
  intake_manifold: {
    id: 'intake_manifold',
    label: 'Intake Manifold',
    subsystemId: 'intake',
    function:
      'Sits in the valley between the two banks and distributes the air–fuel charge from the carburettor evenly to all eight intake ports. On a classic V8 it also routes coolant to the thermostat housing.',
    tags: ['air-intake', 'cast'],
    relatedComponents: ['carburetor', 'cylinder_head', 'distributor'],
    failureSymptoms: [
      'Vacuum leak causing a high or unstable idle',
      'Coolant leak at the intake gasket (milky oil)',
      'Lean misfires and hissing at idle',
    ],
    maintenanceNote:
      'Torque intake bolts in the correct crisscross sequence. Replace the valley gaskets whenever the manifold is removed.',
  },
  carburetor: {
    id: 'carburetor',
    label: 'Carburettor',
    subsystemId: 'intake',
    function:
      'Meters fuel into the incoming air using engine vacuum and venturi effect — no electronics. The float bowls maintain fuel level and the throttle plates set airflow from the accelerator.',
    tags: ['air-intake', 'fuel'],
    relatedComponents: ['air_cleaner', 'intake_manifold'],
    failureSymptoms: [
      'Flooding or a strong fuel smell when hot',
      'Hesitation, stumble, or hard starting',
      'Black sooty exhaust (running rich)',
      'Rough idle from a dirty or worn circuit',
    ],
    maintenanceNote:
      'Set the idle mixture and float level to spec. Rebuild with a kit when gaskets harden or circuits clog.',
  },
  air_cleaner: {
    id: 'air_cleaner',
    label: 'Air Cleaner',
    subsystemId: 'intake',
    function:
      'The round chrome housing on top of the carburettor holds a ring air filter, silences intake noise, and keeps dirt out of the engine.',
    tags: ['air-intake', 'filter'],
    relatedComponents: ['carburetor'],
    failureSymptoms: [
      'Power loss and rich running from a clogged filter',
      'Whistling or loud intake roar',
      'Dirt ingestion if the element is missing or split',
    ],
    maintenanceNote:
      'Inspect and replace the paper/foam element periodically. A wing nut secures the lid — don’t overtighten it.',
  },
  distributor: {
    id: 'distributor',
    label: 'Distributor',
    subsystemId: 'intake',
    function:
      'Driven off the camshaft at the rear of the valley, it routes high-voltage spark to each cylinder in the firing order and sets ignition timing via its position.',
    tags: ['ignition', 'electronic'],
    relatedComponents: ['camshaft', 'intake_manifold'],
    failureSymptoms: [
      'Misfires or a no-spark no-start',
      'Timing drift causing pinging or power loss',
      'Worn cap/rotor causing crossfire',
    ],
    maintenanceNote:
      'Set base timing with a timing light. Replace the cap, rotor, and plug wires as a tune-up set.',
  },
  pcv_breather: {
    id: 'pcv_breather',
    label: 'PCV & Breather',
    subsystemId: 'intake',
    function:
      'Crankcase ventilation. A breather lets filtered air into one valve cover while the PCV valve draws blow-by gases out of the other into the intake to be re-burned, keeping pressure and moisture out of the crankcase.',
    tags: ['emissions', 'ventilation'],
    relatedComponents: ['valve_cover', 'intake_manifold', 'carburetor'],
    failureSymptoms: [
      'Rough idle or vacuum leak from a stuck-open PCV',
      'Oil sludging and pressure build-up if it clogs',
      'Oil pushed past seals / breather when blocked',
    ],
    maintenanceNote:
      'Replace the PCV valve at tune-ups — shake it and listen for the rattle. Clean the breather element and check the hoses for cracks.',
  },
  throttle_linkage: {
    id: 'throttle_linkage',
    label: 'Throttle Linkage',
    subsystemId: 'intake',
    function:
      'The rod, lever, and return spring that translate the accelerator into throttle-plate opening at the carb, then snap the throttle closed again when you lift off.',
    tags: ['air-intake', 'mechanical', 'control'],
    relatedComponents: ['carburetor'],
    failureSymptoms: [
      'Sticking throttle or slow return (a safety risk)',
      'Worn bushings causing slop and uneven response',
      'Broken return spring leaving the throttle held open',
    ],
    maintenanceNote:
      'Keep pivots clean and lightly lubricated. Check that the throttle returns fully and freely, and that the return spring is intact.',
  },
  vacuum_advance: {
    id: 'vacuum_advance',
    label: 'Vacuum Advance',
    subsystemId: 'ignition',
    function:
      'The canister on the distributor uses manifold vacuum to advance ignition timing under light cruise, improving efficiency before backing off again under load.',
    tags: ['ignition', 'timing', 'vacuum'],
    relatedComponents: ['distributor', 'intake_manifold'],
    failureSymptoms: [
      'Poor economy and part-throttle ping if it fails',
      'Ruptured diaphragm causing a vacuum leak and rough idle',
      'No timing change when vacuum is applied',
    ],
    maintenanceNote:
      'Test it by drawing vacuum and watching for the plate to move and hold. Replace if the diaphragm leaks down.',
  },
  senders: {
    id: 'senders',
    label: 'Temp & Oil Senders',
    subsystemId: 'block',
    function:
      'Small threaded senders that read coolant temperature (at the intake) and oil pressure (at the block) and feed the dashboard gauges or warning lights.',
    tags: ['electrical', 'sensor', 'gauges'],
    relatedComponents: ['thermostat', 'engine_block', 'oil_pan'],
    failureSymptoms: [
      'Wildly wrong or dead temperature / oil-pressure gauge',
      'Oil weeping from the pressure sender',
      'Intermittent reading from a corroded connection',
    ],
    maintenanceNote:
      'Confirm a suspect reading with a mechanical gauge before condemning the engine. Seal the threads and don’t overtighten the brass body.',
  },

  // ── Exhaust ─────────────────────────────────────────────────────────────────
  exhaust_manifold: {
    id: 'exhaust_manifold',
    label: 'Headers',
    subsystemId: 'exhaust',
    function:
      'Tubular headers bolt to each bank’s exhaust ports and sweep equal-length primaries into a collector, scavenging spent gases more efficiently than cast manifolds.',
    tags: ['exhaust', 'heat'],
    relatedComponents: ['cylinder_head'],
    failureSymptoms: [
      'Ticking exhaust leak, loudest at cold start',
      'Cracked tubes or blown collector gasket',
      'Burning smell and lost low-end torque',
    ],
    maintenanceNote:
      'Re-torque header bolts after the first few heat cycles. Use high-temp gaskets and anti-seize on the fasteners.',
  },

  // ── Valvetrain ───────────────────────────────────────────────────────────────
  valvetrain: {
    id: 'valvetrain',
    label: 'Rockers & Pushrods',
    subsystemId: 'head',
    function:
      'In this OHV V8 the camshaft works the valves through lifters, pushrods, and rocker arms. The rockers pivot to push each valve open against its spring, which snaps it shut again in time with the engine.',
    tags: ['valve-train', 'moving', 'hidden'],
    relatedComponents: ['camshaft', 'cylinder_head', 'valve_cover'],
    failureSymptoms: [
      'Ticking or clatter from a loose or collapsed lifter',
      'Dropped or floated valve at high rpm',
      'Bent pushrod or worn rocker tip',
      'Misfire from a valve held open',
    ],
    maintenanceNote:
      'Set valve lash to spec (or prime hydraulic lifters). Inspect pushrods for straightness and rocker tips/springs for wear during a valve job.',
  },

  // ── Cooling & belt drive ─────────────────────────────────────────────────────
  thermostat: {
    id: 'thermostat',
    label: 'Thermostat & Outlet',
    subsystemId: 'cooling',
    function:
      'The housing on the front of the intake holds the thermostat and feeds the upper radiator hose. The thermostat stays shut until the engine warms, then opens to let coolant flow to the radiator.',
    tags: ['cooling', 'temperature'],
    relatedComponents: ['water_pump', 'intake_manifold'],
    failureSymptoms: [
      'Overheating if it sticks shut',
      'Never reaching temperature / poor heat if it sticks open',
      'Coolant leak at the housing gasket',
      'Erratic temperature-gauge swings',
    ],
    maintenanceNote:
      'Replace with the correct temperature rating and a new gasket. Fit it with the spring end toward the engine and bleed the air out after refilling.',
  },

  // ── Cooling & belt drive (accessory) ──────────────────────────────────────────
  water_pump: {
    id: 'water_pump',
    label: 'Water Pump',
    subsystemId: 'cooling',
    function:
      'Bolts to the nose of the block and is spun by the drive belt. Its impeller circulates coolant through the block, heads, and radiator to carry combustion heat away.',
    tags: ['cooling', 'belt-driven', 'moving'],
    relatedComponents: ['drive_belt', 'cooling_fan', 'engine_block'],
    failureSymptoms: [
      'Coolant weeping from the weep hole (failed shaft seal)',
      'Overheating from a worn or slipping impeller',
      'Bearing growl or play in the pulley',
      'Coolant puddle at the front of the engine',
    ],
    maintenanceNote:
      'Replace at major timing/cooling services. Spin the pulley to check for bearing rumble and rock it to feel for shaft play.',
  },
  cooling_fan: {
    id: 'cooling_fan',
    label: 'Cooling Fan',
    subsystemId: 'cooling',
    function:
      'Mounted on the water-pump snout, the fan pulls air through the radiator at low speed and idle when there is little ram air. A spacer sets its depth in the shroud.',
    tags: ['cooling', 'airflow', 'moving'],
    relatedComponents: ['water_pump', 'drive_belt'],
    failureSymptoms: [
      'Overheating in traffic / at idle',
      'Cracked or missing blades causing vibration',
      'Failed clutch (on thermal-clutch fans) — fan free-spins',
    ],
    maintenanceNote:
      'Inspect blades for cracks and check the fan-clutch for excessive free play. Keep the shroud intact for correct airflow.',
  },
  alternator: {
    id: 'alternator',
    label: 'Alternator',
    subsystemId: 'charging',
    function:
      'A belt-driven generator that produces the electrical current to run the ignition and accessories and to recharge the battery while the engine runs.',
    tags: ['charging', 'electrical', 'belt-driven'],
    relatedComponents: ['drive_belt'],
    failureSymptoms: [
      'Battery / charge warning light on',
      'Dim lights and a dying battery',
      'Bearing whine or a burnt-electrical smell',
      'Low charging voltage at the battery',
    ],
    maintenanceNote:
      'Check charging voltage (about 13.5–14.5 V running) and belt tension. Listen for bearing noise and inspect the pulley.',
  },
  drive_belt: {
    id: 'drive_belt',
    label: 'Drive Belt',
    subsystemId: 'cooling',
    function:
      'A single V-belt routed off the crankshaft pulley that drives the water pump and alternator together. Belt tension keeps everything turning without slip.',
    tags: ['belt', 'accessory-drive', 'wear'],
    relatedComponents: ['water_pump', 'alternator', 'crankshaft'],
    failureSymptoms: [
      'Squealing on start-up or under load',
      'Glazed, cracked, or frayed belt surface',
      'Overheating and a dead battery if the belt snaps',
    ],
    maintenanceNote:
      'Inspect for cracks and glazing; set tension so the belt deflects about 1 cm under thumb pressure. Replace at the first sign of wear.',
  },

  // ── Ignition ─────────────────────────────────────────────────────────────────
  spark_plugs: {
    id: 'spark_plugs',
    label: 'Spark Plugs & Wires',
    subsystemId: 'ignition',
    function:
      'The plugs thread into each combustion chamber and arc a spark across their gap to ignite the air–fuel charge. Insulated wires carry high voltage from the distributor cap to each plug in the firing order.',
    tags: ['ignition', 'electrical', 'tune-up'],
    relatedComponents: ['distributor', 'cylinder_head'],
    failureSymptoms: [
      'Misfire, rough idle, or stumble under load',
      'Hard starting and poor fuel economy',
      'Fouled, worn, or wrongly gapped plugs',
      'Cracked wires arcing to ground (visible at night)',
    ],
    maintenanceNote:
      'Replace plugs at the service interval and set the gap to spec. Route wires away from headers and renew the cap, rotor, and wires as a set.',
  },

  // ── Fuel delivery ────────────────────────────────────────────────────────────
  fuel_pump: {
    id: 'fuel_pump',
    label: 'Fuel Pump',
    subsystemId: 'fuel',
    function:
      'A mechanical pump driven by an eccentric on the camshaft. Its diaphragm draws fuel from the tank and pushes it up the steel line to the carburettor.',
    tags: ['fuel', 'cam-driven', 'moving'],
    relatedComponents: ['carburetor', 'camshaft'],
    failureSymptoms: [
      'Hard starting, stalling, or fuel starvation at speed',
      'Fuel leaking from the diaphragm vent',
      'Oil dilution if the internal diaphragm splits',
      'Low fuel pressure / volume at the carb',
    ],
    maintenanceNote:
      'Test delivery pressure and volume into a container. Check the line and fittings for leaks and the pushrod for wear.',
  },
  oil_filter: {
    id: 'oil_filter',
    label: 'Oil Filter',
    subsystemId: 'block',
    function:
      'A spin-on canister that strains grit and metal particles out of the oil before it reaches the bearings. A bypass valve inside keeps oil flowing if the element ever clogs.',
    tags: ['lubrication', 'filter', 'service'],
    relatedComponents: ['oil_pan', 'engine_block'],
    failureSymptoms: [
      'Low oil pressure from a clogged element',
      'Leaks at the base from a double-gasket or loose filter',
      'Rattle / debris in the oil signalling internal wear',
    ],
    maintenanceNote:
      'Replace with every oil change. Oil the new gasket, hand-tighten about three-quarters of a turn past contact, and check for leaks after start-up.',
  },

  // ── Service detail ───────────────────────────────────────────────────────────
  dipstick: {
    id: 'dipstick',
    label: 'Oil Dipstick',
    subsystemId: 'block',
    function:
      'Slides down a tube into the oil pan so the oil level and condition can be checked. The marks on the blade show the safe operating range.',
    tags: ['lubrication', 'service'],
    relatedComponents: ['oil_pan', 'engine_block'],
    failureSymptoms: [
      'Reading low — engine is down on oil',
      'Milky or fuel-smelling oil on the blade',
      'A blown tube seal letting oil mist escape',
    ],
    maintenanceNote:
      'Check the level on level ground with the engine warm and off. Wipe, reinsert, and read — keep it between the marks.',
  },

  // ── Mounting ─────────────────────────────────────────────────────────────────
  motor_mounts: {
    id: 'motor_mounts',
    label: 'Motor Mounts',
    subsystemId: 'mounting',
    function:
      'Rubber-isolated mounts on each side of the block carry the engine’s weight and react to its torque, while the rubber keeps vibration and noise out of the chassis.',
    tags: ['mounting', 'structural', 'rubber'],
    relatedComponents: ['engine_block'],
    failureSymptoms: [
      'A clunk on shifting or hard acceleration',
      'Extra vibration felt through the car',
      'Cracked, collapsed, or oil-soaked rubber',
      'The engine visibly lifting under throttle',
    ],
    maintenanceNote:
      'Inspect the rubber for cracks and separation, and watch for excess engine lift when loaded. Replace in pairs if one has failed.',
  },

  // ── Fasteners ───────────────────────────────────────────────────────────────
  cover_bolts: {
    id: 'cover_bolts',
    label: 'Valve-Cover Bolts',
    subsystemId: 'fasteners',
    function:
      'Small bolts (often with captive washers/grommets) that clamp the valve cover and its gasket evenly to the cylinder head.',
    tags: ['fastener', 'bolt'],
    relatedComponents: ['valve_cover', 'cylinder_head'],
    failureSymptoms: [
      'Oil leaks where a bolt is loose or missing',
      'Cracked cover from over-torquing',
      'Stripped threads in the head',
    ],
    maintenanceNote:
      'Tighten to a low, even torque in a crisscross pattern — these are easy to overtighten.',
  },
  head_bolts: {
    id: 'head_bolts',
    label: 'Head Bolts',
    subsystemId: 'fasteners',
    function:
      'Long, high-strength bolts that clamp the cylinder head and head gasket to the block and contain combustion pressure.',
    tags: ['fastener', 'bolt', 'critical'],
    relatedComponents: ['cylinder_head', 'engine_block'],
    failureSymptoms: [
      'Blown head gasket from lost clamping force',
      'Coolant/oil mixing',
      'Stretched torque-to-yield bolts',
    ],
    maintenanceNote:
      'Follow the exact tightening sequence and torque-angle stages. Most are torque-to-yield and must be replaced, not reused.',
  },
  pan_bolts: {
    id: 'pan_bolts',
    label: 'Oil-Pan Bolts',
    subsystemId: 'fasteners',
    function:
      'Perimeter bolts that clamp the oil pan and its gasket to the bottom of the block.',
    tags: ['fastener', 'bolt'],
    relatedComponents: ['oil_pan', 'engine_block'],
    failureSymptoms: [
      'Oil weeping past an unevenly torqued flange',
      'Distorted sealing surface from overtightening',
      'Loose bolts from vibration',
    ],
    maintenanceNote:
      'Torque evenly in sequence to a modest spec to keep the thin flange flat.',
  },
  intake_bolts: {
    id: 'intake_bolts',
    label: 'Intake Bolts',
    subsystemId: 'fasteners',
    function:
      'Bolts that clamp the valley intake manifold down to both cylinder heads, sealing the intake and coolant passages.',
    tags: ['fastener', 'bolt'],
    relatedComponents: ['intake_manifold', 'cylinder_head'],
    failureSymptoms: [
      'Vacuum or coolant leak from an uneven clamp',
      'Manifold lift at idle from loose bolts',
    ],
    maintenanceNote:
      'Torque in the factory crisscross sequence, working from the centre outward.',
  },
  bellhousing_bolts: {
    id: 'bellhousing_bolts',
    label: 'Bell-Housing Bolts',
    subsystemId: 'fasteners',
    function:
      'Large bolts/nuts that fasten the bell housing and transmission to the rear of the block, carrying driveline load and keeping the input shaft aligned.',
    tags: ['fastener', 'bolt', 'critical'],
    relatedComponents: ['bell_housing', 'engine_block'],
    failureSymptoms: [
      'Driveline clunk or vibration from loose bolts',
      'Misalignment causing input-shaft bearing wear',
      'Oil leak at the rear main if the housing shifts',
    ],
    maintenanceNote:
      'Torque to spec and check after the first drive cycles. Use thread-locker on the upper hardware.',
  },

  // ── Driveline ────────────────────────────────────────────────────────────────
  flywheel: {
    id: 'flywheel',
    label: 'Flywheel',
    subsystemId: 'driveline',
    function:
      'A heavy steel disc bolted to the rear of the crankshaft. It smooths power pulses, carries the starter ring gear, and provides the clutch friction surface.',
    tags: ['driveline', 'rotating'],
    relatedComponents: ['crankshaft', 'bell_housing'],
    failureSymptoms: [
      'Grinding on start from worn ring-gear teeth',
      'Clutch chatter or hot-spotting / cracks',
      'Vibration if the flywheel is unbalanced',
    ],
    maintenanceNote:
      'Resurface or replace when scored. Always replace the rear main seal and pilot bearing while it’s off.',
  },
  bell_housing: {
    id: 'bell_housing',
    label: 'Bell Housing',
    subsystemId: 'driveline',
    function:
      'The bell-shaped casting that bolts to the back of the block, encloses the flywheel and clutch, and mates the engine to the transmission — turning the engine into a complete motor.',
    tags: ['driveline', 'structural'],
    relatedComponents: ['flywheel', 'engine_block', 'bellhousing_bolts'],
    failureSymptoms: [
      'Misalignment causing gear whine or hard shifting',
      'Cracks from a clutch or flywheel explosion',
      'Leaks tracking from the rear main seal',
    ],
    maintenanceNote:
      'Check bore and face runout with a dial indicator when chasing alignment issues. Keep the dust cover in place.',
  },
  starter: {
    id: 'starter',
    label: 'Starter Motor',
    subsystemId: 'driveline',
    function:
      'Bolted low on the bell housing, the starter throws its small gear into the flywheel ring gear and spins the engine fast enough to fire. The solenoid on top both engages the gear and switches the heavy current.',
    tags: ['driveline', 'electrical', 'cranking'],
    relatedComponents: ['flywheel', 'bell_housing'],
    failureSymptoms: [
      'A single click or nothing when you turn the key',
      'Grinding from a worn drive or ring gear',
      'Slow, laboured cranking (worn motor or bad connection)',
      'Starter stays engaged / whirs without cranking',
    ],
    maintenanceNote:
      'Check the battery and cable connections first. Test current draw, and inspect the drive gear and ring-gear teeth for wear.',
  },
};

export const COMPONENT_LIST = Object.values(COMPONENTS);
