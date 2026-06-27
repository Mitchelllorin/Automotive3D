/**
 * productThumb – a clean, brand-tinted placeholder thumbnail generated as an
 * inline SVG data-URI. Used by the Garage storefront cards so a product slot
 * always renders something believable even before a real product photo is
 * dropped into the variant's `image` field (a real URL always wins over this).
 *
 * Deliberately abstract — a tinted card with the brand mark and part name — so
 * it reads as "product slot" without faking a specific copyrighted photo.
 */

/** Darken/lighten a #rrggbb hex by `amt` (−1..1) for the gradient stops. */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt)));
  const b = Math.max(0, Math.min(255, (n & 255) + Math.round(255 * amt)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Build a 220×150 SVG thumbnail. `tint` is the brand/part accent colour,
 * `brand` the short mark, `name` an optional product line under it.
 */
export function productThumb({ tint = '#5a6472', brand = '', name = '' } = {}) {
  const a = shade(tint, 0.12);
  const b = shade(tint, -0.28);
  const initials = esc(brand.slice(0, 14).toUpperCase());
  const sub = esc(name.slice(0, 22));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150" viewBox="0 0 220 150">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="220" height="150" rx="10" fill="url(#g)"/>
  <circle cx="110" cy="60" r="40" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  <circle cx="110" cy="60" r="20" fill="rgba(0,0,0,0.18)"/>
  <text x="110" y="118" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="1.5" fill="#ffffff">${initials}</text>
  <text x="110" y="136" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.78)">${sub}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
