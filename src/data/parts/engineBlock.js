/**
 * engineBlock.js — the engine block as a shoppable, swappable part.
 *
 * The block itself is product-placement real estate (your point), so it's its own
 * category of branded parts — and it's *imported* through the catalog API rather
 * than hand-wired, which is the whole point of the new infrastructure: this file
 * is what "adding a part pack" looks like.
 *
 * Mechanically the block sets how much abuse the bottom end can take before it
 * lets go — a stronger casting (4-bolt / splayed mains / thick decks) survives
 * more over-rev in the Arena. That `strength` feeds F.U.S.E.'s thrown-rod model
 * (see lib/engineStress.js + lib/fuse.js), so choosing a better block literally
 * wins durability battles.
 */
import { registerCategory, importParts } from '../catalog';

const buy = (q) => `https://www.rockauto.com/en/catalog/?partfilter=${encodeURIComponent(q)}`;

registerCategory('engine_block', 'Engine Block');

importParts('engine_block', [
  {
    id: 'gm-iron-2bolt', brand: 'GM', name: 'Stock Iron 2-Bolt (Stock)', oem: true,
    tint: '#9aa0a8', sku: 'GM-10105123', price: 395, rating: 4.2, reviews: 180,
    spec: 'cast iron · 2-bolt main · stock deck',
    blurb: 'The factory casting — bulletproof for stock power, but the 2-bolt mains walk under serious over-rev.',
    perf: { strength: 1.0 },
    buyUrl: buy('SBC 350 bare block'),
  },
  {
    id: 'dart-shp', brand: 'Dart', name: 'SHP 4-Bolt', tint: '#b5651d',
    sku: 'DAR-31161111', price: 1899, rating: 4.9, reviews: 640,
    spec: 'iron · splayed 4-bolt mains · 4.125" max bore · thick decks',
    blurb: 'Sportsman High-Performance block — splayed 4-bolt mains and priority main oiling. Takes a real beating.',
    perf: { strength: 1.28 },
    buyUrl: buy('Dart SHP small block chevy'),
  },
  {
    id: 'world-motown', brand: 'World', name: 'Motown Race', tint: '#8a9097',
    sku: 'WLD-085030', price: 2499, rating: 4.8, reviews: 310,
    spec: 'iron · 4-bolt · race decks · 4.180" max bore',
    blurb: 'Motown race block — siamesed bores and heavy mains for the highest-rpm, highest-boost builds.',
    perf: { strength: 1.45 },
    buyUrl: buy('World Products Motown block'),
  },
]);
