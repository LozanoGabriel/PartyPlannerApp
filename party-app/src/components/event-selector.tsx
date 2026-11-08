import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";
import type { EventRecord } from "../lib/events-api";

export function EventSelector({
  events,
  selectedId,
  onSelect,
  label = "Choose an event",
  compact = false,
}: {
  events: EventRecord[];
  selectedId?: string;
  onSelect: (eventId: string) => void;
  label?: string;
  compact?: boolean;
}) {
  const { darkMode } = useAppPreferences();
  const [expanded, setExpanded] = useState(false);
  const selected = events.find((event) => event.id === selectedId);
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={[styles.select, darkMode && styles.darkPanel]}
      >
        <Text numberOfLines={1} style={[styles.text, darkMode && styles.darkText]}>
          {selected?.name ?? label}
        </Text>
        <Ionicons name="chevron-down" size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
      </Pressable>
      {expanded && (
        <View style={[styles.options, darkMode && styles.darkPanel]}>
          {events.map((event) => (
            <Pressable key={event.id} accessibilityRole="button" onPress={() => { onSelect(event.id); setExpanded(false); }} style={styles.option}>
              <Text numberOfLines={1} style={[styles.text, darkMode && styles.darkText]}>{event.name}</Text>
              <Text style={[styles.detail, darkMode && styles.darkText]}>
                {new Date(event.start_time).toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
          {events.length === 0 && <Text style={[styles.detail, darkMode && styles.darkText]}>No events available</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  compact: { flex: 1, minWidth: 0 },
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  select: { minHeight: 44, backgroundColor: "#ffffff", borderRadius: 10, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  text: { flex: 1, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 14 },
  options: { maxHeight: 180, overflow: "scroll", backgroundColor: "#ffffff", borderRadius: 10, paddingHorizontal: 10 },
  option: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: "#eeeeee", justifyContent: "center", gap: 2 },
  detail: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 11 },
});
