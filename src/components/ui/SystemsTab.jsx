/**
 * SystemsTab – lets users select a subsystem, then isolate or explode it.
 * Component tags in the detail panel are clickable, navigating to the Parts tab.
 */
import useAppStore from '../../store/appStore';
import { SUBSYSTEM_LIST } from '../../data/subsystems';

export default function SystemsTab() {
  const {
    selectedSubsystem,
    selectedComponent,
    setSelectedSubsystem,
    setSelectedComponent,
    selectSubsystem,
    setActiveTab,
    clearSubsystem,
    isExploded,
    isIsolated,
    toggleExplode,
    toggleIsolate,
  } = useAppStore();

  const selected = SUBSYSTEM_LIST.find((s) => s.id === selectedSubsystem);

  const handleComponentTagClick = (meshName) => {
    setSelectedComponent(meshName);
    selectSubsystem(selectedSubsystem);
    setActiveTab('parts');
  };

  return (
    <div className="tab-content">
      <h2 className="section-title">Engine Systems</h2>
      <p className="section-hint">Select a sub-assembly to isolate or explode it.</p>

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
              <button
                key={name}
                className={`mesh-tag mesh-tag-btn ${selectedComponent === name ? 'mesh-tag-selected' : ''}`}
                onClick={() => handleComponentTagClick(name)}
                title="View component details"
              >
                {name.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
