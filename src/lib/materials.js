/**
 * Named PBR material presets for engine parts.
 *
 * Instead of every <Surface> guessing its own metalness/roughness, parts pull a
 * named material here. Each preset is tuned for how that real material reads
 * under the studio lighting: cast surfaces are rough and barely reflective,
 * machined faces are tighter, chrome is a near-mirror. `finish` selects the
 * procedural normal/albedo/roughness maps from textures.js.
 */
export const MATERIALS = {
  // Painted cast-iron block (classic Chevy orange) — slightly chalky, low metal.
  paintedBlock: { color: '#bf4a1e', metalness: 0.2, roughness: 0.58, envMapIntensity: 0.6, finish: 'matte' },
  paintedBlockDk: { color: '#9c3b13', metalness: 0.2, roughness: 0.62, envMapIntensity: 0.6, finish: 'matte' },

  // Bare cast iron (headers, bell housing, brackets) — dark, rough, oxidised.
  castIron: { color: '#56595e', metalness: 0.45, roughness: 0.74, envMapIntensity: 0.7, finish: 'rough' },

  // Cast aluminium (intake, water pump, alternator, carb) — satin grey.
  castAluminum: { color: '#b4b9c1', metalness: 0.6, roughness: 0.5, envMapIntensity: 1.0, finish: 'matte' },
  // Machined aluminium face — tighter, brighter.
  machinedAlu: { color: '#c6cbd2', metalness: 0.78, roughness: 0.3, envMapIntensity: 1.15, finish: 'machined' },

  // Steel — fasteners, shafts, pushrods, springs.
  steel: { color: '#a9afb8', metalness: 0.82, roughness: 0.34, envMapIntensity: 1.1, finish: 'machined' },
  machinedSteel: { color: '#c2c7ce', metalness: 0.88, roughness: 0.24, envMapIntensity: 1.2, finish: 'machined' },

  // Chrome dress-up (valve covers, air cleaner) — near mirror.
  chrome: { color: '#eef2f6', metalness: 1.0, roughness: 0.07, envMapIntensity: 1.7, finish: 'smooth' },

  // Rubber (hoses, boots, isolators).
  rubber: { color: '#15171c', metalness: 0.08, roughness: 0.92, envMapIntensity: 0.4, finish: 'rubber' },

  // Misc.
  plastic: { color: '#26282e', metalness: 0.1, roughness: 0.6, envMapIntensity: 0.6, finish: 'matte' },
  brass: { color: '#b9892f', metalness: 0.85, roughness: 0.35, envMapIntensity: 1.1, finish: 'machined' },
  copper: { color: '#b5683b', metalness: 0.9, roughness: 0.3, envMapIntensity: 1.15, finish: 'machined' },
  ceramic: { color: '#ece7da', metalness: 0.04, roughness: 0.45, envMapIntensity: 0.5, finish: 'matte' },
};
