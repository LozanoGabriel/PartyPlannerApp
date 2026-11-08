import { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { PreferenceSwitch } from "../components/preference-switch";
import { darkPalette } from "../components/dark-palette";
import { SettingsLayout } from "../components/settings-layout";
import { SaveChangesDialog } from "../components/save-changes-dialog";
import { requestNotificationPermission } from "../components/notification-permission";
import { useSettingsGuard } from "../components/use-settings-guard";

export default function AppPreferencesScreen() {
  const { darkMode, setDarkMode, notifications, setNotifications, aiSuggestions, setAiSuggestions } = useAppPreferences();
  const [draft, setDraft] = useState({ darkMode, notifications, aiSuggestions });
  const [error, setError] = useState("");
  const changed = draft.darkMode !== darkMode || draft.notifications !== notifications || draft.aiSuggestions !== aiSuggestions;
  const guard = useSettingsGuard(changed, async () => {
    setError("");
    if (draft.notifications && !notifications) {
      try {
        if (!(await requestNotificationPermission())) {
          setError("Notification permission was denied. Allow notifications in your device or browser settings and try again.");
          return false;
        }
      } catch (reason) {
        console.error("Unable to request notification permission:", reason);
        setError("Unable to request notification permission. Use a supported browser or development build and check your settings.");
        return false;
      }
    }
    setDarkMode(draft.darkMode);
    setNotifications(draft.notifications);
    setAiSuggestions(draft.aiSuggestions);
    return true;
  });
  return (
    <SettingsLayout title="App Preferences" onNavigate={guard.navigate} onBack={() => guard.navigate("/settings")}>
      <Text style={styles.notice}>Settings last for this app session only.</Text>
      <Preference label="Dark mode" detail={draft.darkMode ? "Dark" : "Light"} value={draft.darkMode} onChange={(value) => setDraft({ ...draft, darkMode: value })} dark={darkMode} />
      <Preference label="Notifications" detail="Enabling requests permission. No notifications are sent yet; disabling does not revoke device permission." value={draft.notifications} onChange={(value) => { setError(""); setDraft({ ...draft, notifications: value }); }} dark={darkMode} />
      <Preference label="AI Suggestions" detail="Show Gala suggestion bubbles on planning pages." value={draft.aiSuggestions} onChange={(value) => setDraft({ ...draft, aiSuggestions: value })} dark={darkMode} />
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {!!error && Platform.OS !== "web" && <Pressable accessibilityRole="button" onPress={() => { Linking.openSettings().catch((reason) => { console.error("Unable to open app settings:", reason); setError("Unable to open settings. Open your device settings and allow notifications for this app."); }); }}><Text style={styles.settingsLink}>Open device settings</Text></Pressable>}
      {changed && <Pressable accessibilityRole="button" onPress={guard.confirm} style={styles.apply}><Text style={styles.applyText}>Apply Changes</Text></Pressable>}
      <SaveChangesDialog visible={guard.dialog !== null} onClose={guard.close} onSave={() => { void guard.save(); }} onDiscard={guard.dialog === "leave" ? guard.leave : undefined} title={guard.dialog === "apply" ? "Are you sure?" : "Save changes?"} saveLabel={guard.dialog === "apply" ? "Apply Changes" : "Save Changes"} busy={guard.busy} message="Changes apply for this session only. Enabling notifications may request device or browser permission." />
    </SettingsLayout>
  );
}

function Preference({ label, detail, value, onChange, dark }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void; dark: boolean }) {
  const { width } = useWindowDimensions();
  const narrow = width < 400;
  return (
    <View style={[styles.row, dark && styles.darkRow, narrow && styles.narrowRow]}>
      <View style={styles.text}>
        <Text style={[styles.label, dark && styles.darkText]}>{label}</Text>
        <Text style={[styles.detail, dark && styles.darkDetail]}>{detail}</Text>
      </View>
      <View style={narrow && styles.narrowSwitch}>
        <PreferenceSwitch label={label} detail={detail} value={value} onChange={onChange} dark={dark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { color: "#ffffff", backgroundColor: "#333333", borderRadius: 10, padding: 8, textAlign: "center", fontFamily: "DMSans_400Regular", fontSize: 13 },
  row: { backgroundColor: "#ffffff", borderRadius: 14, padding: 15, minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12 },
  narrowRow: { flexDirection: "column", alignItems: "stretch", gap: 0 },
  narrowSwitch: { alignSelf: "flex-end" },
  darkRow: { backgroundColor: darkPalette.panel },
  text: { flex: 1, gap: 4 },
  label: { color: "#251e20", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#51484a", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  darkText: { color: "#ffffff" },
  darkDetail: { color: "#e5e5e5" },
  apply: { minHeight: 48, borderRadius: 24, backgroundColor: "#303030", alignItems: "center", justifyContent: "center", padding: 12 },
  applyText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  error: { color: "#ffffff", backgroundColor: "#782c28", borderRadius: 8, padding: 10, fontFamily: "DMSans_700Bold", fontSize: 14 },
  settingsLink: { color: "#ffffff", fontFamily: "DMSans_700Bold", textDecorationLine: "underline" },
});
