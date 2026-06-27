/**
 * catalog.js — the part import/registration infrastructure.
 *
 * Instead of every branded part being hand-written into one giant object, parts
 * (and whole categories) are *registered* into the catalog from data. That makes
 * the parts system extensible the same way the engine registry makes motors
 * extensible: add a part — or import a pack of them from an external source — by
 * calling registerPart, not by editing the model. Mirrors the registerComponentType
 * pattern F.U.S.E. uses in CircuiTry3D, so the two apps share the same shape.
 *
 *   registerCategory('engine_block', 'Engine Block')
 *   registerPart('engine_block', { id, brand, name, price, perf, buyUrl, … })
 *   importParts('carburetor', [ …variants ])   // bulk
 *
 * Everything funnels through normalizePart so an imported variant is always
 * well-formed (sane defaults for rating/reviews/price/perf), and the live garage,
 * dyno, and F.U.S.E. pick it up with no further wiring.
 */
import { PRODUCTS, SWAPPABLE } from './products';

/** Fill in safe defaults so a registered/imported variant is always complete. */
export function normalizePart(variant) {
  if (!variant || !variant.id) {
    throw new Error('registerPart: a variant needs at least an { id }');
  }
  return {
    brand: 'Generic',
    name: variant.id,
    rating: 4.5,
    reviews: 0,
    price: 0,
    oem: false,
    tint: '#5a6472',
    ...variant,
    perf: variant.perf ?? {},
  };
}

/** Ensure a category exists in the catalog (and is flagged swappable). */
export function registerCategory(id, label) {
  if (!PRODUCTS[id]) {
    PRODUCTS[id] = { label: label ?? id, variants: [] };
  } else if (label) {
    PRODUCTS[id].label = label;
  }
  SWAPPABLE.add(id);
  return PRODUCTS[id];
}

/** Register one branded part into a category (creating the category if needed). */
export function registerPart(category, variant, { label } = {}) {
  const cat = registerCategory(category, label ?? PRODUCTS[category]?.label);
  const v = normalizePart(variant);
  // Replace an existing variant with the same id (re-import / override), else add.
  const i = cat.variants.findIndex((existing) => existing.id === v.id);
  if (i >= 0) cat.variants[i] = v;
  else cat.variants.push(v);
  return v;
}

/** Bulk-import a list of variants into a category. */
export function importParts(category, variants, opts) {
  variants.forEach((v) => registerPart(category, v, opts));
}
