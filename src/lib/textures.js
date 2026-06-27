/**
 * Procedural surface textures for the engine — generated in code, no asset
 * files or network fetches (matching the self-contained StudioRig lighting).
 *
 * This is a full procedural PBR set: each finish carries a *normal* map (proper
 * tangent-space lighting, not the cruder height-only bump), a subtle *albedo*
 * map that mottles the otherwise-flat base colour (cast grain, brushing, grime),
 * and a *roughness* map so highlights break up the way real metal does. The maps
 * are derived from a handful of shared noise fields built once at module load.
 */
import * as THREE from 'three';

const SIZE = 384; // procedural map resolution — crisper cast grain on big surfaces

/** Small, fast, repeatable PRNG so the grain looks the same every reload. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth fractal value-noise in [0,1], summed over a few octaves. */
function fbm(size, octaves, seed) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(size * size);
  let amp = 1;
  let ampSum = 0;
  for (let o = 0; o < octaves; o++) {
    const cells = 2 ** (o + 2); // 4, 8, 16, 32, 64…
    const stride = cells + 1;
    const lat = new Float32Array(stride * stride);
    for (let i = 0; i < lat.length; i++) lat[i] = rnd();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * cells;
        const gy = (y / size) * cells;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx); // smoothstep
        const sy = fy * fy * (3 - 2 * fy);
        const v00 = lat[y0 * stride + x0];
        const v10 = lat[y0 * stride + x0 + 1];
        const v01 = lat[(y0 + 1) * stride + x0];
        const v11 = lat[(y0 + 1) * stride + x0 + 1];
        const vx0 = v00 + (v10 - v00) * sx;
        const vx1 = v01 + (v11 - v01) * sx;
        out[y * size + x] += amp * (vx0 + (vx1 - vx0) * sy);
      }
    }
    ampSum += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= ampSum;
  return out;
}

/** Horizontal brushing: nearly constant along each row, fine sparkle on top. */
function brushed(size, seed) {
  const rnd = mulberry32(seed);
  const rows = new Float32Array(size);
  for (let y = 0; y < size; y++) rows[y] = rnd();
  // Blur the rows a little so the lines aren't pure static.
  const blur = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    blur[y] = (rows[(y - 1 + size) % size] + rows[y] * 2 + rows[(y + 1) % size]) / 4;
  }
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      out[y * size + x] = blur[y] * 0.7 + 0.15 + rnd() * 0.08;
    }
  }
  return out;
}

/** Pure high-frequency speckle for rubber. */
function speckle(size, seed) {
  const rnd = mulberry32(seed);
  const out = new Float32Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = rnd();
  return out;
}

/** Shared DataTexture setup (wrapping, mips, anisotropy). */
function configure(tex, repeat) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Pack a [0,1] heightfield into a tiling grayscale data map (roughness/etc.). */
function toData(values, size, repeat = [3, 3]) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < values.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(values[i] * 255)));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace; // data, not colour
  return configure(tex, repeat);
}

/**
 * Derive a tangent-space normal map from a height field via a Sobel gradient.
 * `strength` scales how steep the perturbation reads under the studio lights.
 */
function toNormal(values, size, strength, repeat = [3, 3]) {
  const at = (x, y) => values[((y + size) % size) * size + ((x + size) % size)];
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sobel kernels over the height field.
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
      const gx = tl + 2 * l + bl - (tr + 2 * r + br);
      const gy = tl + 2 * t + tr - (bl + 2 * b + br);
      let nx = gx * strength;
      let ny = gy * strength;
      const nz = 1;
      const inv = 1 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      const i = (y * size + x) * 4;
      data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace; // normals are data
  return configure(tex, repeat);
}

/**
 * Albedo variation map: a near-white sRGB texture that *multiplies* the base
 * material colour, so a flat tint picks up mottling/grime without changing hue.
 * `lo` is how dark the deepest grime gets (1 = no darkening).
 */
function toAlbedo(values, size, lo, repeat = [3, 3]) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < values.length; i++) {
    const m = lo + values[i] * (1 - lo);
    const v = Math.max(0, Math.min(255, Math.round(m * 255)));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace; // multiplies the colour, so it's colour
  return configure(tex, repeat);
}

