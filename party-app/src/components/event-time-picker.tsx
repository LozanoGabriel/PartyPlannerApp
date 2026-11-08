import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";

export function EventTimePicker({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const { darkMode } = useAppPreferences();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Event start time"
        onPress={() => setOpen(true)}
        style={[styles.button, darkMode && styles.darkPanel]}
      >
        <Text style={[styles.text, darkMode && styles.darkText]}>
          {value ? value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Select time"}
        </Text>
      </Pressable>
      {open && (
        <>
          <DateTimePicker
            value={value ?? new Date()}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, time) => {
              if (Platform.OS !== "ios") setOpen(false);
              if (event.type !== "dismissed" && time) {
                const next = new Date(value ?? new Date());
                next.setHours(time.getHours(), time.getMinutes(), 0, 0);
                onChange(next);
              }
            }}
          />
          {Platform.OS === "ios" && (
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.done}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  button: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, justifyContent: "center" },
  text: { color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  done: { alignSelf: "flex-end", padding: 12 },
  doneText: { color: "#ffffff", fontFamily: "DMSans_700Bold" },
});
