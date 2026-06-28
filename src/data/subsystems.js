/**
 * Sub-assembly ("system") definitions for the active assembly — the inline-4
 * engine. Each entry groups the part mesh names that belong together so the
 * Systems tab can isolate / highlight a whole sub-assembly.
 *
 * The previous whole-vehicle data set is preserved in ./vehicle_archive for when
 * the rest of the car is brought back online.
 */

export const SUBSYSTEMS = {
  block: {
    id: 'block',
    label: 'Short Block',
    color: '#e74c3c',
    highlightColor: '#ff6b6b',
    description:
      'The cylinder block is the engine’s main structure. It houses the cylinder bores, the crankshaft, and the pistons, and is sealed at the bottom by the oil pan.',
    meshNames: ['engine_block', 'oil_pan', 'crankshaft', 'pistons', 'dipstick', 'oil_filter', 'senders'],
    explodeOffset: [0, 0, 0],
  },
  head: {
    id: 'head',
    label: 'Heads & Valvetrain',
    color: '#3498db',
    highlightColor: '#74b9ff',
    description:
      'A cylinder head caps each bank of the V, sealing the bores and carrying the valves. In this OHV V8 the camshaft sits in the block valley and works the valves through pushrods; chrome valve covers keep the oil in.',
    meshNames: ['cylinder_head', 'camshaft', 'valve_cover', 'valvetrain'],
    explodeOffset: [0, 0.8, 0],
  },
  intake: {
    id: 'intake',
    label: 'Induction',
    color: '#2ecc71',
    highlightColor: '#55efc4',
    description:
      'Air enters through the round air cleaner, mixes with fuel in the carburettor, and the valley intake manifold distributes the charge to both banks. The distributor at the rear fires the plugs in order.',
    meshNames: ['intake_manifold', 'carburetor', 'air_cleaner', 'forced_induction', 'distributor', 'pcv_breather', 'throttle_linkage'],
    explodeOffset: [0, 0.4, 1.2],
  },
  exhaust: {
    id: 'exhaust',
    label: 'Exhaust',
    color: '#95a5a6',
    highlightColor: '#b2bec3',
    description:
      'Tubular headers collect spent gases from each bank’s exhaust ports and merge them into a collector under each side of the engine.',
    meshNames: ['exhaust_manifold'],
    explodeOffset: [0, 0.2, -1.2],
  },
  driveline: {
    id: 'driveline',
    label: 'Driveline',
    color: '#9b59b6',
    highlightColor: '#a29bfe',
    description:
      'The flywheel bolts to the back of the crankshaft and the bell housing encloses it, mating the engine to the transmission. This is where the engine becomes a complete "motor".',
    meshNames: ['bell_housing', 'flywheel', 'starter'],
    explodeOffset: [-1.5, 0, 0],
  },
  cooling: {
    id: 'cooling',
    label: 'Cooling & Belt Drive',
    color: '#00cec9',
    highlightColor: '#81ecec',
    description:
      'The water pump on the nose of the block circulates coolant, the engine-driven fan pulls air through the radiator, and a single V-belt off the crank pulley spins the pump and alternator together.',
    meshNames: ['water_pump', 'cooling_fan', 'drive_belt', 'thermostat'],
    explodeOffset: [2.8, 0.2, 0],
  },
  charging: {
    id: 'charging',
    label: 'Charging',
    color: '#e17055',
    highlightColor: '#fab1a0',
    description:
      'The belt-driven alternator generates current to run the ignition and accessories and to keep the battery charged while the engine is running.',
    meshNames: ['alternator'],
    explodeOffset: [2.0, 1.4, 0.4],
  },
  ignition: {
    id: 'ignition',
    label: 'Ignition',
    color: '#e056fd',
    highlightColor: '#d980fa',
    description:
      'The distributor sends high-voltage spark out through eight plug wires to the spark plugs threaded into the heads, firing each cylinder in the engine’s firing order.',
    meshNames: ['spark_plugs', 'distributor', 'vacuum_advance'],
    explodeOffset: [0, 2.4, 0],
  },
  fuel: {
    id: 'fuel',
    label: 'Fuel Delivery',
    color: '#fdcb6e',
    highlightColor: '#ffeaa7',
    description:
      'A camshaft-driven mechanical pump draws fuel from the tank and pushes it up the steel line to the carburettor float bowls.',
    meshNames: ['fuel_pump', 'carburetor'],
    explodeOffset: [2.0, -0.6, 0],
  },
  mounting: {
    id: 'mounting',
    label: 'Engine Mounts',
    color: '#7f8c8d',
    highlightColor: '#b2bec3',
    description:
      'Rubber-isolated mounts carry the engine’s weight and the twist of its torque while keeping vibration out of the chassis. A bracket bolts to each side of the block and lands on a frame perch.',
    meshNames: ['motor_mounts'],
    explodeOffset: [0, -1.8, 0],
  },
  fasteners: {
    id: 'fasteners',
    label: 'Bolts & Nuts',
    color: '#f1c40f',
    highlightColor: '#ffeaa7',
    description:
      'Every threaded fastener that holds the engine together — valve-cover, head, intake, oil-pan, and bell-housing hardware. Isolate this system to see all the bolts and nuts on their own.',
    meshNames: ['cover_bolts', 'head_bolts', 'intake_bolts', 'pan_bolts', 'bellhousing_bolts'],
    explodeOffset: [0, 1.2, 0],
  },
};

export const SUBSYSTEM_LIST = Object.values(SUBSYSTEMS);
