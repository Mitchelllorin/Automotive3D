/**
 * Assembly registry – the extension point for everything that comes after the
 * engine. Each entry describes a self-contained 3D assembly plus the camera
 * framing and data set it should use. To add the rest of the vehicle later,
 * create another assembly component and register it here; the scene and sidebar
 * read whatever the active assembly declares.
 */
import EngineAssembly from './engine/EngineAssembly';
import Inline4Assembly from './inline4/Inline4Assembly';

export const ASSEMBLIES = {
  engine: {
    id: 'engine',
    label: 'Small-Block V8',
    Component: EngineAssembly,
    // Camera framing tuned to the V8's footprint (~2.6 long, bell housing at rear).
    camera: { position: [5.2, 3.2, 5.6], target: [0, 0.45, 0], min: 3.5, max: 28, fov: 42 },
    ground: -1.5,
  },

  inline4: {
    id: 'inline4',
    label: 'Turbo Inline-4',
    Component: Inline4Assembly,
    // Tighter, taller footprint than the V8 — frame a bit closer and lower.
    camera: { position: [4.4, 2.8, 4.8], target: [0, 0.35, 0], min: 3, max: 26, fov: 42 },
    ground: -1.2,
  },

  // Future: full vehicle, transmission, suspension corner, etc.
};

export const DEFAULT_ASSEMBLY = 'engine';

export function getAssembly(id) {
  return ASSEMBLIES[id] ?? ASSEMBLIES[DEFAULT_ASSEMBLY];
}
