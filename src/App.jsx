/**
 * App – root component that composes the 3D scene and the sidebar UI.
 */
import VehicleScene from './components/scene/VehicleScene';
import Sidebar from './components/ui/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-logo">🔧</div>
        <h1 className="app-title">Automotive3D</h1>
        <span className="app-subtitle">Interactive Engine Teardown</span>
      </header>

      <div className="app-body">
        <div className="scene-container">
          <VehicleScene />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
