import type { PreferenceSwitchProps } from "./preference-switch";

export function PreferenceSwitch({ label, detail, value, onChange, dark }: PreferenceSwitchProps) {
  const track = value ? (dark ? "#ffffff" : "#242424") : (dark ? "#777777" : "#767676");
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-description={detail}
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{ width: 52, height: 48, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: 0, background: "transparent", cursor: "pointer", flexShrink: 0 }}
    >
      <span style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: track, display: "flex", alignItems: "center", justifyContent: value ? "flex-end" : "flex-start", padding: 3, boxSizing: "border-box" }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: dark && value ? "#222222" : "#ffffff" }} />
      </span>
    </button>
  );
}
