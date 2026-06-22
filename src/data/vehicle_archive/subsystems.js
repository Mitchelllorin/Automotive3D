/**
 * Subsystem definitions for the Automotive3D MVP.
 * Each subsystem includes display info, colour, and which mesh names belong to it.
 */

export const SUBSYSTEMS = {
  engine: {
    id: 'engine',
    label: 'Engine',
    color: '#e74c3c',
    highlightColor: '#ff6b6b',
    description:
      'The internal combustion engine converts fuel into mechanical energy through a series of controlled explosions inside its cylinders.',
    meshNames: ['engine_block', 'pistons', 'crankshaft', 'camshaft', 'valves'],
    explodeOffset: [0, 0.8, 0],
  },
  cooling: {
    id: 'cooling',
    label: 'Cooling',
    color: '#3498db',
    highlightColor: '#74b9ff',
    description:
      'The cooling system maintains optimal engine temperature by circulating coolant through the engine block and radiator.',
    meshNames: ['radiator', 'water_pump', 'thermostat', 'coolant_hoses', 'fan'],
    explodeOffset: [1.2, 0.4, 0],
  },
  electrical: {
    id: 'electrical',
    label: 'Electrical',
    color: '#f1c40f',
    highlightColor: '#ffeaa7',
    description:
      'The electrical system powers all electronic components. It includes the battery, alternator, fuses, and wiring harness.',
    meshNames: ['battery', 'alternator', 'fuse_box', 'starter_motor', 'wiring'],
    explodeOffset: [-1.2, 0.4, 0],
  },
  fuel: {
    id: 'fuel',
    label: 'Fuel',
    color: '#e67e22',
    highlightColor: '#fdcb6e',
    description:
      'The fuel system delivers a precise air–fuel mixture to the engine. It includes the tank, fuel pump, injectors, and throttle body.',
    meshNames: ['fuel_tank', 'fuel_pump', 'fuel_injectors', 'throttle_body', 'fuel_lines'],
    explodeOffset: [0, -0.6, -1.2],
  },
  exhaust: {
    id: 'exhaust',
    label: 'Exhaust',
    color: '#95a5a6',
    highlightColor: '#b2bec3',
    description:
      'The exhaust system routes combustion gases away from the engine, reduces noise, and filters harmful emissions via the catalytic converter.',
    meshNames: ['exhaust_manifold', 'catalytic_converter', 'muffler', 'exhaust_pipe', 'o2_sensor'],
    explodeOffset: [0, -0.6, 1.2],
  },
  suspension: {
    id: 'suspension',
    label: 'Suspension',
    color: '#9b59b6',
    highlightColor: '#a29bfe',
    description:
      'The suspension system supports the vehicle weight, absorbs road shocks, and maintains tire contact with the road surface.',
    meshNames: ['struts', 'control_arms', 'sway_bar', 'springs', 'wheel_hubs'],
    explodeOffset: [0, -1.4, 0],
  },
};

export const SUBSYSTEM_LIST = Object.values(SUBSYSTEMS);
