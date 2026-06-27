/**
 * SettingsTab — app settings. Currently the workspace-logo FX (opacity / speed /
 * bounce for the floating AutoMotive3D clone); a home for future UI/perf toggles.
 */
import useAppStore from '../../store/appStore';

function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <label className="set-row">
      <span className="set-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="set-val">{fmt ? fmt(value) : value}</span>
    </label>
  );
}

export default function SettingsTab() {
  const logoFx = useAppStore((s) => s.logoFx);
  const setLogoFx = useAppStore((s) => s.setLogoFx);

  return (
    <div className="settings-tab">
      <h3 className="set-section metal-text">Workspace Logo</h3>
      <p className="set-hint">The floating AutoMotive3D clone in the workspace.</p>
      <Slider label="Opacity" value={logoFx.opacity} min={0} max={1} step={0.05}
        onChange={(v) => setLogoFx({ opacity: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Speed" value={logoFx.speed} min={0} max={2.5} step={0.05}
        onChange={(v) => setLogoFx({ speed: v })} fmt={(v) => `${v.toFixed(2)}×`} />
      <Slider label="Float" value={logoFx.bounce} min={0} max={1.5} step={0.05}
        onChange={(v) => setLogoFx({ bounce: v })} fmt={(v) => v.toFixed(2)} />
    </div>
  );
}
