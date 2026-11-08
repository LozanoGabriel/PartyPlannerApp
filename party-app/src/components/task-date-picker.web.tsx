import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";

export function TaskDatePicker({ value, onChange }: { value: Date | null; onChange: (date: Date | null) => void }) {
  const dateValue = value ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}` : "";
  return (
    <View style={styles.container}>
      <input aria-label="Due date" type="date" value={dateValue} onChange={(event) => {
        if (!event.target.value) {
          onChange(null);
          return;
        }
        const [year, month, day] = event.target.value.split("-").map(Number);
        if (year && month && day) onChange(new Date(year, month - 1, day));
      }} style={{ flex: 1, minWidth: 0, border: 0, fontSize: 16, background: "transparent", color: "#1e1e1e" }} />
      {value && <Pressable accessibilityRole="button" accessibilityLabel="Clear due date" onPress={() => onChange(null)}><Ionicons name="close-circle-outline" size={22} color="#a43f3a" /></Pressable>}
      <Ionicons name="calendar-outline" size={22} color="#a43f3a" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
});
