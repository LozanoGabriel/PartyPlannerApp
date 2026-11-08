import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { EventSelector } from "../components/event-selector";
import { GatherBrand } from "../components/gather-brand";
import { speechRecognition } from "../components/speech-recognition";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { EventRecord, getEvents } from "../lib/events-api";
import { askGala } from "../lib/gala-api";
import type { GalaConversationEntry } from "../lib/gala-conversation";
import type { GalaResponse } from "../lib/gala-api";

const gala = require("../../assets/images/gala_front_facing.png");
const thinkingGala = require("../../assets/images/gala_thinking.png");

const suggestions = [
  { title: "Plan an event", detail: "Start organizing something new" },
  { title: "Manage my budget", detail: "Get budget ideas and estimates" },
  { title: "Guest suggestions", detail: "Organize guests and invitations" },
  { title: "Get inspiration", detail: "Themes, activities, and ideas" },
];

type Message = { id: number; speaker: "You" | "Gala"; text: string; attachment?: string };

export default function GalaScreen() {
  const { darkMode } = useAppPreferences();
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [permissionHelp, setPermissionHelp] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<GalaConversationEntry[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [sending, setSending] = useState(false);
  const [dictation, setDictation] = useState<"idle" | "starting" | "listening" | "stopping">("idle");
  const dictationActive = useRef(false);
  const requestId = useRef(0);
  const nextId = useRef(0);
  const chatRef = useRef<ScrollView>(null);
  const pageRef = useRef<ScrollView>(null);
  const scrollToReply = useRef(false);

  useEffect(() => {
    let active = true;
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      setSelectedEventId("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load your events.");
    }).finally(() => { if (active) setLoadingEvents(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    const recognizer = speechRecognition;
    if (!recognizer) return;
    const subscriptions = [
      recognizer.addListener("start", () => {
        if (dictationActive.current) setDictation("listening");
      }),
      recognizer.addListener("result", (event) => {
        const transcript = event.results[0]?.transcript.trim();
        if (dictationActive.current && event.isFinal && transcript) {
          setDraft((current) => current + (current && !/\s$/.test(current) ? " " : "") + transcript);
        }
      }),
      recognizer.addListener("error", (event) => {
        if (!dictationActive.current) return;
        console.error("Speech recognition error:", event.error, event.message);
        const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
        setPermissionHelp(denied);
        if (denied) scrollToReply.current = true;
        setError(denied
          ? "Microphone or speech recognition access was denied."
          : event.error === "no-speech" || event.error === "speech-timeout"
            ? "No speech was detected. Please try again."
            : "Speech recognition could not complete. Check your connection and try again.");
        setDictation("stopping");
      }),
      recognizer.addListener("end", () => {
        dictationActive.current = false;
        setDictation("idle");
      }),
    ];
    return () => {
      requestId.current += 1;
      if (dictationActive.current) {
        dictationActive.current = false;
        recognizer.abort();
      }
      subscriptions.forEach((subscription) => subscription.remove());
      setDictation("idle");
    };
  }, []));

  async function toggleDictation() {
    if (dictation === "listening") {
      setDictation("stopping");
      speechRecognition?.stop();
      return;
    }
    if (dictation !== "idle") return;
    setError("");
    setPermissionHelp(false);
    if (!speechRecognition || !speechRecognition.isRecognitionAvailable()) {
      setError("Speech recognition is unavailable. Use a supported browser or rebuild the native app.");
      return;
    }
    const currentRequest = ++requestId.current;
    setDictation("starting");
    try {
      if (Platform.OS !== "web") {
        const permission = await speechRecognition.requestPermissionsAsync();
        if (currentRequest !== requestId.current) return;
        if (!permission.granted) {
          scrollToReply.current = true;
          setPermissionHelp(true);
          setError("Microphone or speech recognition access was denied.");
          setDictation("idle");
          return;
        }
      }
      dictationActive.current = true;
      speechRecognition.start({ interimResults: false, continuous: false });
    } catch (reason) {
      if (currentRequest !== requestId.current) return;
      console.error("Unable to start speech recognition:", reason);
      dictationActive.current = false;
      setDictation("idle");
      setError("Unable to start speech recognition. Please try again.");
    }
  }

  async function openPermissionSettings() {
    try {
      await Linking.openSettings();
    } catch (reason) {
      console.error("Unable to open app settings:", reason);
      setError("Unable to open app settings. Open your device settings and find this app's permissions.");
    }
  }

  async function send(suggestion?: string) {
    const text = (suggestion ?? draft).trim();
    if ((!text && !attachment) || sending) return;
    const event = events.find((item) => item.id === selectedEventId);
    if (!event) {
      setError("Choose an event before sending a message to Gala.");
      return;
    }

    const file = attachment;
    const request = [
      text,
      file ? `The user attached "${file}", but its contents were not uploaded and are unavailable. Do not claim to have reviewed it; ask the user to describe it if needed.` : "",
    ].filter(Boolean).join("\n\n");
    setMessages((current) => [...current, {
      id: nextId.current++,
      speaker: "You",
      text: text || "Please consider the selected attachment.",
      attachment: file || undefined,
    }]);
    setDraft("");
    setAttachment(null);
    setError("");
    setPermissionHelp(false);
    setSending(true);
    try {
      const answer: GalaResponse = await askGala("Prompt", {
        name: event.name,
        eventType: event.event_type,
        startTime: event.start_time,
        endTime: event.end_time,
        rsvpDeadline: event.rsvp_deadline,
        expectedHeadcount: event.expected_headcount,
        totalBudget: event.total_budget,
        address: event.address,
        description: event.description,
      }, request || undefined, history.slice(-8));
      setHistory((current) => [...current, {
        context: "Prompt",
        ...(request ? { userPrompt: request } : {}),
        assistantResponse: answer.english_response,
      }]);
      setMessages((current) => [...current, { id: nextId.current++, speaker: "Gala", text: answer.english_response }]);
      scrollToReply.current = true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gala could not respond.");
    } finally {
      setSending(false);
    }
  }

  function chooseSuggestion(title: string, detail: string) {
    void send(`${title}: ${detail}`);
  }

  async function pickAttachment() {
    if (picking) return;
    setPicking(true);
    setError("");
    setPermissionHelp(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: false,
        copyToCacheDirectory: false,
        base64: false,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        if (!file || !(file.mimeType?.startsWith("image/") || file.mimeType === "application/pdf" || (!file.mimeType && /\.(pdf|png|jpe?g|gif|webp|heic|heif)$/i.test(file.name)))) {
          setError("Please choose an image or PDF.");
        } else {
          setAttachment(file.name);
        }
      }
    } catch (reason) {
      console.error("Unable to select an attachment:", reason);
      setError("Unable to open the file picker. Please try again.");
    } finally {
      setPicking(false);
    }
  }

  return (
    <DashboardLayout active="Gala" compactContent scrollRef={pageRef} onContentSizeChange={() => {
      if (scrollToReply.current) {
        scrollToReply.current = false;
        pageRef.current?.scrollToEnd({ animated: true });
      }
    }}>
      <View style={[styles.brandSpacing, narrow && styles.narrowBrandSpacing]}><GatherBrand compact={narrow} /></View>
      <View style={[styles.container, narrow && styles.narrowContainer]}>
        <Text style={styles.title} accessibilityRole="header">Chat with Gala</Text>
        <View style={[styles.heroFrame, narrow && styles.narrowHeroFrame]}>
          <Image source={sending ? thinkingGala : gala} style={[styles.hero, narrow && styles.narrowHero]} resizeMode="contain" accessibilityLabel={sending ? "Gala is thinking" : "Gala the elephant"} />
        </View>
        <Text style={styles.greeting} accessibilityRole="header">Hi! I&apos;m Gala.</Text>
        <Text style={styles.subtitle}>Your personal planning companion. Let&apos;s make something wonderful happen!</Text>
        <Text style={styles.sectionTitle} accessibilityRole="header">What can I help you with?</Text>
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.detail}`} accessibilityState={{ disabled: sending }} disabled={sending} onPress={() => chooseSuggestion(item.title, item.detail)} style={({ pressed }) => [styles.suggestion, darkMode && styles.darkPanel, narrow && styles.narrowSuggestion, pressed && styles.pressed]}>
              <Text style={[styles.suggestionTitle, narrow && styles.narrowSuggestionTitle, darkMode && styles.darkText]}>{item.title}</Text>
              <Text style={[styles.suggestionDetail, narrow && styles.narrowSuggestionDetail, darkMode && styles.darkText]}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        {messages.length > 0 && (
          <ScrollView ref={chatRef} style={styles.conversation} contentContainerStyle={styles.messageList} nestedScrollEnabled keyboardShouldPersistTaps="handled" onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })} accessibilityLabel="Preview conversation">
            {messages.map((message) => (
              <View key={message.id} style={[styles.message, message.speaker === "You" ? styles.userMessage : styles.galaMessage, darkMode && styles.darkPanel]}>
                {message.speaker === "Gala" ? <View style={styles.messageHeader}><Image source={sending ? thinkingGala : gala} style={styles.messageGala} resizeMode="contain" accessible={false} /><Text style={[styles.messageAuthor, darkMode && styles.darkText]}>Gala</Text></View> : <Text style={[styles.messageAuthor, darkMode && styles.darkText]}>You</Text>}
                {!!message.text && <Text style={[styles.messageText, darkMode && styles.darkText]}>{message.text}</Text>}
                {message.attachment && <Text style={[styles.attachmentText, darkMode && styles.darkText]}>Attachment: {message.attachment} (not sent)</Text>}
              </View>
            ))}
            {sending && (
              <View style={[styles.message, styles.galaMessage, styles.thinkingMessage, darkMode && styles.darkPanel]} accessibilityLiveRegion="polite">
                <View style={styles.messageHeader}>
                  <Image source={thinkingGala} style={styles.messageGala} resizeMode="contain" accessible={false} />
                  <Text style={[styles.messageAuthor, darkMode && styles.darkText]}>Gala</Text>
                </View>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={darkMode ? darkPalette.accent : "#a43f3a"} />
                  <Text style={[styles.messageText, darkMode && styles.darkText]}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        <View style={[styles.composer, darkMode && styles.darkPanel]}>
          {attachment && <View style={styles.attachmentRow}>
            <Text style={[styles.attachmentName, darkMode && styles.darkText]} numberOfLines={1}>{attachment}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setAttachment(null)} style={styles.iconButton}><Ionicons name="close-circle" size={22} color={darkMode ? darkPalette.accent : "#a43f3a"} /></Pressable>
          </View>}
          <TextInput accessibilityLabel="Message Gala" value={draft} onChangeText={setDraft} placeholder="Ask Gala anything..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#766966"} multiline maxLength={1800} style={[styles.input, darkMode && styles.darkText]} />
          <View style={styles.composerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Attach an image or PDF" accessibilityState={{ disabled: picking }} disabled={picking} onPress={() => { void pickAttachment(); }} style={styles.iconButton}><Ionicons name="attach-outline" size={24} color={darkMode ? darkPalette.text : "#5f514e"} /></Pressable>
            {loadingEvents
              ? <Text style={[styles.eventHint, darkMode && styles.darkText]}>Loading events...</Text>
              : events.length > 0
                ? <EventSelector events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} label="Choose an event (required)" compact />
                : <Text style={[styles.eventHint, darkMode && styles.darkText]}>Create an event first</Text>}
            <View style={styles.rightActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={dictation === "listening" ? "Stop dictation" : "Start dictation"} accessibilityHint="Speech may be processed by your device or browser's speech provider." accessibilityState={{ disabled: dictation === "starting" || dictation === "stopping", selected: dictation === "listening" }} disabled={dictation === "starting" || dictation === "stopping"} onPress={() => { void toggleDictation(); }} style={styles.iconButton}><Ionicons name={dictation === "listening" ? "stop-circle" : "mic-outline"} size={24} color={darkMode ? (dictation === "listening" ? darkPalette.accent : darkPalette.text) : (dictation === "listening" ? "#a43f3a" : "#5f514e")} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Send message to Gala" accessibilityState={{ disabled: (!draft.trim() && !attachment) || dictation !== "idle" || !selectedEventId || sending }} disabled={(!draft.trim() && !attachment) || dictation !== "idle" || !selectedEventId || sending} onPress={() => { void send(); }} style={[styles.send, ((!draft.trim() && !attachment) || dictation !== "idle" || !selectedEventId || sending) && styles.sendDisabled]}><Ionicons name="arrow-up" size={22} color="#ffffff" /></Pressable>
            </View>
          </View>
        </View>
        {dictation !== "idle" && <Text style={styles.preview} accessibilityLiveRegion="polite">{dictation === "listening" ? "Listening... Tap the microphone to finish." : dictation === "starting" ? "Starting dictation..." : "Finishing dictation..."}</Text>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {permissionHelp && <View style={styles.permissionHelp}>
          <Text style={styles.permissionText}>{Platform.OS === "web"
            ? "Use the site controls beside the browser address bar to allow microphone access. Also check your browser and device microphone settings, then reload and try again. Speech recognition support varies by browser."
            : Platform.OS === "ios"
              ? "Open app settings and allow Microphone and Speech Recognition. Return here and tap the microphone again."
              : "Open app settings, then Permissions, and allow Microphone. Return here and tap the microphone again."}</Text>
          {Platform.OS !== "web" && <Pressable accessibilityRole="button" onPress={() => { void openPermissionSettings(); }} style={[styles.settingsButton, darkMode && styles.darkPanel]}><Text style={[styles.settingsButtonText, darkMode && styles.darkAccent]}>Open app settings</Text></Pressable>}
        </View>}
        <Text style={styles.preview}>Choose an event to chat with Gala. Attachments stay on this device and are not reviewed.</Text>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  brandSpacing: { marginBottom: 4 },
  narrowBrandSpacing: { marginBottom: 2 },
  container: { backgroundColor: "#c65d58", borderRadius: 28, padding: 14, gap: 6 },
  narrowContainer: { padding: 10, gap: 4 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 23, textAlign: "center" },
  heroFrame: { height: 100, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  narrowHeroFrame: { height: 80 },
  hero: { width: 200, height: 200 },
  narrowHero: { width: 160, height: 160 },
  greeting: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 21, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 18, textAlign: "center" },
  preview: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11, lineHeight: 14, textAlign: "center" },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 17, marginTop: 2 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestion: { width: "48%", flexGrow: 1, minHeight: 76, backgroundColor: "#ffffff", borderRadius: 14, padding: 10, gap: 3 },
  narrowSuggestion: { minHeight: 68, padding: 8, gap: 2 },
  narrowSuggestionTitle: { fontSize: 14 },
  narrowSuggestionDetail: { fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.75 },
  suggestionTitle: { color: "#2c2422", fontFamily: "DMSans_700Bold", fontSize: 15 },
  suggestionDetail: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  conversation: { maxHeight: 280 },
  messageList: { gap: 10, paddingVertical: 4 },
  message: { maxWidth: "95%", borderRadius: 16, padding: 12, gap: 5 },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#f7e1dc" },
  galaMessage: { alignSelf: "flex-start", backgroundColor: "#ffffff" },
  messageHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  messageGala: { width: 36, height: 36 },
  messageAuthor: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 13 },
  thinkingMessage: { minHeight: 64, justifyContent: "center" },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  messageText: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  attachmentText: { color: "#74534f", fontFamily: "DMSans_400Regular", fontSize: 12 },
  composer: { backgroundColor: "#ffffff", borderRadius: 18, padding: 6 },
  input: { color: "#2c2422", fontFamily: "DMSans_400Regular", fontSize: 16, minHeight: 36, maxHeight: 120, paddingHorizontal: 8, paddingTop: 6, textAlignVertical: "top" },
  composerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventHint: { flex: 1, color: "#766966", fontFamily: "DMSans_400Regular", fontSize: 12, paddingHorizontal: 6 },
  rightActions: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#a43f3a", alignItems: "center", justifyContent: "center" },
  sendDisabled: { backgroundColor: "#bfb2af" },
  attachmentRow: { flexDirection: "row", alignItems: "center", paddingLeft: 8 },
  attachmentName: { flex: 1, color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13 },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13 },
  permissionHelp: { gap: 8, paddingVertical: 4 },
  permissionText: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  settingsButton: { backgroundColor: "#ffffff", borderRadius: 16, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, alignSelf: "flex-start" },
  settingsButtonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 14 },
});
