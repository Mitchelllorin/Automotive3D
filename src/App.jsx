/**
 * App – root component that composes the 3D scene and the sidebar UI.
 */
import { useEffect } from 'react';
import VehicleScene from './components/scene/VehicleScene';
import Sidebar from './components/ui/Sidebar';
import SidebarResizeHandle from './components/ui/SidebarResizeHandle';
import ErrorBoundary from './components/ErrorBoundary';
import Tour from './components/ui/Tour';
import useAppStore from './store/appStore';
import './App.css';

function App() {
  const { sidebarCollapsed, toggleSidebar, sidebarWidth } = useAppStore();
  const tutorialSeen = useAppStore((s) => s.tutorialSeen);
  const startTour = useAppStore((s) => s.startTour);

  // First-time visitors get the guided tour automatically.
  useEffect(() => {
    if (!tutorialSeen) startTour();
  }, [tutorialSeen, startTour]);

  return (
    <ErrorBoundary>
    <div className="app-layout">
      {/* Brand logo is rendered in 3D inside the scene (SceneLogo) so it never
          black-boxes. No DOM header needed. */}

      <div
        className={`app-body ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}
        style={{ '--sidebar-width': `${sidebarWidth}px` }}
      >
        <div className="scene-container">
          <VehicleScene />
          {sidebarCollapsed && (
            <button
              className="sidebar-expand-btn"
              onClick={toggleSidebar}
              title="Open build panel"
              aria-label="Open build panel"
            >
              <span className="sidebar-expand-label">BUILD</span>
              <span className="sidebar-expand-chev">⟨</span>
            </button>
          )}
          <button
            className="help-fab"
            onClick={startTour}
            title="Replay the guided tour"
            aria-label="Replay the guided tour"
          >
            ?
          </button>
        </div>
        {!sidebarCollapsed && <SidebarResizeHandle />}
        <Sidebar />
      </div>
      <Tour />
    </div>
    </ErrorBoundary>
  );
}

export default App;
