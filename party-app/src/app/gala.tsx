import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { speechRecognition } from "../components/speech-recognition";

const gala = require("../../assets/images/gala_front_facing.png");

const suggestions = [
  { title: "Plan an event", detail: "Start organizing something new", reply: "Let's start with the kind of event you'd like to plan, when it will be, and who you'd like to invite." },
  { title: "Manage my budget", detail: "Get budget ideas and estimates", reply: "Let's look at your total budget and the areas you'd like to spend it on, such as food, venue, and entertainment." },
  { title: "Guest suggestions", detail: "Organize guests and invitations", reply: "We can start with your guest list, decide how to send invitations, and keep track of RSVPs." },
  { title: "Get inspiration", detail: "Themes, activities, and ideas", reply: "Tell me about the occasion and the mood you have in mind, and we can explore themes and activities together." },
];

type Message = { id: number; speaker: "You" | "Gala"; text: string; attachment?: string };

export default function GalaScreen() {
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [dictation, setDictation] = useState<"idle" | "starting" | "listening" | "stopping">("idle");
  const dictationActive = useRef(false);
  const requestId = useRef(0);
  const nextId = useRef(0);
  const chatRef = useRef<ScrollView>(null);
  const pageRef = useRef<ScrollView>(null);
  const scrollToReply = useRef(false);

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
        setError(event.error === "not-allowed"
          ? "Microphone or speech recognition permission was denied. Check your device or browser settings."
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
          setError("Microphone or speech recognition permission was denied. Check your device settings.");
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

  function addExchange(text: string, reply: string, file?: string) {
    const userId = nextId.current++;
    const replyId = nextId.current++;
    setMessages((current) => [...current, { id: userId, speaker: "You", text, attachment: file }, { id: replyId, speaker: "Gala", text: reply }]);
  }

  function send() {
    const text = draft.trim();
    if (!text && !attachment) return;
    addExchange(text, "This is a sample response. Gala's AI assistant isn't connected yet, so I can't respond to your message or review attachments.", attachment || undefined);
    setDraft("");
    setAttachment(null);
    setError("");
  }

  function chooseSuggestion(title: string, reply: string) {
    scrollToReply.current = true;
    addExchange(title, reply);
    if (messages.length > 0) pageRef.current?.scrollToEnd({ animated: true });
  }

  async function pickAttachment() {
    if (picking) return;
    setPicking(true);
    setError("");
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
      <View style={[styles.brandFrame, narrow && styles.narrowBrand]}><Image source={gala} style={styles.brand} resizeMode="contain" accessible={false} /></View>
      <View style={[styles.container, narrow && styles.narrowContainer]}>
        <Text style={styles.title} accessibilityRole="header">Chat with Gala</Text>
        <View style={[styles.heroFrame, narrow && styles.narrowHeroFrame]}>
          <Image source={gala} style={[styles.hero, narrow && styles.narrowHero]} resizeMode="contain" accessibilityLabel="Gala the elephant" />
        </View>
        <Text style={styles.greeting} accessibilityRole="header">Hi! I&apos;m Gala.</Text>
        <Text style={styles.subtitle}>Your personal planning companion. Let&apos;s make something wonderful happen!</Text>
        <Text style={styles.sectionTitle} accessibilityRole="header">What can I help you with?</Text>
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.detail}`} onPress={() => chooseSuggestion(item.title, item.reply)} style={({ pressed }) => [styles.suggestion, narrow && styles.narrowSuggestion, pressed && styles.pressed]}>
              <Text style={[styles.suggestionTitle, narrow && styles.narrowSuggestionTitle]}>{item.title}</Text>
              <Text style={[styles.suggestionDetail, narrow && styles.narrowSuggestionDetail]}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        {messages.length > 0 && (
          <ScrollView ref={chatRef} style={styles.conversation} contentContainerStyle={styles.messageList} nestedScrollEnabled keyboardShouldPersistTaps="handled" onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })} accessibilityLabel="Preview conversation">
            {messages.map((message) => (
              <View key={message.id} style={[styles.message, message.speaker === "You" ? styles.userMessage : styles.galaMessage]}>
                {message.speaker === "Gala" ? <View style={styles.messageHeader}><Image source={gala} style={styles.messageGala} resizeMode="contain" accessible={false} /><Text style={styles.messageAuthor}>Gala · sample reply</Text></View> : <Text style={styles.messageAuthor}>You</Text>}
                {!!message.text && <Text style={styles.messageText}>{message.text}</Text>}
                {message.attachment && <Text style={styles.attachmentText}>Attachment: {message.attachment} (not sent)</Text>}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.composer}>
          {attachment && <View style={styles.attachmentRow}>
            <Text style={styles.attachmentName} numberOfLines={1}>{attachment}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setAttachment(null)} style={styles.iconButton}><Ionicons name="close-circle" size={22} color="#a43f3a" /></Pressable>
          </View>}
          <TextInput accessibilityLabel="Message Gala" value={draft} onChangeText={setDraft} placeholder="Ask Gala anything..." placeholderTextColor="#766966" multiline style={styles.input} />
          <View style={styles.composerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Attach an image or PDF" accessibilityState={{ disabled: picking }} disabled={picking} onPress={() => { void pickAttachment(); }} style={styles.iconButton}><Ionicons name="attach-outline" size={24} color="#5f514e" /></Pressable>
            <View style={styles.rightActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={dictation === "listening" ? "Stop dictation" : "Start dictation"} accessibilityHint="Speech may be processed by your device or browser's speech provider." accessibilityState={{ disabled: dictation === "starting" || dictation === "stopping", selected: dictation === "listening" }} disabled={dictation === "starting" || dictation === "stopping"} onPress={() => { void toggleDictation(); }} style={styles.iconButton}><Ionicons name={dictation === "listening" ? "stop-circle" : "mic-outline"} size={24} color={dictation === "listening" ? "#a43f3a" : "#5f514e"} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Send preview message" accessibilityState={{ disabled: (!draft.trim() && !attachment) || dictation !== "idle" }} disabled={(!draft.trim() && !attachment) || dictation !== "idle"} onPress={send} style={[styles.send, ((!draft.trim() && !attachment) || dictation !== "idle") && styles.sendDisabled]}><Ionicons name="arrow-up" size={22} color="#ffffff" /></Pressable>
            </View>
          </View>
        </View>
        {dictation !== "idle" && <Text style={styles.preview} accessibilityLiveRegion="polite">{dictation === "listening" ? "Listening... Tap the microphone to finish." : dictation === "starting" ? "Starting dictation..." : "Finishing dictation..."}</Text>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <Text style={styles.preview}>Sample replies. Files stay local. Speech may be sent to a provider.</Text>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  brandFrame: { width: 40, height: 40, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  brand: { width: 70, height: 70 },
  narrowBrand: { height: 32, marginBottom: 2 },
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
  messageText: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  attachmentText: { color: "#74534f", fontFamily: "DMSans_400Regular", fontSize: 12 },
  composer: { backgroundColor: "#ffffff", borderRadius: 18, padding: 6 },
  input: { color: "#2c2422", fontFamily: "DMSans_400Regular", fontSize: 16, minHeight: 36, maxHeight: 120, paddingHorizontal: 8, paddingTop: 6, textAlignVertical: "top" },
  composerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rightActions: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#a43f3a", alignItems: "center", justifyContent: "center" },
  sendDisabled: { backgroundColor: "#bfb2af" },
  attachmentRow: { flexDirection: "row", alignItems: "center", paddingLeft: 8 },
  attachmentName: { flex: 1, color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13 },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13 },
});
