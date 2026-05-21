/**
 * FaultsTab – toggle individual fault conditions and see explanations.
 */
import useAppStore from '../../store/appStore';
import { FAULT_LIST } from '../../data/faults';
import { SUBSYSTEMS } from '../../data/subsystems';

const SEVERITY_COLOR = {
  critical: '#e17055',
  warning: '#f9ca24',
};

const SEVERITY_ICON = {
  critical: '🔴',
  warning: '🟡',
};

export default function FaultsTab() {
  const { activeFaults, toggleFault, clearAllFaults } = useAppStore();
  const activeFaultList = FAULT_LIST.filter((f) => activeFaults[f.id]);

  return (
    <div className="tab-content">
      <h2 className="section-title">Fault Diagnostics</h2>
      <p className="section-hint">Toggle faults to see their effect on the vehicle.</p>

      <div className="fault-list">
        {FAULT_LIST.map((fault) => {
          const isActive = !!activeFaults[fault.id];
          const sys = SUBSYSTEMS[fault.subsystem];
          return (
            <div
              key={fault.id}
              className={`fault-card ${isActive ? 'fault-active' : ''}`}
              style={{ '--fault-color': SEVERITY_COLOR[fault.severity] }}
            >
              <div className="fault-header">
                <span className="fault-severity">{SEVERITY_ICON[fault.severity]}</span>
                <span className="fault-label">{fault.label}</span>
                <span className="fault-dtc">{fault.dtcCode}</span>
                <button
                  className={`fault-toggle ${isActive ? 'on' : 'off'}`}
                  onClick={() => toggleFault(fault.id)}
                  aria-pressed={isActive}
                >
                  {isActive ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="fault-sub-row">
                <span
                  className="fault-subsystem-badge"
                  style={{ background: sys.color + '33', color: sys.color }}
                >
                  {sys.label}
                </span>
                <span className="fault-short-desc">{fault.shortDescription}</span>
              </div>

              {isActive && (
                <div className="fault-explanation">
                  <p>{fault.explanation}</p>
                  <div className="fault-affected">
                    Affected part:{' '}
                    <strong>{fault.affectedMesh.replace(/_/g, ' ')}</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeFaultList.length > 0 && (
        <button className="clear-faults-btn" onClick={clearAllFaults}>
          Clear All Faults
        </button>
      )}
    </div>
  );
}
