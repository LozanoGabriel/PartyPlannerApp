import type { ReactNode } from "react";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";
import { askGala } from "../lib/gala-api";
import { appendGalaConversation, readGalaConversation } from "../lib/gala-conversation";
import { useEventSettings } from "./event-settings-context";
import type { EventType } from "../lib/events-api";
import type { GalaContext, GalaResponse } from "../lib/gala-api";

const gala = require("../../assets/images/gala_front_facing.png");

function formatResponse(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g).map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    const isItalic = !isBold && part.startsWith("*") && part.endsWith("*");
    if (!isBold && !isItalic) return part;

    return (
      <Text key={index} style={isBold ? styles.formattedBold : styles.formattedItalic}>
        {part.slice(isBold ? 2 : 1, isBold ? -2 : -1)}
      </Text>
    );
  });
}

function summarizeResponse(response: GalaResponse) {
  return [
    response.english_response,
    response.event_type ? `Suggested event type: ${response.event_type}` : undefined,
    response.names?.length ? `Name suggestions: ${response.names.join("; ")}` : undefined,
    response.settings_suggestions?.length
      ? `Setting suggestions: ${response.settings_suggestions.join("; ")}`
      : undefined,
    response.guest_tips?.length ? `Guest tips: ${response.guest_tips.join("; ")}` : undefined,
    response.budget_items?.length
      ? `Budget suggestions: ${response.budget_items.map((item) => `${item.item_name}: ${item.item_description}`).join("; ")}`
      : undefined,
    response.tasks?.length
      ? `Task suggestions: ${response.tasks.map((task) => `${task.task_name}: ${task.task_description}`).join("; ")}`
      : undefined,
  ].filter(Boolean).join("\n").slice(0, 2000);
}

