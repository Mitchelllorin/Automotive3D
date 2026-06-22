/**
 * Fault definitions for the active assembly (inline-4 engine).
 * Each fault references a sub-assembly (SUBSYSTEMS key) and the part it affects.
 *
 * The whole-vehicle fault set is preserved in ./vehicle_archive.
 */

export const FAULTS = {
  blown_head_gasket: {
    id: 'blown_head_gasket',
    label: 'Blown Head Gasket',
    subsystem: 'head',
    affectedMesh: 'cylinder_head',
    severity: 'critical',
    shortDescription: 'The seal between the head and block has failed.',
    explanation:
      'The head gasket seals combustion, coolant, and oil passages between the cylinder head and block. When it fails — usually after overheating — combustion gases, coolant, and oil mix. Symptoms include white sweet-smelling exhaust smoke, overheating, milky oil, and bubbles in the coolant.',
    animationType: 'pulse_red',
    dtcCode: 'P0301',
  },
  low_compression: {
    id: 'low_compression',
    label: 'Low Compression',
    subsystem: 'block',
    affectedMesh: 'pistons',
    severity: 'warning',
    shortDescription: 'A cylinder is no longer sealing the combustion charge.',
    explanation:
      'Compression is lost when the piston rings, valves, or head gasket no longer seal a cylinder. The engine runs rough, down on power, and may misfire. A compression or leak-down test isolates whether the leak is past the rings, the valves, or the gasket.',
    animationType: 'flicker',
    dtcCode: 'P0301',
  },
  oil_leak: {
    id: 'oil_leak',
    label: 'Oil Pan Leak',
    subsystem: 'block',
    affectedMesh: 'oil_pan',
    severity: 'warning',
    shortDescription: 'Engine oil is escaping at the oil-pan seal.',
    explanation:
      'A hardened pan gasket, a loose drain plug, or unevenly torqued pan bolts let oil weep out. Left unchecked, dropping oil level risks bearing damage. Clean the area, find the highest wet point, and reseal.',
    animationType: 'fade_out',
    dtcCode: '—',
  },
  exhaust_leak: {
    id: 'exhaust_leak',
    label: 'Exhaust Manifold Leak',
    subsystem: 'exhaust',
    affectedMesh: 'exhaust_manifold',
    severity: 'warning',
    shortDescription: 'Exhaust is escaping before the manifold outlet.',
    explanation:
      'A cracked manifold, a failed gasket, or loose/seized nuts let exhaust escape at the head. You hear a ticking that is loudest on a cold start, may smell fumes, and can trigger lean fuel-trim codes from upstream air. Re-torque or replace the gasket and nuts.',
    animationType: 'flicker',
    dtcCode: 'P0171',
  },
  loose_fasteners: {
    id: 'loose_fasteners',
    label: 'Loose Head Bolts',
    subsystem: 'fasteners',
    affectedMesh: 'head_bolts',
    severity: 'critical',
    shortDescription: 'Head clamping force has dropped below spec.',
    explanation:
      'Head bolts clamp the head and gasket against combustion pressure. If they lose torque — from improper installation, stretch, or skipped re-torque — clamping force falls and the head gasket fails. Torque-to-yield bolts must be replaced and tightened in the correct sequence and angle stages.',
    animationType: 'spark',
    dtcCode: 'P0301',
  },
};

export const FAULT_LIST = Object.values(FAULTS);
