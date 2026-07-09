/**
 * Sidebar – tabbed navigation panel that renders Systems, Parts, Faults, or Info content.
 * When a component is selected, a ComponentDetail panel is pinned at the bottom.
 */
import useAppStore from '../../store/appStore';
import SystemsTab from './SystemsTab';
import PartsTab from './PartsTab';
import FuseTab from './FuseTab';
import InfoTab from './InfoTab';
import ArenaTab from './ArenaTab';
import BuildTab from './BuildTab';
import ComponentDetail from './ComponentDetail';
import ErrorBoundary from '../ErrorBoundary';

const TABS = [
  { id: 'build', label: '🔧 Build' },
  { id: 'arena', label: '🏆 Arena' },
  { id: 'faults', label: '🔥 F.U.S.E.' },
  { id: 'parts', label: '🔩 Parts' },
  { id: 'systems', label: '⚙ Systems' },
  { id: 'info', label: 'ℹ Info' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, activeFaults, selectedComponent, toggleSidebar } =
    useAppStore();

  const activeFaultCount = Object.values(activeFaults).filter(Boolean).length;

  return (
    <aside className="sidebar">
      {/* Tab bar — tabs scroll if they don't all fit; the collapse button is
          pinned so it can never be pushed off the edge. */}
      <nav className="tab-bar" role="tablist">
        <div className="tab-list">
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
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={toggleSidebar}
          title="Collapse panel"
          aria-label="Collapse panel"
        >
          ⟩
        </button>
      </nav>

      {/* Tab content */}
      <div className="tab-panel" role="tabpanel">
        <ErrorBoundary compact>
          {activeTab === 'build' && <BuildTab />}
          {activeTab === 'systems' && <SystemsTab />}
          {activeTab === 'parts' && <PartsTab />}
          {activeTab === 'arena' && <ArenaTab />}
          {activeTab === 'faults' && <FuseTab />}
          {activeTab === 'info' && <InfoTab />}
        </ErrorBoundary>
      </div>

      {/* Persistent component detail panel – shown whenever a part is selected */}
      {selectedComponent && (
        <div className="component-detail-panel">
          <ErrorBoundary compact>
            <ComponentDetail />
          </ErrorBoundary>
        </div>
      )}
    </aside>
  );
}
