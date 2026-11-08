import { router, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { EventPreview, useEventPreview } from "../components/event-preview-context";
import { SaveChangesDialog } from "../components/save-changes-dialog";

const fields: { key: Exclude<keyof EventPreview, "imageUri">; label: string; hint?: string }[] = [
  { key: "name", label: "Event Name" },
  { key: "duration", label: "Event Duration (hours)" },
  { key: "foods", label: "Food Preferences", hint: "Separate items with commas." },
  { key: "drinks", label: "Drink Preferences", hint: "Separate items with commas." },
];

function validationError(event: EventPreview) {
  if (!event.name.trim()) return "Enter an event name.";
  if (!/^\d+$/.test(event.duration) || Number(event.duration) < 1 || Number(event.duration) > 168) return "Enter a duration from 1 to 168 hours.";
  if (!event.foods.split(",").some((item) => item.trim()) || !event.drinks.split(",").some((item) => item.trim())) return "Enter at least one food and one drink.";
  return "";
}

export default function EditEventScreen() {
  const { event, setEvent } = useEventPreview();
  const [draft, setDraft] = useState(event);
  const [dialog, setDialog] = useState<"save" | "leave" | null>(null);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const allowLeave = useRef(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const navigation = useNavigation();
  const changed = draft.imageUri !== event.imageUri || fields.some(({ key }) => draft[key] !== event[key]);

  useEffect(() => navigation.addListener("beforeRemove", (e) => {
    if (!changed || allowLeave.current) return;
    e.preventDefault();
    pendingAction.current = () => navigation.dispatch(e.data.action);
    setDialog("leave");
  }), [changed, navigation]);

  useEffect(() => {
    if (Platform.OS !== "web" || !changed) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);

  function leave() {
    allowLeave.current = true;
    setDialog(null);
    if (pendingAction.current) {
      pendingAction.current();
    } else {
      router.replace("/events");
    }
  }

  function save() {
    const message = validationError(draft);
    if (message) {
      setError(message);
      setDialog(null);
      return;
    }
    setEvent({ ...draft, name: draft.name.trim(), foods: draft.foods.trim(), drinks: draft.drinks.trim() });
    leave();
  }

  function goBack() {
    if (changed) {
      pendingAction.current = null;
      setDialog("leave");
    } else {
      router.replace("/events");
    }
  }

  function keepEditing() {
    pendingAction.current = null;
    setDialog(null);
  }

  async function chooseImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (!result.canceled) {
        setDraft((current) => ({ ...current, imageUri: result.assets[0].uri }));
        setImageError("");
      }
    } catch (pickerError) {
      console.error("Failed to select an event image:", pickerError);
      setImageError("Unable to select an image. Check your photo permissions and try again.");
    }
  }

  return (
    <DashboardLayout showNavigation={false}>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">Edit Event</Text>
        <Text style={styles.notice}>Preview only: changes stay on this device until the app reloads. No event is saved to a server.</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Event Image</Text>
          {draft.imageUri && <Image source={{ uri: draft.imageUri }} style={styles.image} resizeMode="cover" accessibilityLabel="Selected event image" onError={(event) => { console.error("Failed to load event image:", event.nativeEvent.error); setImageError("Unable to display this image. Please choose another one."); }} />}
          <Pressable accessibilityRole="button" onPress={chooseImage} style={styles.assetPlaceholder}>
            <Text style={styles.placeholderText}>{draft.imageUri ? "Change image" : "Choose an image"}</Text>
          </Pressable>
          {draft.imageUri && <Pressable accessibilityRole="button" onPress={() => { setDraft({ ...draft, imageUri: null }); setImageError(""); }} style={styles.removeImage}><Text style={styles.backText}>Remove image</Text></Pressable>}
          <Text style={styles.hint}>Image preview only; not uploaded or saved to a server.</Text>
          {!!imageError && <Text style={styles.error} accessibilityRole="alert">{imageError}</Text>}
        </View>
        {fields.map(({ key, label, hint }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              value={draft[key]}
              onChangeText={(value) => { setDraft({ ...draft, [key]: value }); setError(""); }}
              keyboardType={key === "duration" ? "number-pad" : "default"}
              maxLength={key === "duration" ? 3 : 200}
              style={styles.input}
            />
            {hint && <Text style={styles.hint}>{hint}</Text>}
          </View>
        ))}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !changed }} disabled={!changed} onPress={() => setDialog("save")} style={[styles.button, !changed && styles.disabled]}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>Back to My Event</Text>
        </Pressable>
      </View>
      <SaveChangesDialog visible={dialog !== null} onClose={keepEditing} onSave={save} onDiscard={dialog === "leave" ? leave : undefined} message="Changes are kept only for this preview and will be lost when the app reloads." />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#c65d58", borderRadius: 32, padding: 20, gap: 14 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18, textAlign: "center" },
  assetPlaceholder: { minHeight: 48, borderWidth: 1, borderStyle: "dashed", borderColor: "#ffffff", borderRadius: 16, alignItems: "center", justifyContent: "center", padding: 12 },
  placeholderText: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  image: { width: "100%", height: 150, borderRadius: 16 },
  removeImage: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  field: { gap: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  input: { backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, minHeight: 48, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  hint: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
  back: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
});
