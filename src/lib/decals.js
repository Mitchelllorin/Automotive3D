/**
 * Canvas-generated text textures for engine markings — cast part numbers,
 * stampings, labels. Self-contained (no font fetch): uses the browser's own
 * system fonts via a 2D canvas, baked into a texture.
 */
import * as THREE from 'three';

export function textTexture(
  text,
  { w = 1024, h = 256, font = 'bold 120px Arial, sans-serif', color = '#3a3029', letterSpacing = 8 } = {}
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${letterSpacing}px`;
  // Slight emboss: light highlight under, dark text over, to read as cast relief.
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillText(text, w / 2, h / 2 + 3);
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
