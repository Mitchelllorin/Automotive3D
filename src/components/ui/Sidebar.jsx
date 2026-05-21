/**
 * Sidebar – tabbed navigation panel that renders Systems, Faults, or Info content.
 */
import useAppStore from '../../store/appStore';
import SystemsTab from './SystemsTab';
import FaultsTab from './FaultsTab';
import InfoTab from './InfoTab';

const TABS = [
  { id: 'systems', label: '⚙ Systems' },
  { id: 'faults', label: '⚠ Faults' },
  { id: 'info', label: 'ℹ Info' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, activeFaults } = useAppStore();

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
        {activeTab === 'faults' && <FaultsTab />}
        {activeTab === 'info' && <InfoTab />}
      </div>
    </aside>
  );
}
