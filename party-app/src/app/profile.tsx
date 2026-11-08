import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ProfilePreview, useAppPreferences } from "../components/app-preferences";
import { isValidEmail } from "../components/auth-ui";
import { darkPalette } from "../components/dark-palette";
import { SaveChangesDialog } from "../components/save-changes-dialog";
import { SettingsLayout } from "../components/settings-layout";
import { useSettingsGuard } from "../components/use-settings-guard";

export default function ProfileScreen() {
  const { darkMode, profile, setProfile } = useAppPreferences();
  const [draft, setDraft] = useState(profile);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<"signout" | "delete" | null>(null);
  const [notice, setNotice] = useState("");
  const changed = draft.name !== profile.name || draft.phone !== profile.phone || draft.email !== profile.email || password !== "";
  const guard = useSettingsGuard(changed, async () => {
    if (!draft.name.trim()) { setNotice("Enter a full name."); return false; }
    if (draft.email && !isValidEmail(draft.email)) { setNotice("Enter a valid email address."); return false; }
    setProfile({ name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim() });
    setPassword("");
    return true;
  });

  function field(key: keyof ProfilePreview, label: string, placeholder: string) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} editable={editing} value={draft[key]} onChangeText={(value) => { setNotice(""); setDraft({ ...draft, [key]: value }); }} placeholder={placeholder} placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} autoCapitalize={key === "email" ? "none" : "words"} keyboardType={key === "email" ? "email-address" : key === "phone" ? "phone-pad" : "default"} style={[styles.input, darkMode && styles.darkInput]} />
      </View>
    );
  }

  function button(label: string, onPress: () => void) {
    return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, darkMode && styles.darkPanel]}><Text style={[styles.buttonText, darkMode && styles.darkAccent]}>{label}</Text></Pressable>;
  }

  return (
    <SettingsLayout title="Profile" onNavigate={guard.navigate} onBack={() => guard.navigate("/settings")}>
      <Text style={styles.notice}>Preview only. Do not enter real credentials. Profile details are kept only for this session; passwords are not saved.</Text>
      {field("name", "Full Name", "Enter a name")}
      {field("phone", "Phone Number", "Enter a phone number")}
      {field("email", "Email Address", "Enter an email address")}
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.passwordRow, darkMode && styles.darkPanel]}>
          <TextInput accessibilityLabel="Password" editable={editing} value={password} onChangeText={(value) => { setNotice(""); setPassword(value); }} secureTextEntry={!showPassword} placeholder="Example password only" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} autoCapitalize="none" autoCorrect={false} style={[styles.passwordInput, darkMode && styles.darkText]} />
          <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword(!showPassword)} style={styles.eye}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={darkMode ? darkPalette.text : "#533331"} /></Pressable>
        </View>
      </View>
      {!!notice && <Text style={styles.alert} accessibilityRole="alert">{notice}</Text>}
      {editing ? button("Apply Changes", () => { if (changed) guard.confirm(); else setEditing(false); }) : button("Edit Profile", () => { setNotice(""); setEditing(true); })}
      {button("Sign Out", () => setConfirmation("signout"))}
      {button("Delete Account", () => setConfirmation("delete"))}
      <SaveChangesDialog visible={guard.dialog !== null} onClose={guard.close} onSave={() => { void guard.save(); }} onDiscard={guard.dialog === "leave" ? guard.leave : undefined} title={guard.dialog === "apply" ? "Are you sure?" : "Save changes?"} saveLabel={guard.dialog === "apply" ? "Apply Changes" : "Save Changes"} busy={guard.busy} message="Profile details are a session-only preview. Passwords are not saved." />
      <SaveChangesDialog visible={confirmation !== null} title="Are you sure?" cancelLabel="Cancel" saveLabel={confirmation === "signout" ? "Sign Out" : "Delete Account"} message={confirmation === "signout" ? "Return to Sign In? This preview is not connected to an account." : "Account deletion is not connected. No account will be deleted."} onClose={() => setConfirmation(null)} onSave={() => {
        const action = confirmation;
        setConfirmation(null);
        if (action === "signout") guard.navigate("/login");
        else setNotice("Account deletion is not connected. No account was deleted.");
      }} />
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  notice: { color: "#ffffff", backgroundColor: "#333333", borderRadius: 10, padding: 10, fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  field: { gap: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  input: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", color: "#1e1e1e", paddingHorizontal: 12, fontFamily: "DMSans_400Regular", fontSize: 16 },
  passwordRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 10 },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 12, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  eye: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
  alert: { color: "#ffffff", backgroundColor: "#782c28", borderRadius: 8, padding: 10, fontFamily: "DMSans_700Bold", fontSize: 14 },
});
