import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EventFlowButtons, GalaMessage } from "./event-flow";
import { drinkSuggestions, EventSettings, foodSuggestions, useEventSettings } from "./event-settings-context";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";

type MenuKey = "foods" | "drinks";
type NumberKey = "duration" | "invitations" | "rsvp";

function isWholeNumber(value: string, minimum: number) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= minimum;
}

function settingsError(settings: EventSettings): string | undefined {
  if (!isWholeNumber(settings.duration, 1) || Number(settings.duration) > 168) return "Enter an event duration from 1 to 168 hours.";
  if (!isWholeNumber(settings.invitations, 0) || !isWholeNumber(settings.rsvp, 0)) return "Enter whole numbers for the invitation and RSVP deadlines.";
  if (Number(settings.invitations) < Number(settings.rsvp)) return "Send invitations at least as early as the RSVP deadline.";
  if (!settings.foods.length || !settings.drinks.length) return "Select at least one food and one drink.";
  const durationMinutes = Number(settings.duration) * 60;
  for (let index = 0; index < settings.timeline.length; index++) {
    const item = settings.timeline[index];
    if (!item.label.trim() || !isWholeNumber(item.minutes, 0) || Number(item.minutes) > durationMinutes) {
      return "Enter a label and a time within the event duration for every timeline item.";
    }
    if (index > 0 && Number(item.minutes) < Number(settings.timeline[index - 1].minutes)) {
      return "Timeline times must be in order.";
    }
  }
}

