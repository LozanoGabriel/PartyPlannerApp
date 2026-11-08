import { useState } from "react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { DashboardLayout } from "../components/dashboard-layout";
import { darkPalette } from "../components/dark-palette";
import { useEventPreview } from "../components/event-preview-context";
import { GatherBrand } from "../components/gather-brand";

type Response = "attending" | "declined" | "maybe";
const responses: { value: Response; label: string }[] = [
  { value: "attending", label: "Will be attending" },
  { value: "declined", label: "Won't be attending" },
  { value: "maybe", label: "Maybe" },
];
const invitation = require("../../assets/images/RSVP_mockup.webp");

function calendarDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export default function RsvpScreen() {
  const { darkMode } = useAppPreferences();
  const { event } = useEventPreview();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [response, setResponse] = useState<Response | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [note, setNote] = useState("");
  const [previewed, setPreviewed] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  async function openCalendar() {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Follow up on the event invitation")}&dates=${calendarDate(start)}%2F${calendarDate(end)}`;
    setError("");
    try {
      await Linking.openURL(url);
    } catch (calendarError) {
      console.error("Unable to open the calendar:", calendarError);
      setError("Could not open Google Calendar. Please add a reminder manually.");
    }
  }

  return (
    <DashboardLayout showNavigation={false}>
      <GatherBrand />
      <View style={styles.panel}>
        <Text style={styles.title} accessibilityRole="header">You&apos;re invited!</Text>
        {imageError ? <Text style={styles.notice} accessibilityRole="alert">Unable to display the sample invitation artwork.</Text> : <Image source={invitation} style={styles.artwork} contentFit="contain" accessibilityLabel="Example birthday invitation artwork; its details are illustrative" onError={(event) => { console.error("Unable to load invitation artwork:", event.error); setImageError(true); }} />}
        <Text style={styles.artCaption}>Sample artwork · Details in the image are illustrative</Text>
        <Text style={styles.intro}>A sample invitation for {event.name}</Text>
        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Event details</Text>
          <Text style={[styles.details, darkMode && styles.darkText]}>Saturday, December 5, 2026 · 5:00 PM</Text>
          <Text style={[styles.details, darkMode && styles.darkText]}>Birthday Celebration</Text>
          <Text style={[styles.details, darkMode && styles.darkText]}>Location to be announced</Text>
        </View>
        <Text style={styles.heading}>Will you be joining us?</Text>
        <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="RSVP response">
          {responses.map(({ value, label }) => (
            <Pressable key={value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: response === value }} aria-checked={response === value} onPress={() => { setResponse(value); setPreviewed(false); setError(""); }} style={[styles.choice, styles.responseChoice, darkMode && styles.darkCard, response === value && styles.selected, response === value && darkMode && styles.darkSelected]}>
              <Text style={[styles.choiceText, styles.responseText, darkMode && styles.darkText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {response === "attending" && (
          <Pressable accessibilityRole="checkbox" accessibilityLabel="A plus one will be attending" accessibilityState={{ checked: plusOne }} aria-checked={plusOne} onPress={() => { setPlusOne(!plusOne); setPreviewed(false); }} style={[styles.choice, darkMode && styles.darkCard]}>
            <Text style={[styles.choiceText, darkMode && styles.darkText]}>{plusOne ? "☑" : "☐"} A plus one will be attending</Text>
          </Pressable>
        )}
        {response === "maybe" && (
          <View style={[styles.card, darkMode && styles.darkCard]}>
            <Text style={[styles.details, darkMode && styles.darkText]}>You can add a personal follow-up reminder for one week from today. This opens Google Calendar; nothing is added until you save it there.</Text>
            <Pressable accessibilityRole="link" onPress={() => { void openCalendar(); }} style={styles.calendarLink}>
              <Text style={[styles.linkText, darkMode && styles.darkAccent]}>Add a follow-up reminder</Text>
            </Pressable>
            <Text style={[styles.details, darkMode && styles.darkText]}>The host will not be notified or reminded in this preview.</Text>
          </View>
        )}
        <Text style={styles.heading}>Dietary restrictions (optional)</Text>
        <TextInput accessibilityLabel="Dietary restrictions" multiline value={dietaryNotes} onChangeText={(text) => { setDietaryNotes(text); setPreviewed(false); }} placeholder="Let the host know about any dietary needs" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.input, darkMode && styles.darkCard, darkMode && styles.darkText]} />
        <Text style={styles.heading}>A note for the host (optional)</Text>
        <TextInput accessibilityLabel="Note for the host" multiline value={note} onChangeText={(text) => { setNote(text); setPreviewed(false); }} placeholder="Add a note..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.input, darkMode && styles.darkCard, darkMode && styles.darkText]} />
        {!!error && <Text style={styles.notice} accessibilityRole="alert">{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => { if (!response) { setError("Choose a response to preview your RSVP."); return; } setError(""); setPreviewed(true); }} style={[styles.submit, darkMode && styles.darkCard]}>
          <Text style={[styles.submitText, darkMode && styles.darkAccent]}>Preview response</Text>
        </Pressable>
        {previewed && <Text style={styles.notice} accessibilityLiveRegion="polite">Response previewed. No RSVP or notes were saved or sent to the host.</Text>}
        <Text style={styles.notice}>This is a sample invitation. Responses and notes are not saved or sent. The plus-one option is shown as an example.</Text>
      </View>
      {(from === "events" || from === "guest-list") && (
        <Pressable accessibilityRole="link" onPress={() => router.replace(from === "events" ? "/events" : "/guest-list")} style={[styles.back, darkMode && styles.darkCard]}>
          <Text style={[styles.submitText, darkMode && styles.darkAccent]}>{from === "events" ? "Back to My Event" : "Back to Guest List"}</Text>
        </Pressable>
      )}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#c65d58", borderRadius: 32, padding: 18, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  intro: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  artwork: { width: "100%", aspectRatio: 1135 / 1600, alignSelf: "center", borderRadius: 16, overflow: "hidden" },
  artCaption: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, textAlign: "center" },
  heading: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 8 },
  darkCard: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  cardTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 18 },
  details: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 15, lineHeight: 21 },
  choices: { flexDirection: "row", gap: 6 },
  choice: { minHeight: 48, justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: "transparent" },
  responseChoice: { flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: 8 },
  responseText: { textAlign: "center", fontSize: 13 },
  selected: { borderColor: "#4b2826" },
  darkSelected: { borderColor: darkPalette.accent },
  choiceText: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 15 },
  input: { minHeight: 76, borderRadius: 12, backgroundColor: "#ffffff", color: "#1e1e1e", padding: 12, fontFamily: "DMSans_400Regular", fontSize: 16, textAlignVertical: "top" },
  calendarLink: { minHeight: 44, justifyContent: "center" },
  linkText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
  submit: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  submitText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
  back: { minHeight: 48, marginTop: 12, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 19 },
});
