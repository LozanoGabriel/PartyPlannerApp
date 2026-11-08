import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { EventPreferences, useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { drinkSuggestions, foodSuggestions } from "../components/event-settings-context";
import { SaveChangesDialog } from "../components/save-changes-dialog";
import { SettingsLayout } from "../components/settings-layout";
import { useSettingsGuard } from "../components/use-settings-guard";

type NumberField = "duration" | "invitations" | "rsvp";
type ChoiceField = "foods" | "drinks";
const fields: { key: NumberField; label: string; unit: string; minimum: number }[] = [
  { key: "duration", label: "Event Duration", unit: "hours", minimum: 1 },
  { key: "invitations", label: "Send Invitations By:", unit: "days before", minimum: 0 },
  { key: "rsvp", label: "RSVP Deadline", unit: "days before", minimum: 0 },
];

function validationError(value: EventPreferences) {
  const validNumber = (text: string) => /^\d+$/.test(text) && Number.isSafeInteger(Number(text));
  if (!validNumber(value.duration) || Number(value.duration) < 1 || Number(value.duration) > 168) return "Enter an event duration from 1 to 168 hours.";
  if (!validNumber(value.invitations) || !validNumber(value.rsvp)) return "Enter whole numbers for the invitation and RSVP deadlines.";
  if (Number(value.invitations) < Number(value.rsvp)) return "Send invitations at least as early as the RSVP deadline.";
  if (!value.foods.length || !value.drinks.length) return "Select at least one food and one drink.";
  return "";
}

export default function EventPreferencesScreen() {
  const { width } = useWindowDimensions();
  const narrow = width < 480;
  const { darkMode, eventPreferences, setEventPreferences } = useAppPreferences();
  const [draft, setDraft] = useState(eventPreferences);
  const [open, setOpen] = useState<ChoiceField | null>(null);
  const [error, setError] = useState("");
  const changed = JSON.stringify(draft) !== JSON.stringify(eventPreferences);
  const guard = useSettingsGuard(changed, async () => {
    const message = validationError(draft);
    if (message) { setError(message); return false; }
    setEventPreferences(draft);
    return true;
  });

  function updateNumber(key: NumberField, value: string) {
    setError("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function choices(key: ChoiceField, title: string, options: string[]) {
    const expanded = open === key;
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setOpen(expanded ? null : key)} style={[styles.select, darkMode && styles.darkPanel]}>
          <Text style={[styles.selectText, darkMode && styles.darkText]}>{draft[key].length ? draft[key].join(", ") : "No items selected"}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
        </Pressable>
        {expanded && options.map((option) => {
          const checked = draft[key].includes(option);
          return (
            <Pressable key={option} accessibilityRole="checkbox" accessibilityLabel={option} accessibilityState={{ checked }} aria-checked={checked} onPress={() => {
              setError("");
              setDraft((current) => ({ ...current, [key]: checked ? current[key].filter((item) => item !== option) : [...current[key], option] }));
            }} style={[styles.option, checked && styles.selected]}>
              <Text style={styles.optionText}>{checked ? "✓ " : ""}{option}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <SettingsLayout title="Event Preferences" onNavigate={guard.navigate} onBack={() => guard.navigate("/settings")}>
      <Text style={styles.notice}>Preferences last for this session and do not change event creation.</Text>
      {fields.map(({ key, label, unit, minimum }) => {
        const value = Number(draft[key]);
        const valid = /^\d+$/.test(draft[key]) && Number.isSafeInteger(value);
        const maximum = key === "duration" ? 168 : 999999;
        return (
          <View key={key} style={[styles.numberRow, narrow && styles.narrowNumberRow]}>
            <Text style={[styles.label, styles.numberLabel]}>{label}</Text>
            <View style={[styles.counter, narrow && styles.narrowCounter]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.replace(":", "")}`} disabled={!valid || value <= minimum} accessibilityState={{ disabled: !valid || value <= minimum }} onPress={() => updateNumber(key, String(value - 1))} style={[styles.counterButton, darkMode && styles.darkPanel, (!valid || value <= minimum) && styles.disabled]}><Ionicons name="remove" size={22} color={darkMode ? darkPalette.text : "#a43f3a"} /></Pressable>
              <TextInput accessibilityLabel={label.replace(":", "")} value={draft[key]} onChangeText={(text) => updateNumber(key, text)} keyboardType="number-pad" maxLength={6} style={[styles.input, darkMode && styles.darkInput]} />
              <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.replace(":", "")}`} disabled={!valid || value >= maximum} accessibilityState={{ disabled: !valid || value >= maximum }} onPress={() => updateNumber(key, String(value + 1))} style={[styles.counterButton, darkMode && styles.darkPanel, (!valid || value >= maximum) && styles.disabled]}><Ionicons name="add" size={22} color={darkMode ? darkPalette.text : "#a43f3a"} /></Pressable>
              <Text style={styles.unit}>{unit}</Text>
            </View>
          </View>
        );
      })}
      {choices("foods", "Food Suggestions", foodSuggestions)}
      {choices("drinks", "Drink Suggestions", drinkSuggestions)}
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {changed && <Pressable accessibilityRole="button" onPress={guard.confirm} style={styles.apply}><Text style={styles.applyText}>Apply Changes</Text></Pressable>}
      <SaveChangesDialog visible={guard.dialog !== null} onClose={guard.close} onSave={() => { void guard.save(); }} onDiscard={guard.dialog === "leave" ? guard.leave : undefined} title={guard.dialog === "apply" ? "Are you sure?" : "Save changes?"} saveLabel={guard.dialog === "apply" ? "Apply Changes" : "Save Changes"} busy={guard.busy} message="These preferences are a session-only preview and do not affect event creation." />
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  notice: { color: "#ffffff", backgroundColor: "#333333", borderRadius: 10, padding: 10, textAlign: "center", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  field: { gap: 8 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  numberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  narrowNumberRow: { flexDirection: "column", alignItems: "stretch" },
  numberLabel: { flex: 1, fontSize: 14 },
  counter: { width: "57%", minWidth: 180, flexDirection: "row", alignItems: "center", gap: 3 },
  narrowCounter: { width: "100%", minWidth: 0 },
  counterButton: { width: 36, height: 44, borderRadius: 10, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minWidth: 44, minHeight: 44, borderRadius: 10, backgroundColor: "#ffffff", color: "#1e1e1e", textAlign: "center", fontFamily: "DMSans_700Bold", fontSize: 16 },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  unit: { width: 58, color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 11 },
  disabled: { opacity: 0.5 },
  select: { minHeight: 48, backgroundColor: "#ffffff", borderRadius: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  selectText: { flex: 1, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 15 },
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  option: { minHeight: 44, justifyContent: "center", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#873f3b", borderWidth: 2, borderColor: "transparent" },
  selected: { borderColor: "#ffffff" },
  optionText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  apply: { minHeight: 48, borderRadius: 24, backgroundColor: "#303030", alignItems: "center", justifyContent: "center", padding: 12 },
  applyText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  error: { color: "#ffffff", backgroundColor: "#782c28", borderRadius: 8, padding: 10, fontFamily: "DMSans_700Bold", fontSize: 14 },
});
