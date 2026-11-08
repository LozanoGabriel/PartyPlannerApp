import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { DashboardLayout } from "../components/dashboard-layout";
import { darkPalette } from "../components/dark-palette";
import { useEventPreview } from "../components/event-preview-context";
import { GatherBrand } from "../components/gather-brand";
import { getPublicInvitation, PublicInvitation, submitPublicRSVP } from "../lib/invitations-api";

type Response = "attending" | "declined" | "maybe";
const responses: { value: Response; label: string }[] = [
  { value: "attending", label: "Will be attending" },
  { value: "declined", label: "Won't be attending" },
  { value: "maybe", label: "Maybe" },
];
const invitation = require("../../assets/images/RSVP_mockup.webp");

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function displayDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}

function calendarDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export default function RsvpScreen() {
  const { darkMode } = useAppPreferences();
  const { event } = useEventPreview();
  const params = useLocalSearchParams<{ from?: string; eventId?: string | string[]; token?: string | string[] }>();
  const from = firstParam(params.from);
  const eventId = firstParam(params.eventId);
  const token = firstParam(params.token);
  const hasInviteParams = Boolean(params.eventId || params.token);
  const isInvitation = Boolean(eventId && token);
  const [invitationData, setInvitationData] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<Response | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [note, setNote] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [taskAnswers, setTaskAnswers] = useState<Record<string, boolean>>({});
  const [previewed, setPreviewed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isInvitation || !eventId || !token) return;
    let active = true;
    setLoading(true);
    getPublicInvitation(eventId, token).then((page) => {
      if (!active) return;
      setInvitationData(page);
      setResponse(page.guest.rsvpStatus === "pending" ? null : page.guest.rsvpStatus);
      setPlusOne(page.guest.plusOneAttending ?? false);
      setDietaryNotes(page.guest.dietaryNotes ?? "");
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load this invitation.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [eventId, isInvitation, token]);

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

  async function submitResponse() {
    if (!response) {
      setError("Choose a response before submitting your RSVP.");
      return;
    }
    if (!eventId || !token) return;
    setLoading(true);
    setError("");
    try {
      const answers = Object.entries(customAnswers)
        .map(([question, answer]) => ({ question, answer: answer.trim() }))
        .filter((answer) => answer.answer.length > 0);
      if (note.trim()) answers.push({ question: "Note for the host", answer: note.trim() });
      await submitPublicRSVP(eventId, token, {
        rsvpStatus: response,
        ...(invitationData?.guest.plusOneAllowed && { plusOneAttending: response === "attending" && plusOne }),
        ...(invitationData?.invitation.askDietary && { dietaryNotes }),
        taskResponses: Object.entries(taskAnswers).map(([taskId, accepted]) => ({ taskId, accepted })),
        answers,
      });
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your RSVP.");
    } finally {
      setLoading(false);
    }
  }

  function setResponseValue(value: Response) {
    setResponse(value);
    setPreviewed(false);
    setSaved(false);
    setError("");
  }

  const customQuestions = invitationData?.invitation.customQuestions ?? [];
  const startTime = displayDate(invitationData?.event.startTime ?? null);
  const endTime = displayDate(invitationData?.event.endTime ?? null);

  return (
    <DashboardLayout showNavigation={false}>
      <GatherBrand />
      <View style={styles.panel}>
        {hasInviteParams ? (
          <>
            <Text style={styles.title} accessibilityRole="header">
              {invitationData ? `You're invited, ${invitationData.guest.name}!` : "You're invited!"}
            </Text>
            {loading && !invitationData && <Text style={styles.notice}>Loading invitation...</Text>}
            {!eventId || !token ? (
              <Text style={styles.notice} accessibilityRole="alert">This invitation link is incomplete.</Text>
            ) : invitationData ? (
              <>
                {!!invitationData.invitation.introMessage && <Text style={styles.intro}>{invitationData.invitation.introMessage}</Text>}
                <View style={[styles.card, darkMode && styles.darkCard]}>
                  <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Event details</Text>
                  <Text style={[styles.cardTitle, darkMode && styles.darkText]}>{invitationData.event.name}</Text>
                  {!!invitationData.event.eventType && <Text style={[styles.details, darkMode && styles.darkText]}>{invitationData.event.eventType}</Text>}
                  {!!startTime && <Text style={[styles.details, darkMode && styles.darkText]}>Starts: {startTime}</Text>}
                  {!!endTime && <Text style={[styles.details, darkMode && styles.darkText]}>Ends: {endTime}</Text>}
                  {!!invitationData.event.address && <Text style={[styles.details, darkMode && styles.darkText]}>{invitationData.event.address}</Text>}
                  {!!invitationData.event.description && <Text style={[styles.details, darkMode && styles.darkText]}>{invitationData.event.description}</Text>}
                  {!!invitationData.invitation.dressCode && <Text style={[styles.details, darkMode && styles.darkText]}>Dress code: {invitationData.invitation.dressCode}</Text>}
                  {!!invitationData.invitation.parkingInfo && <Text style={[styles.details, darkMode && styles.darkText]}>Parking: {invitationData.invitation.parkingInfo}</Text>}
                  {!!invitationData.invitation.contactName && <Text style={[styles.details, darkMode && styles.darkText]}>Contact: {invitationData.invitation.contactName}{invitationData.invitation.contactPhone ? ` · ${invitationData.invitation.contactPhone}` : ""}</Text>}
                </View>
                <Text style={styles.heading}>Will you be joining us?</Text>
                <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel="RSVP response">
                  {responses.map(({ value, label }) => (
                    <Pressable key={value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: response === value }} aria-checked={response === value} disabled={invitationData.event.rsvpClosed || loading} onPress={() => setResponseValue(value)} style={[styles.choice, styles.responseChoice, darkMode && styles.darkCard, response === value && styles.selected, response === value && darkMode && styles.darkSelected]}>
                      <Text style={[styles.choiceText, styles.responseText, darkMode && styles.darkText]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                {response === "attending" && invitationData.guest.plusOneAllowed && (
                  <Pressable accessibilityRole="checkbox" accessibilityLabel="A plus one will be attending" accessibilityState={{ checked: plusOne }} aria-checked={plusOne} disabled={invitationData.event.rsvpClosed || loading} onPress={() => { setPlusOne(!plusOne); setSaved(false); }} style={[styles.choice, darkMode && styles.darkCard]}>
                    <Text style={[styles.choiceText, darkMode && styles.darkText]}>{plusOne ? "☑" : "☐"} A plus one will be attending</Text>
                  </Pressable>
                )}
                {!!invitationData.tasks.length && <>
                  <Text style={styles.heading}>Assigned tasks</Text>
                  {invitationData.tasks.map((task) => (
                    <View key={task.id} style={[styles.task, darkMode && styles.darkCard]}>
                      <Text style={[styles.details, darkMode && styles.darkText]}>{task.title}</Text>
                      <View style={styles.taskChoices}>
                        {[true, false].map((accepted) => (
                          <Pressable key={String(accepted)} accessibilityRole="radio" accessibilityState={{ checked: taskAnswers[task.id] === accepted }} onPress={() => { setTaskAnswers((current) => ({ ...current, [task.id]: accepted })); setSaved(false); }} style={[styles.taskChoice, taskAnswers[task.id] === accepted && styles.selected]}>
                            <Text style={[styles.linkText, darkMode && styles.darkAccent]}>{accepted ? "Accept" : "Decline"}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </>}
                {invitationData.invitation.askDietary && <>
                  <Text style={styles.heading}>Dietary restrictions (optional)</Text>
                  <TextInput accessibilityLabel="Dietary restrictions" multiline value={dietaryNotes} onChangeText={(text) => { setDietaryNotes(text); setSaved(false); }} placeholder="Let the host know about any dietary needs" placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.input, darkMode && styles.darkCard, darkMode && styles.darkText]} />
                </>}
                {customQuestions.map((question) => (
                  <View key={question} style={styles.question}>
                    <Text style={styles.heading}>{question}</Text>
                    <TextInput accessibilityLabel={question} multiline value={customAnswers[question] ?? ""} onChangeText={(text) => { setCustomAnswers((current) => ({ ...current, [question]: text })); setSaved(false); }} style={[styles.input, darkMode && styles.darkCard, darkMode && styles.darkText]} />
                  </View>
                ))}
                <Text style={styles.heading}>A note for the host (optional)</Text>
                <TextInput accessibilityLabel="Note for the host" multiline value={note} onChangeText={(text) => { setNote(text); setSaved(false); }} placeholder="Add a note..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"} style={[styles.input, darkMode && styles.darkCard, darkMode && styles.darkText]} />
                {response === "maybe" && <Pressable accessibilityRole="link" onPress={() => { void openCalendar(); }} style={styles.calendarLink}><Text style={[styles.linkText, darkMode && styles.darkAccent]}>Add a follow-up reminder</Text></Pressable>}
                {invitationData.event.rsvpClosed && <Text style={styles.notice}>The RSVP deadline has passed.</Text>}
                {!!error && <Text style={styles.notice} accessibilityRole="alert">{error}</Text>}
                {saved && <Text style={styles.notice} accessibilityLiveRegion="polite">Your RSVP has been saved.</Text>}
                <Pressable accessibilityRole="button" disabled={loading || invitationData.event.rsvpClosed} onPress={() => { void submitResponse(); }} style={[styles.submit, darkMode && styles.darkCard]}>
                  <Text style={[styles.submitText, darkMode && styles.darkAccent]}>{loading ? "Saving..." : saved ? "Update RSVP" : "Submit RSVP"}</Text>
                </Pressable>
              </>
            ) : null}
          </>
        ) : (
          <>
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
                <Pressable key={value} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: response === value }} aria-checked={response === value} onPress={() => setResponseValue(value)} style={[styles.choice, styles.responseChoice, darkMode && styles.darkCard, response === value && styles.selected, response === value && darkMode && styles.darkSelected]}>
                  <Text style={[styles.choiceText, styles.responseText, darkMode && styles.darkText]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {response === "attending" && (
              <Pressable accessibilityRole="checkbox" accessibilityLabel="A plus one will be attending" accessibilityState={{ checked: plusOne }} aria-checked={plusOne} onPress={() => setPlusOne(!plusOne)} style={[styles.choice, darkMode && styles.darkCard]}>
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
          </>
        )}
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
  question: { gap: 8 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 8 },
  task: { backgroundColor: "#ffffff", borderRadius: 12, padding: 12, gap: 8 },
  taskChoices: { flexDirection: "row", gap: 16 },
  taskChoice: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderColor: "transparent", borderRadius: 8 },
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
