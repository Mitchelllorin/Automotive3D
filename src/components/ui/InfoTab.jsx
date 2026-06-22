/**
 * InfoTab – general information about the application and usage hints.
 */
import { SUBSYSTEM_LIST } from '../../data/subsystems';
import { COMPONENT_LIST } from '../../data/components';

export default function InfoTab() {
  return (
    <div className="tab-content">
      <h2 className="section-title">About Automotive3D</h2>

      <div className="info-card">
        <h3>What is this?</h3>
        <p>
          Automotive3D is an interactive 3D learning tool. The current model is a
          procedurally-built inline-4 engine you can rotate, zoom, take apart, and
          inspect part by part — right down to the bolts and nuts. More of the
          vehicle is on the way; the app is built to drop in additional assemblies.
        </p>
      </div>

      <div className="info-card">
        <h3>How to Use</h3>
        <ul className="info-list">
          <li>
            <strong>Rotate</strong> – left-click and drag (or one-finger drag).
          </li>
          <li>
            <strong>Zoom</strong> – scroll wheel or pinch gesture.
          </li>
          <li>
            <strong>Pan</strong> – right-click drag (or two-finger drag).
          </li>
          <li>
            <strong>Explode</strong> – drag the slider at the bottom to take the
            engine apart and back together; bolts and covers lift off first.
          </li>
          <li>
            <strong>Systems tab</strong> – pick a sub-assembly, then <em>Isolate</em>{' '}
            to dim the rest. Isolate <em>Bolts &amp; Nuts</em> to see every fastener.
          </li>
          <li>
            <strong>Click any part</strong> – select it in 3D to read its function,
            failure symptoms, and maintenance notes.
          </li>
        </ul>
      </div>

      <div className="info-card">
        <h3>Engine Sub-assemblies</h3>
        <ul className="info-list">
          {SUBSYSTEM_LIST.map((s) => (
            <li key={s.id}>
              <span style={{ color: s.color }}>■</span> {s.label} —{' '}
              {s.meshNames.map((m) => m.replace(/_/g, ' ')).join(', ')}
            </li>
          ))}
        </ul>
      </div>

      <div className="info-card info-footer">
        <p>
          MVP demonstration — {COMPONENT_LIST.length} parts, all geometry
          procedurally generated for illustration. Runs in any modern browser on
          Windows and Android.
        </p>
      </div>
    </div>
  );
}