export function GalaAssistant({
  context,
  eventDetails,
  hint,
  onSelectName,
  onSelectEventType,
}: {
  context: GalaContext;
  eventDetails: Record<string, unknown>;
  hint: string;
  onSelectName?: (name: string) => void;
  onSelectEventType?: (eventType: EventType) => void;
}) {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { galaConversationId } = useEventSettings();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<GalaResponse>();
  const [selectedName, setSelectedName] = useState<string>();
  const [selectedEventType, setSelectedEventType] = useState<EventType>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  if (!aiSuggestions) return null;

  async function sendPrompt() {
    const request = prompt.trim();
    if (isLoading) return;

    setError(undefined);
    setIsLoading(true);
    try {
      const history = await readGalaConversation(galaConversationId);
      const answer = await askGala(context, eventDetails, request || undefined, history);
      setResponse(answer);
      try {
        await appendGalaConversation(galaConversationId, {
          context,
          ...(request ? { userPrompt: request } : {}),
          assistantResponse: summarizeResponse(answer),
        });
      } catch (storageError) {
        setError(
          storageError instanceof Error
            ? `Gala replied, but the conversation could not be saved: ${storageError.message}`
            : "Gala replied, but the conversation could not be saved.",
        );
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gala could not respond.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.panel, darkMode && styles.darkPanel]}>
      <View style={styles.header}>
        <View style={styles.galaFrame}>
          <Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.heading, darkMode && styles.darkAccent]}>Ask Gala</Text>
          <Text style={[styles.hint, darkMode && styles.darkText]}>Gala will use the available event details and focus on this step.</Text>
        </View>
      </View>
      {error && <Text style={[styles.error, darkMode && styles.darkError]} accessibilityRole="alert">{error}</Text>}
      {response?.english_response && (
        <Text style={[styles.answer, darkMode && styles.darkText]} accessibilityLiveRegion="polite">
          {formatResponse(response.english_response)}
        </Text>
      )}
      {response?.event_type && onSelectEventType && (
        <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedEventType === response.event_type }} onPress={() => {
          setSelectedEventType(response.event_type);
          if (response.event_type) onSelectEventType(response.event_type);
        }} style={[styles.suggestion, selectedEventType === response.event_type && styles.suggestionSelected, darkMode && selectedEventType === response.event_type && styles.suggestionSelectedDark]}>
          <Text style={styles.suggestionText}>Use suggested type: {response.event_type}</Text>
        </Pressable>
      )}
      {response?.names?.map((name, index) => (
        <Pressable key={`${name}-${index}`} accessibilityRole="button" accessibilityState={{ selected: selectedName === name }} onPress={() => {
          setSelectedName(name);
          onSelectName?.(name);
        }} style={[styles.suggestion, selectedName === name && styles.suggestionSelected, darkMode && selectedName === name && styles.suggestionSelectedDark]}>
          <Text style={styles.suggestionText}>{name}</Text>
        </Pressable>
      ))}
      {response?.settings_suggestions?.map((suggestion, index) => (
        <Text key={`${suggestion}-${index}`} style={[styles.listItem, darkMode && styles.darkText]}>{formatResponse(`• ${suggestion}`)}</Text>
      ))}
      {response?.guest_tips?.map((tip, index) => (
        <Text key={`${tip}-${index}`} style={[styles.listItem, darkMode && styles.darkText]}>{formatResponse(`• ${tip}`)}</Text>
      ))}
      {response?.budget_items?.map((item, index) => (
        <View key={`${item.item_name}-${index}`} style={styles.resultItem}>
          <Text style={[styles.resultTitle, darkMode && styles.darkAccent]}>{formatResponse(item.item_name)}</Text>
          <Text style={[styles.listItem, darkMode && styles.darkText]}>{formatResponse(item.item_description)}</Text>
        </View>
      ))}
      {response?.tasks?.map((task, index) => (
        <View key={`${task.task_name}-${index}`} style={styles.resultItem}>
          <Text style={[styles.resultTitle, darkMode && styles.darkAccent]}>{formatResponse(task.task_name)}</Text>
          <Text style={[styles.listItem, darkMode && styles.darkText]}>{formatResponse(task.task_description)}</Text>
        </View>
      ))}
      <TextInput
        accessibilityLabel="Ask Gala about this step"
        value={prompt}
        onChangeText={setPrompt}
        placeholder={hint}
        placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"}
        multiline
        maxLength={2000}
        style={[styles.input, darkMode && styles.darkInput]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading }}
        disabled={isLoading}
        onPress={sendPrompt}
        style={[styles.askButton, isLoading && styles.disabled]}
      >
        <Text style={styles.askText}>{isLoading ? "Gala is thinking..." : prompt.trim() ? "Ask Gala" : "Get suggestions"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 8, backgroundColor: "#ffffff", borderRadius: 18, padding: 10 },
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  darkError: { color: "#ffb4ab" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  galaFrame: { width: 52, height: 52, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  gala: { width: 76, height: 76 },
  headerText: { flex: 1, gap: 2 },
  heading: { color: "#c65d58", fontFamily: "DMSans_700Bold", fontSize: 16 },
  hint: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 16 },
  input: { minHeight: 44, maxHeight: 100, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#f7f2f2", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 14 },
  darkInput: { backgroundColor: "#202020", color: darkPalette.text },
  askButton: { minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "#c65d58", paddingHorizontal: 12 },
  askText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  disabled: { opacity: 0.55 },
  error: { color: "#b3261e", fontFamily: "DMSans_400Regular", fontSize: 13 },
  answer: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  formattedBold: { fontFamily: "DMSans_700Bold" },
  formattedItalic: { fontStyle: "italic" },
  suggestion: { minHeight: 40, justifyContent: "center", borderRadius: 10, borderWidth: 2, borderColor: "transparent", backgroundColor: "#c65d58", paddingHorizontal: 10, paddingVertical: 8 },
  suggestionSelected: { borderColor: "#1e1e1e" },
  suggestionSelectedDark: { borderColor: "#ffffff" },
  suggestionText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  listItem: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  resultItem: { gap: 2 },
  resultTitle: { color: "#c65d58", fontFamily: "DMSans_700Bold", fontSize: 14 },
});