// Remap cast grain into a gentle roughness multiplier (stays near 1 so it only
// *varies* the base roughness rather than slashing it).
function toRoughness(values, size, repeat = [3, 3]) {
  const r = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) r[i] = 0.82 + values[i] * 0.18;
  return toData(r, size, repeat);
}

const castField = fbm(SIZE, 5, 0x1a2b3c);
const brushField = brushed(SIZE, 0x77aa33);
const speckleField = speckle(SIZE, 0x9e4422);

/** Shared texture set, built once at module load (browser-only SPA). */
export const ENGINE_TEXTURES = {
  // Cast metal (block, heads): mottled grain + uneven sand-cast normals.
  castNormal: toNormal(castField, SIZE, 2.2, [3, 3]),
  castAlbedo: toAlbedo(castField, SIZE, 0.72, [3, 3]),
  castRough: toRoughness(castField, SIZE, [3, 3]),
  // Finer, subtler cast grain — for painted enamel (paint fills most of the sand
  // texture) and for machined-then-cast faces. Tiles tighter so big surfaces
  // don't read as low-frequency "bark" blotches.
  castNormalFine: toNormal(castField, SIZE, 1.2, [9, 9]),
  castAlbedoFine: toAlbedo(castField, SIZE, 0.9, [9, 9]),
  castRoughFine: toRoughness(castField, SIZE, [9, 9]),
  // Machined / brushed faces: fine directional lines.
  brushedNormal: toNormal(brushField, SIZE, 1.1, [3, 4]),
  brushedAlbedo: toAlbedo(brushField, SIZE, 0.86, [3, 4]),
  brushedRough: toRoughness(brushField, SIZE, [3, 4]),
  // Rubber (hoses, boots, isolators): dense fine speckle.
  rubberNormal: toNormal(speckleField, SIZE, 0.8, [6, 6]),
  rubberAlbedo: toAlbedo(speckleField, SIZE, 0.8, [6, 6]),
};

/**
 * Finish presets consumed by <Surface finish="…">. Each maps to a normal map
 * (+ scale), an albedo variation map, and a roughness map. `smooth` is left
 * bare for chrome/glass so reflections stay mirror-clean.
 */
export const FINISHES = {
  matte: {
    normalMap: ENGINE_TEXTURES.castNormal,
    normalScale: [0.55, 0.55],
    map: ENGINE_TEXTURES.castAlbedo,
    roughnessMap: ENGINE_TEXTURES.castRough,
  },
  rough: {
    normalMap: ENGINE_TEXTURES.castNormal,
    normalScale: [1.1, 1.1],
    map: ENGINE_TEXTURES.castAlbedo,
    roughnessMap: ENGINE_TEXTURES.castRough,
  },
  machined: {
    normalMap: ENGINE_TEXTURES.brushedNormal,
    normalScale: [0.3, 0.3],
    map: ENGINE_TEXTURES.brushedAlbedo,
    roughnessMap: ENGINE_TEXTURES.brushedRough,
  },
  rubber: {
    normalMap: ENGINE_TEXTURES.rubberNormal,
    normalScale: [0.7, 0.7],
    map: ENGINE_TEXTURES.rubberAlbedo,
  },
  // Engine enamel over a sand casting: real automotive paint is a semi-gloss
  // *clearcoated* layer — a wet sheen on top of the colour — that still lets the
  // orange-peel of the sand casting read through underneath. The clearcoat gives
  // the block that "freshly painted metal" look instead of dry plastic; the
  // normals are kept light so the grain only whispers through the gloss.
  painted: {
    normalMap: ENGINE_TEXTURES.castNormalFine,
    normalScale: [0.4, 0.4],
    map: ENGINE_TEXTURES.castAlbedoFine,
    roughnessMap: ENGINE_TEXTURES.castRoughFine,
    clearcoat: 0.28,
    clearcoatRoughness: 0.6,
  },
  // Bare cast iron, finer/subtler than `rough` — machined-then-cast faces,
  // bellhousing flanges, raised casting-number pads.
  castFine: {
    normalMap: ENGINE_TEXTURES.castNormalFine,
    normalScale: [0.6, 0.6],
    map: ENGINE_TEXTURES.castAlbedoFine,
    roughnessMap: ENGINE_TEXTURES.castRoughFine,
  },
  smooth: {},
};
