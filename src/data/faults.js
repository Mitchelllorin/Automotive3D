/**
 * Fault definitions for the Automotive3D MVP.
 * Each fault maps to an affected subsystem and provides display information.
 */

export const FAULTS = {
  misfire: {
    id: 'misfire',
    label: 'Misfire',
    subsystem: 'engine',
    affectedMesh: 'pistons',
    severity: 'warning',
    shortDescription: 'One or more cylinders fail to ignite properly.',
    explanation:
      'A misfire occurs when the air–fuel mixture in a cylinder does not ignite at the right time. Common causes include worn spark plugs, a faulty ignition coil, or a bad fuel injector. You may notice rough idling, hesitation during acceleration, and increased fuel consumption.',
    animationType: 'flicker',
    dtcCode: 'P030X',
  },
  overheating: {
    id: 'overheating',
    label: 'Overheating',
    subsystem: 'cooling',
    affectedMesh: 'radiator',
    severity: 'critical',
    shortDescription: 'Engine coolant temperature rises beyond safe limits.',
    explanation:
      'Overheating happens when the cooling system cannot dissipate heat fast enough. Causes include a failed water pump, blocked radiator, low coolant level, or stuck thermostat. Left unchecked it can warp cylinder heads or seize the engine.',
    animationType: 'pulse_red',
    dtcCode: 'P0217',
  },
  dead_battery: {
    id: 'dead_battery',
    label: 'Dead Battery',
    subsystem: 'electrical',
    affectedMesh: 'battery',
    severity: 'critical',
    shortDescription: 'Battery voltage too low to start or sustain the vehicle.',
    explanation:
      'A dead battery can result from leaving lights on, a faulty charging system, extreme temperatures, or a battery past its service life. Symptoms include a slow crank, dim lights, or complete electrical failure.',
    animationType: 'fade_out',
    dtcCode: 'B1000',
  },
  blown_fuse: {
    id: 'blown_fuse',
    label: 'Blown Fuse',
    subsystem: 'electrical',
    affectedMesh: 'fuse_box',
    severity: 'warning',
    shortDescription: 'A fuse has opened due to excessive current.',
    explanation:
      'Fuses protect circuits from overcurrent damage. A blown fuse disconnects the affected circuit entirely. Common causes are short circuits, overloaded accessories, or incorrect replacement fuses. The circuit will remain inoperative until the fuse is replaced.',
    animationType: 'spark',
    dtcCode: 'B1001',
  },
  bad_o2_sensor: {
    id: 'bad_o2_sensor',
    label: 'Bad O₂ Sensor',
    subsystem: 'exhaust',
    affectedMesh: 'o2_sensor',
    severity: 'warning',
    shortDescription: 'Oxygen sensor sending incorrect readings to the ECU.',
    explanation:
      'The oxygen (lambda) sensor measures exhaust gas composition to help the ECU maintain the ideal air–fuel ratio. A faulty sensor causes the ECU to run the engine too rich or too lean, increasing emissions and fuel consumption. The check-engine light will illuminate.',
    animationType: 'flicker',
    dtcCode: 'P0136',
  },
};

export const FAULT_LIST = Object.values(FAULTS);
