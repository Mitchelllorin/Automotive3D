/**
 * Selection/hover/isolate context shared between a <Part> and the <Surface>
 * meshes inside it. Kept in its own module so the component files only export
 * components (clean React Fast-Refresh boundaries).
 */
import { createContext } from 'react';

export const PartContext = createContext({
  selected: false,
  hovered: false,
  highlight: '#58a6ff',
  // Active variant material override (Garage swap) for this part, or null. Only
  // <Surface swap> meshes apply it — see Part.jsx / data/products.js.
  look: null,
  // Note: opacity/dimming is applied imperatively by <Part> per frame (system
  // fade + depth-aware fade), not through this context — see Part.jsx.
});
