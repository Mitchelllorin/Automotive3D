/**
 * ComponentDetail – rich info panel for the currently selected component.
 * Shows function description, tags, failure symptoms, related parts, and
 * maintenance note. Related components are clickable to navigate between parts.
 */
import { useEffect, useMemo, useState } from 'react';
import useAppStore from '../../store/appStore';
import { COMPONENTS } from '../../data/components';
import { SUBSYSTEMS } from '../../data/subsystems';
import { productThumb } from '../../lib/productThumb';
import { computeDyno } from '../../lib/dyno';
import { getEngine } from '../../data/engines';
import { commerceEnabled, buyLink } from '../../data/affiliate';

/**
 * ProductImage – shows the real bundled product photo (public/products/<id>.jpg,
 * or an explicit variant.image URL) and falls back to a brand-tinted generated
 * thumbnail if that asset is missing, so a card is never broken.
 */
function ProductImage({ componentId, variant }) {
  const localFor = (v) =>
    v.image || `${import.meta.env.BASE_URL}products/${componentId}__${v.id}.jpg`;
  const [src, setSrc] = useState(localFor(variant));
  // Reset to the real photo whenever the active variant changes.
  useEffect(() => {
    setSrc(localFor(variant));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, variant.id, variant.image]);
  return (
    <img
      className="garage-thumb"
      src={src}
      alt={`${variant.brand} ${variant.name}`}
      loading="lazy"
      onError={() => setSrc(productThumb(variant))}
    />
  );
}

/** Five-star rating row with a half-step glyph and the numeric value. */
function Stars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span className="garage-stars" title={`${value.toFixed(1)} / 5`}>
      {'★★★★★'.slice(0, full)}
      <span className="garage-stars-dim">{'★★★★★'.slice(full)}</span>
    </span>
  );
}

/**
 * Garage – the swap + product-placement storefront for the selected part.
 * Variant chips restyle the 3D part live; the card below sells the active one.
 */
/** "+28" / "−12" / "stock" badge for a horsepower delta. */
function GainBadge({ hp, small }) {
  const cls = hp > 0 ? 'up' : hp < 0 ? 'down' : 'flat';
  const txt = hp === 0 ? (small ? '—' : 'stock') : `${hp > 0 ? '+' : ''}${hp}`;
  return (
    <span className={`gain-badge ${cls} ${small ? 'sm' : ''}`}>
      {txt}
      {!small && hp !== 0 && ' hp'}
    </span>
  );
}