function formatTime(minutes: string) {
  const total = Number(minutes);
  return `+${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

export function EventSettingsStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { settings, setSettings, editing, setEditing, reset } = useEventSettings();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [itemError, setItemError] = useState("");
  const error = settingsError(settings);

  function updateNumber(key: NumberKey, value: string) {
    setSettings({ ...settings, [key]: value });
  }

  function toggleMenu(key: MenuKey) {
    setOpenMenu(openMenu === key ? null : key);
    setNewItem("");
    setItemError("");
  }

  function toggleItem(key: MenuKey, item: string) {
    const current = settings[key];
    setSettings({ ...settings, [key]: current.includes(item) ? current.filter((value) => value !== item) : [...current, item] });
  }

  function addItem(key: MenuKey) {
    const value = newItem.trim();
    const customKey = key === "foods" ? "customFoods" : "customDrinks";
    const options = [...(key === "foods" ? foodSuggestions : drinkSuggestions), ...settings[customKey]];
    if (!value) {
      setItemError("Enter an item name.");
    } else if (options.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setItemError("This item already exists.");
    } else {
      setSettings({ ...settings, [customKey]: [...settings[customKey], value], [key]: [...settings[key], value] });
      setNewItem("");
      setItemError("");
    }
  }

  function deleteItem(key: MenuKey, item: string) {
    const customKey = key === "foods" ? "customFoods" : "customDrinks";
    setSettings({ ...settings, [customKey]: settings[customKey].filter((value) => value !== item), [key]: settings[key].filter((value) => value !== item) });
  }

  function updateTimeline(index: number, field: "label" | "minutes", value: string) {
    setSettings({ ...settings, timeline: settings.timeline.map((item, i) => i === index ? { ...item, [field]: value } : item) });
  }

  function menu(key: MenuKey, title: string) {
    const expanded = openMenu === key;
    const customItems = key === "foods" ? settings.customFoods : settings.customDrinks;
    const options = [...(key === "foods" ? foodSuggestions : drinkSuggestions), ...customItems];
    return (
      <View style={styles.section}>
        <Text style={styles.label}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => toggleMenu(key)} style={styles.dropdown}>
          <Text style={styles.dropdownText}>{settings[key].length ? settings[key].join(", ") : "No items selected"}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#ffffff" />
        </Pressable>
        {expanded && (
          <View style={styles.options}>
            {options.map((item) => (
              <View key={item} style={styles.optionRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={item}
                  accessibilityState={{ checked: settings[key].includes(item), disabled: !editing }}
                  aria-checked={settings[key].includes(item)}
                  disabled={!editing}
                  onPress={() => toggleItem(key, item)}
                  style={[styles.option, settings[key].includes(item) && styles.optionSelected]}
                >
                  <Text style={styles.optionText}>{settings[key].includes(item) ? "✓ " : ""}{item}</Text>
                </Pressable>
                {editing && customItems.includes(item) && (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item}`} onPress={() => deleteItem(key, item)} style={styles.delete}>
                    <Ionicons name="trash-outline" size={20} color="#ffffff" />
                  </Pressable>
                )}
              </View>
            ))}
            {editing && (
              <>
                <View style={styles.addRow}>
                  <TextInput accessibilityLabel={`New ${key === "foods" ? "food" : "drink"} item`} value={newItem} onChangeText={(text) => { setNewItem(text); setItemError(""); }} placeholder="Add an item" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} maxLength={60} style={[styles.input, darkMode && styles.darkInput]} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Add ${key === "foods" ? "food" : "drink"} item`} onPress={() => addItem(key)} style={[styles.addButton, darkMode && styles.darkPanel]}>
                    <Text style={[styles.addText, darkMode && styles.darkAccent]}>Add</Text>
                  </Pressable>
                </View>
                {!!itemError && <Text style={styles.error} accessibilityRole="alert">{itemError}</Text>}
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  const fields: { key: NumberKey; label: string; unit: string }[] = [
    { key: "duration", label: "Event Duration", unit: "hours" },
    { key: "invitations", label: "Send Invitations By", unit: "days before" },
    { key: "rsvp", label: "RSVP Deadline", unit: "days before" },
  ];

  return (
    <>
      <GalaMessage heading="Gala has a plan for you!">{"Based on your selected event type, I've prepared some suggested settings. You can customize these anytime!"}</GalaMessage>
      <Text style={styles.notice}>Preview defaults only; not generated by AI or saved.</Text>
      <View style={styles.settings}>
        {fields.map(({ key, label, unit }) => (
          <View style={styles.settingRow} key={key}>
            <Text style={[styles.label, styles.settingLabel]}>{label}</Text>
            <View style={styles.settingValue}>
              <View style={styles.settingNumber}>
                {editing ? (
                  <TextInput accessibilityLabel={label} value={settings[key]} onChangeText={(value) => updateNumber(key, value)} keyboardType="number-pad" maxLength={6} style={[styles.numberInput, styles.settingInput, darkMode && styles.darkInput]} />
                ) : <Text style={[styles.value, styles.settingNumberText]}>{settings[key]}</Text>}
              </View>
              <Text style={[styles.value, styles.settingUnit]}>{unit}</Text>
            </View>
          </View>
        ))}
      </View>
      {menu("foods", aiSuggestions ? "Food Suggestions" : "Food Preferences")}
      {menu("drinks", aiSuggestions ? "Drink Suggestions" : "Drink Preferences")}
      <View style={styles.section}>
        <Pressable accessibilityRole="button" accessibilityLabel={aiSuggestions ? "Suggested timeline" : "Event timeline"} accessibilityState={{ expanded: timelineOpen }} aria-expanded={timelineOpen} onPress={() => setTimelineOpen(!timelineOpen)} style={styles.timelineHeading}>
          <Text style={styles.label}>{aiSuggestions ? "Suggested timeline" : "Event timeline"}</Text>
          <Ionicons name={timelineOpen ? "chevron-up" : "chevron-down"} size={20} color="#ffffff" />
        </Pressable>
        {!timelineOpen && <Text style={styles.notice}>6 stages · times relative to event start</Text>}
        {timelineOpen && (
          <View style={styles.timeline}>
            {settings.timeline.map((item, index) => (
              <View key={index} style={[styles.timelineRow, editing && styles.timelineEditRow]}>
                <Text style={styles.number}>{index + 1}</Text>
                {editing ? (
                  <>
                    <TextInput accessibilityLabel={`Timeline stage ${index + 1} name`} value={item.label} onChangeText={(value) => updateTimeline(index, "label", value)} maxLength={40} style={[styles.timelineInput, darkMode && styles.darkInput]} />
                    <TextInput accessibilityLabel={`Timeline stage ${index + 1} minutes after start`} value={item.minutes} onChangeText={(value) => updateTimeline(index, "minutes", value)} keyboardType="number-pad" maxLength={5} style={[styles.numberInput, darkMode && styles.darkInput]} />
                    <Text style={styles.value}>min</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                    <Text style={styles.value}>{formatTime(item.minutes)}</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
      {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <View style={styles.actions}>
        {aiSuggestions && <Pressable accessibilityRole="button" accessibilityHint="Restore the original preview suggestions and lock editing." onPress={() => { reset(); setOpenMenu(null); setTimelineOpen(true); }} style={styles.primary}>
          <Text style={styles.primaryText}>Accept Suggestions</Text>
        </Pressable>}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: editing && !!error }}
          accessibilityHint={editing && error ? error : undefined}
          disabled={editing && !!error}
          onPress={() => {
            if (editing) {
              setEditing(false);
              setOpenMenu(null);
            } else {
              setEditing(true);
              setTimelineOpen(false);
            }
          }}
          style={[styles.customize, editing && !!error && styles.disabled]}
        >
          <Text style={styles.primaryText}>{editing ? "Finalize Changes" : "Customize My Settings"}</Text>
        </Pressable>
      </View>
      <Text style={styles.caption}>You can always change these settings later</Text>
      <EventFlowButtons onBack={onBack} onContinue={onContinue} disabled={!!error} disabledHint={error} />
    </>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  settings: { gap: 5 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 25 },
  settingLabel: { flex: 1 },
  settingValue: { width: "48%", flexDirection: "row", alignItems: "center", gap: 4 },
  settingNumber: { flex: 4 },
  settingInput: { width: "100%", minWidth: 0 },
  settingNumberText: { textAlign: "center" },
  settingUnit: { flex: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, flexShrink: 1 },
  value: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  section: { gap: 5 },
  dropdown: { minHeight: 48, borderRadius: 12, padding: 10, backgroundColor: "#c65d58", flexDirection: "row", alignItems: "center", gap: 8 },
  dropdownText: { flex: 1, color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  options: { gap: 5 },
  optionRow: { flexDirection: "row", gap: 6 },
  option: { flex: 1, minHeight: 44, justifyContent: "center", borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#a54b47", borderWidth: 2, borderColor: "transparent" },
  optionSelected: { backgroundColor: "#c65d58", borderColor: "#ffffff" },
  optionText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  delete: { minWidth: 44, minHeight: 44, borderRadius: 10, backgroundColor: "#a54b47", alignItems: "center", justifyContent: "center" },
  addRow: { flexDirection: "row", gap: 6 },
  input: { flex: 1, minHeight: 44, backgroundColor: "#ffffff", borderRadius: 10, color: "#1e1e1e", paddingHorizontal: 10, fontFamily: "DMSans_400Regular", fontSize: 16 },
  addButton: { minWidth: 56, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 10 },
  addText: { color: "#a33f3a", fontFamily: "DMSans_700Bold", fontSize: 15 },
  numberInput: { minWidth: 48, minHeight: 44, backgroundColor: "#ffffff", borderRadius: 8, color: "#1e1e1e", paddingHorizontal: 8, fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  timelineHeading: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeline: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 4 },
  timelineRow: { width: "49%", flexDirection: "row", alignItems: "center", gap: 4, minHeight: 26 },
  timelineEditRow: { width: "100%" },
  number: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, width: 20 },
  timelineLabel: { flex: 1, color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  timelineInput: { flex: 1, minHeight: 44, backgroundColor: "#ffffff", color: "#1e1e1e", borderRadius: 8, paddingHorizontal: 8, fontFamily: "DMSans_400Regular", fontSize: 16 },
  actions: { flexDirection: "row", gap: 8 },
  primary: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", justifyContent: "center", alignItems: "center", padding: 8 },
  customize: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: "#686868", justifyContent: "center", alignItems: "center", padding: 8 },
  disabled: { opacity: 0.55 },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "center" },
  caption: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, textAlign: "center" },
  error: { color: "#4b1714", fontFamily: "DMSans_700Bold", fontSize: 13 },
});
