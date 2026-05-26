/**
 * InfoTab – general information about the application and usage hints.
 */
import useAppStore from '../../store/appStore';

export default function InfoTab() {
  const { animationsEnabled, toggleAnimations } = useAppStore();

  return (
    <div className="tab-content">
      <h2 className="section-title">About Automotive3D</h2>

      <div className="info-card">
        <h3>What is this?</h3>
        <p>
          Automotive3D is an interactive 3D learning application that lets you
          explore the major systems of a generic passenger vehicle. You can
          isolate individual subsystems, trigger exploded-view diagrams, and
          simulate common fault conditions.
        </p>
      </div>

      <div className="info-card">
        <h3>How to Use</h3>
        <ul className="info-list">
          <li>
            <strong>Rotate</strong> – left-click and drag the 3D viewport.
          </li>
          <li>
            <strong>Zoom</strong> – scroll wheel or pinch gesture.
          </li>
          <li>
            <strong>Pan</strong> – right-click and drag.
          </li>
          <li>
            <strong>Systems tab</strong> – select a subsystem to highlight it,
            then use <em>Isolate</em> to hide other systems or <em>Explode</em>{' '}
            to see it separated from the vehicle.
          </li>
          <li>
            <strong>Faults tab</strong> – toggle fault conditions to see
            animated highlights and read diagnostic descriptions.
          </li>
        </ul>
      </div>

      <div className="info-card">
        <h3>Subsystems Covered</h3>
        <ul className="info-list">
          <li>🔴 Engine – block, pistons, crankshaft, camshaft, valves</li>
          <li>🔵 Cooling – radiator, water pump, thermostat, fan, hoses</li>
          <li>🟡 Electrical – battery, alternator, fuse box, starter</li>
          <li>🟠 Fuel – tank, pump, injectors, throttle body, lines</li>
          <li>⚪ Exhaust – manifold, catalytic converter, O₂ sensor, muffler</li>
          <li>🟣 Suspension – struts, springs, control arms, sway bar</li>
        </ul>
      </div>

      <div className="info-card">
        <h3>Animations</h3>
        <ul className="info-list">
          <li>🔥 Combustion cycle – orange spark particles above cylinders</li>
          <li>💧 Coolant flow – blue particles looping through the cooling circuit</li>
          <li>⚡ Electrical flow – yellow pulses from battery → fuse → loads</li>
          <li>⛽ Fuel path – orange particles from tank through injectors</li>
        </ul>

        <button
          className={`action-btn ${animationsEnabled ? 'active-action' : ''}`}
          onClick={toggleAnimations}
          style={{ marginTop: '0.75rem' }}
        >
          {animationsEnabled ? '⏸ Pause Animations' : '▶ Resume Animations'}
        </button>
      </div>

      <div className="info-card info-footer">
        <p>
          This is an MVP demonstration. Vehicle geometry is procedurally
          generated for illustration purposes. No real OBDII or ECU data is used.
        </p>
      </div>
    </div>
  );
}