function Garage({ componentId }) {
  const partVariants = useAppStore((s) => s.partVariants);
  const setPartVariant = useAppStore((s) => s.setPartVariant);
  const engine = getEngine(useAppStore((s) => s.activeEngineId));
  const selectedId = partVariants[componentId];

  // Resolve the catalog from the ACTIVE engine's own products, so the four-banger
  // never shows a V8 part (and vice-versa).
  const variants = engine.products[componentId]?.variants ?? null;
  const oemId = variants ? (variants.find((v) => v.oem)?.id ?? variants[0]?.id) : null;

  // Peak HP/TQ each variant would make IN THE CURRENT BUILD, vs this slot at stock.
  // This is what turns the catalog into a dyno: every chip shows what it's worth.
  const isPerf = engine.perfCategories.includes(componentId);
  const gains = useMemo(() => {
    if (!variants || !isPerf) return null;
    const base = computeDyno({ ...partVariants, [componentId]: oemId }, undefined, engine);
    const out = {};
    for (const v of variants) {
      const d = computeDyno({ ...partVariants, [componentId]: v.id }, undefined, engine);
      out[v.id] = {
        hp: d.peakHp.value - base.peakHp.value,
        tq: d.peakTq.value - base.peakTq.value,
      };
    }
    return out;
  }, [variants, oemId, isPerf, componentId, partVariants, engine]);

  if (!variants) return null;
  const active = variants.find((v) => v.id === selectedId) ?? variants[0];
  const activeGain = gains?.[active.id];

  return (
    <div className="comp-detail-section garage">
      <span className="comp-detail-label">🛒 Garage — Swap &amp; Shop</span>

      <div className="garage-chips">
        {variants.map((v) => (
          <button
            key={v.id}
            className={`garage-chip ${active.id === v.id ? 'active' : ''}`}
            style={{ '--chip-tint': v.tint || '#5a6472' }}
            onClick={() => setPartVariant(componentId, v.id)}
            title={`${v.brand} — ${v.name}`}
          >
            <span className="garage-chip-dot" />
            {v.brand}
            {v.oem && <span className="garage-oem">OEM</span>}
            {gains && gains[v.id].hp !== 0 && <GainBadge hp={gains[v.id].hp} small />}
          </button>
        ))}
      </div>

      <div className="garage-card">
        <ProductImage componentId={componentId} variant={active} />
        <div className="garage-info">
          <div className="garage-brand">{active.brand}</div>
          <div className="garage-name">{active.name}</div>
          <div className="garage-rate">
            <Stars value={active.rating} />
            <span className="garage-reviews">({active.reviews.toLocaleString()})</span>
          </div>
          {active.spec && <div className="garage-spec">{active.spec}</div>}
          {active.blurb && <p className="garage-blurb">{active.blurb}</p>}
          {commerceEnabled() && (
            <div className="garage-buy-row">
              <span className="garage-price">${active.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <a className="garage-buy" href={buyLink(active.buyUrl)} target="_blank" rel="noopener noreferrer">
                View / Buy →
              </a>
            </div>
          )}
          {active.sku && <div className="garage-sku">SKU {active.sku}</div>}
        </div>
      </div>

      {isPerf && activeGain && (
        <div className="garage-dyno">
          <span className="garage-dyno-label">vs stock {variants[0].brand}:</span>
          <GainBadge hp={activeGain.hp} />
          <span className={`gain-badge ${activeGain.tq > 0 ? 'up' : activeGain.tq < 0 ? 'down' : 'flat'}`}>
            {activeGain.tq === 0 ? 'stock' : `${activeGain.tq > 0 ? '+' : ''}${activeGain.tq} lb-ft`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ComponentDetail() {
  const {
    selectedComponent,
    setSelectedComponent,
    selectSubsystem,
    setActiveTab,
  } = useAppStore();

  if (!selectedComponent) return null;

  const comp = COMPONENTS[selectedComponent];
  if (!comp) return null;

  const sys = SUBSYSTEMS[comp.subsystemId];

  const handleRelatedClick = (relId) => {
    const relComp = COMPONENTS[relId];
    if (!relComp) return;
    setSelectedComponent(relId);
    selectSubsystem(relComp.subsystemId);
    setActiveTab('parts');
  };

  return (
    <div className="component-detail">
      <div className="comp-detail-header" style={{ borderColor: sys.color }}>
        <div className="comp-detail-title">
          <span className="comp-detail-name">{comp.label}</span>
          <span
            className="comp-detail-sys-badge"
            style={{ background: sys.color + '33', color: sys.color }}
          >
            {sys.label}
          </span>
        </div>
        <button
          className="close-btn"
          onClick={() => setSelectedComponent(null)}
          aria-label="Close component detail"
        >
          ✕
        </button>
      </div>

      <div className="comp-detail-body">
        <p className="comp-detail-function">{comp.function}</p>

        <Garage componentId={selectedComponent} />

        {comp.tags.length > 0 && (
          <div className="comp-detail-section">
            <span className="comp-detail-label">Tags</span>
            <div className="comp-tags">
              {comp.tags.map((tag) => (
                <span key={tag} className="comp-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {comp.failureSymptoms.length > 0 && (
          <div className="comp-detail-section">
            <span className="comp-detail-label">⚠ Failure Symptoms</span>
            <ul className="comp-symptoms">
              {comp.failureSymptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {comp.relatedComponents.length > 0 && (
          <div className="comp-detail-section">
            <span className="comp-detail-label">Related Components</span>
            <div className="comp-related">
              {comp.relatedComponents.map((relId) => {
                const rel = COMPONENTS[relId];
                const relSys = rel ? SUBSYSTEMS[rel.subsystemId] : null;
                return rel ? (
                  <button
                    key={relId}
                    className="related-btn"
                    style={{ '--rel-color': relSys?.color ?? '#636e72' }}
                    onClick={() => handleRelatedClick(relId)}
                    title={`Go to ${rel.label}`}
                  >
                    {rel.label}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {comp.maintenanceNote && (
          <div className="comp-detail-section">
            <span className="comp-detail-label">🔧 Maintenance</span>
            <p className="comp-maintenance">{comp.maintenanceNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
