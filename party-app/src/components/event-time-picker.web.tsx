import { StyleSheet, View } from "react-native";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";

export function EventTimePicker({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const { darkMode } = useAppPreferences();
  const time = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <View style={[styles.container, darkMode && styles.darkPanel]}>
      <input
        aria-label="Event start time"
        type="time"
        value={time}
        onChange={(event) => {
          const [hours, minutes] = event.target.value.split(":").map(Number);
          if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
            const next = new Date(value ?? new Date());
            next.setHours(hours, minutes, 0, 0);
            onChange(next);
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          fontSize: 16,
          background: "transparent",
          color: darkMode ? darkPalette.text : "#1e1e1e",
          colorScheme: darkMode ? "dark" : "light",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  container: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, justifyContent: "center" },
});
