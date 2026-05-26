/**
 * Sidebar – tabbed navigation panel that renders Systems, Parts, Faults, or Info content.
 * When a component is selected, a ComponentDetail panel is pinned at the bottom.
 */
import useAppStore from '../../store/appStore';
import SystemsTab from './SystemsTab';
import PartsTab from './PartsTab';
import FaultsTab from './FaultsTab';
import InfoTab from './InfoTab';
import ComponentDetail from './ComponentDetail';

const TABS = [
  { id: 'systems', label: '⚙ Systems' },
  { id: 'parts', label: '🔩 Parts' },
  { id: 'faults', label: '⚠ Faults' },
  { id: 'info', label: 'ℹ Info' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, activeFaults, selectedComponent } = useAppStore();

  const activeFaultCount = Object.values(activeFaults).filter(Boolean).length;

  return (
    <aside className="sidebar">
      {/* Tab bar */}
      <nav className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'faults' && activeFaultCount > 0 && (
              <span className="fault-badge">{activeFaultCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="tab-panel" role="tabpanel">
        {activeTab === 'systems' && <SystemsTab />}
        {activeTab === 'parts' && <PartsTab />}
        {activeTab === 'faults' && <FaultsTab />}
        {activeTab === 'info' && <InfoTab />}
      </div>

      {/* Persistent component detail panel – shown whenever a part is selected */}
      {selectedComponent && (
        <div className="component-detail-panel">
          <ComponentDetail />
        </div>
      )}
    </aside>
  );
}
