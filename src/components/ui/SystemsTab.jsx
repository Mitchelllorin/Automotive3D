/**
 * SystemsTab – lets users select a subsystem, then isolate or explode it.
 */
import useAppStore from '../../store/appStore';
import { SUBSYSTEM_LIST } from '../../data/subsystems';

export default function SystemsTab() {
  const {
    selectedSubsystem,
    setSelectedSubsystem,
    clearSubsystem,
    isExploded,
    isIsolated,
    toggleExplode,
    toggleIsolate,
  } = useAppStore();

  const selected = SUBSYSTEM_LIST.find((s) => s.id === selectedSubsystem);

  return (
    <div className="tab-content">
      <h2 className="section-title">Vehicle Systems</h2>
      <p className="section-hint">Select a subsystem to inspect it.</p>

      <div className="subsystem-grid">
        {SUBSYSTEM_LIST.map((sys) => (
          <button
            key={sys.id}
            className={`subsystem-btn ${selectedSubsystem === sys.id ? 'active' : ''}`}
            style={{ '--sys-color': sys.color }}
            onClick={() => setSelectedSubsystem(sys.id)}
            aria-pressed={selectedSubsystem === sys.id}
          >
            <span className="sys-dot" />
            {sys.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="subsystem-detail">
          <div className="detail-header" style={{ borderColor: selected.color }}>
            <span className="detail-label" style={{ color: selected.color }}>
              {selected.label}
            </span>
            <button className="close-btn" onClick={clearSubsystem} aria-label="Clear selection">
              ✕
            </button>
          </div>

          <p className="detail-desc">{selected.description}</p>

          <div className="action-row">
            <button
              className={`action-btn ${isIsolated ? 'active-action' : ''}`}
              onClick={toggleIsolate}
            >
              {isIsolated ? '🔍 Isolated' : '🔍 Isolate'}
            </button>
            <button
              className={`action-btn ${isExploded ? 'active-action' : ''}`}
              onClick={toggleExplode}
            >
              {isExploded ? '💥 Exploded' : '💥 Explode'}
            </button>
          </div>

          <div className="mesh-list">
            <span className="mesh-list-label">Components:</span>
            {selected.meshNames.map((name) => (
              <span key={name} className="mesh-tag">
                {name.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
