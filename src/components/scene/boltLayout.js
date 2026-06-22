/**
 * Bolt-pattern helpers shared by assemblies. Kept out of the fastener component
 * file so that module only exports components.
 */

/** Six points spread around the top (+Y) face of a rectangle (cover/head patterns). */
export function boltRect(halfX, halfZ, y = 0) {
  return [
    [-halfX, y, -halfZ],
    [0, y, -halfZ],
    [halfX, y, -halfZ],
    [halfX, y, halfZ],
    [0, y, halfZ],
    [-halfX, y, halfZ],
  ];
}
