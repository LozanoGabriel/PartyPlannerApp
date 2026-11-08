import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export function TaskDatePicker({ value, onChange }: { value: Date | null; onChange: (date: Date | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel="Due date" onPress={() => setOpen(true)} style={styles.button}>
        <Text style={styles.text}>{value ? value.toLocaleDateString() : "Select Date"}</Text>
        <Ionicons name="calendar-outline" size={22} color="#a43f3a" />
      </Pressable>
      {open && <>
        <DateTimePicker value={value || new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(event, date) => {
          if (Platform.OS !== "ios") setOpen(false);
          if (event.type !== "dismissed" && date) onChange(date);
        }} />
        {Platform.OS === "ios" && <Pressable accessibilityRole="button" onPress={() => { if (!value) onChange(new Date()); setOpen(false); }} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>}
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  text: { color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  done: { alignSelf: "flex-end", padding: 12 },
  doneText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
