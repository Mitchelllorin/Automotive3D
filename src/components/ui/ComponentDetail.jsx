/**
 * ComponentDetail – rich info panel for the currently selected component.
 * Shows function description, tags, failure symptoms, related parts, and
 * maintenance note. Related components are clickable to navigate between parts.
 */
import useAppStore from '../../store/appStore';
import { COMPONENTS } from '../../data/components';
import { SUBSYSTEMS } from '../../data/subsystems';

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
