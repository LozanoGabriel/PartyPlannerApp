import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EventFlowButtons, EventFlowLayout, GalaMessage } from "../../components/event-flow";
import { EventSettingsStep } from "../../components/event-settings-step";
import { useEventSettings } from "../../components/event-settings-context";
import { BudgetStep, GuestStep } from "../../components/event-guest-budget";
import { useAppPreferences } from "../../components/app-preferences";
import { darkPalette } from "../../components/dark-palette";

const eventTypes = [
  { id: "conversation", title: "Conversation / Meet-up", detail: "Coffee meetups and casual gatherings" },
  { id: "celebration", title: "Celebration", detail: "Birthdays, graduations, anniversaries" },
  { id: "dance", title: "Dance Party", detail: "Parties, themed nights, social events" },
  { id: "family", title: "Family Gathering", detail: "Family reunions and get-togethers" },
  { id: "meal", title: "Shared Meal", detail: "Dinners, potlucks, brunches" },
] as const;
const suggestedNames = [
  "Celebration Time!",
  "Cheers to Another Year",
  "A Little Disco Magic",
  "The Birthday Special",
];

type EventType = (typeof eventTypes)[number]["id"];

function isEventType(value: string | string[] | undefined): value is EventType {
  return eventTypes.some((type) => type.id === value);
}

export default function CreateEventStep() {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { resetPreview } = useEventSettings();
  const { step: stepParam, type, name, nameMode } = useLocalSearchParams<{ step: string; type?: string; name?: string; nameMode?: string }>();
  const selected = isEventType(type) ? type : undefined;
  const customName = nameMode === "custom";
  const routeParams = { ...(selected ? { type: selected } : {}), ...(name ? { name } : {}), ...(nameMode ? { nameMode } : {}) };
  const step = Number(stepParam);

  if (!Number.isInteger(step) || step < 1 || step > 5) {
    return (
      <EventFlowLayout step={1}>
        <Text style={styles.title} accessibilityRole="header">Page not found</Text>
        <Text style={styles.subtitle}>This event planning step does not exist.</Text>
        <EventFlowButtons onBack={() => router.replace("/dashboard")} onContinue={() => router.replace({ pathname: "/create-event/[step]", params: { step: "1" } })} continueLabel="Start over" />
      </EventFlowLayout>
    );
  }

  function goToStep(nextStep: number) {
    router.push({ pathname: "/create-event/[step]", params: { step: String(nextStep), ...routeParams } });
  }

  function goBack() {
    if (step === 1) {
      resetPreview();
      router.replace("/dashboard");
    } else {
      router.replace({ pathname: "/create-event/[step]", params: { step: String(step - 1), ...routeParams } });
    }
  }

  return (
    <EventFlowLayout step={step}>
      {step === 1 ? (
        <>
          <View style={styles.intro}>
            <Text style={styles.title} accessibilityRole="header">Let&apos;s plan something special.</Text>
            <Text style={styles.subtitle}>Start with the basics. You can customize everything later.</Text>
          </View>
          <GalaMessage heading="Gala says...">{"I'll help you organize the details and suggest a planning checklist based on your event!"}</GalaMessage>
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Event Type</Text>
            <Text style={styles.sectionSubtitle}>What kind of gathering are you planning?</Text>
            <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Event Type">
              {eventTypes.map((eventType) => (
                <Pressable
                  key={eventType.id}
                  accessibilityRole="radio"
                  accessibilityLabel={eventType.title}
                  accessibilityHint={eventType.detail}
                  accessibilityState={{ checked: selected === eventType.id }}
                  aria-checked={selected === eventType.id}
                  onPress={() => router.setParams({ type: eventType.id })}
                  style={[styles.typeCard, selected === eventType.id && styles.selectedCard]}
                >
                  <Text style={styles.typeTitle}>{eventType.title}</Text>
                  <Text style={styles.typeDetail}>{eventType.detail}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <EventFlowButtons
            onBack={goBack}
            disabled={!selected}
            disabledHint="Select an event type to continue."
            onContinue={() => goToStep(2)}
          />
        </>
      ) : step === 2 ? (
        <>
          <View style={styles.intro}>
            <Text style={styles.title} accessibilityRole="header">Let&apos;s give your event a name!</Text>
            <Text style={styles.subtitle}>Name your event based on your preferences.</Text>
          </View>
          <GalaMessage heading="Gala has some suggestions!">{"I have a few ideas based on the kind of event you're planning. Pick one you love, or come up with your own!"}</GalaMessage>
          <View style={styles.nameSection}>
            {aiSuggestions && <Text style={styles.centeredTitle} accessibilityRole="header">Choose a name suggested by Gala</Text>}
            {aiSuggestions && <Text style={styles.subtitle}>Example suggestions for a birthday celebration</Text>}
            <View style={styles.nameList} accessibilityRole="radiogroup" accessibilityLabel="Event name">
              {aiSuggestions && suggestedNames.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: !customName && name === suggestion }}
                  aria-checked={!customName && name === suggestion}
                  onPress={() => router.setParams({ name: suggestion, nameMode: "suggested" })}
                  style={[styles.nameOption, !customName && name === suggestion && styles.selectedCard]}
                >
                  <Text style={styles.nameOptionText}>{suggestion}</Text>
                </Pressable>
              ))}
              <Text style={styles.centeredTitle} accessibilityRole="header">{aiSuggestions ? "Or create your own name" : "Create your event name"}</Text>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel="I'll come up with my own"
                accessibilityState={{ checked: customName }}
                aria-checked={customName}
                onPress={() => router.setParams({ name: customName ? name : "", nameMode: "custom" })}
                style={[styles.nameOption, styles.customOption, darkMode && styles.darkPanel, customName && styles.selectedCard]}
              >
                <Ionicons name="pencil-outline" size={19} color={darkMode ? darkPalette.text : "#333333"} />
                <Text style={[styles.customOptionText, darkMode && styles.darkText]}>I&apos;ll come up with my own</Text>
              </Pressable>
            </View>
            {customName && (
              <TextInput
                accessibilityLabel="Custom event name"
                value={name ?? ""}
                onChangeText={(value) => router.setParams({ name: value })}
                placeholder="Enter your event name"
                placeholderTextColor={darkMode ? darkPalette.placeholder : "#666666"}
                maxLength={100}
                style={[styles.nameInput, darkMode && styles.darkInput]}
              />
            )}
          </View>
          <EventFlowButtons onBack={goBack} disabled={!name?.trim()} disabledHint="Choose or enter an event name to continue." onContinue={() => goToStep(3)} />
        </>
      ) : step === 3 ? (
        <EventSettingsStep onBack={goBack} onContinue={() => goToStep(4)} />
      ) : step === 4 ? (
        <GuestStep onBack={goBack} onContinue={() => goToStep(5)} />
      ) : (
        <BudgetStep onBack={goBack} onContinue={() => router.push({ pathname: "/create-event/submit", params: routeParams })} />
      )}
    </EventFlowLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  intro: { gap: 4, alignItems: "center" },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 23, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 19, textAlign: "center" },
  section: { gap: 4 },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 19 },
  sectionSubtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8, marginTop: 4 },
  typeCard: { width: "48%", minHeight: 88, backgroundColor: "#c65d58", borderRadius: 14, borderWidth: 3, borderColor: "transparent", padding: 10, gap: 4 },
  selectedCard: { borderColor: "#ffffff" },
  typeTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  typeDetail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 16 },
  nameSection: { gap: 5 },
  centeredTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 18, textAlign: "center" },
  nameList: { gap: 7, marginTop: 5 },
  nameOption: { minHeight: 46, backgroundColor: "#c65d58", borderRadius: 14, borderWidth: 3, borderColor: "transparent", paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center", alignItems: "center" },
  nameOptionText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center" },
  customOption: { backgroundColor: "#dedede", flexDirection: "row", gap: 8 },
  customOptionText: { color: "#333333", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center", flexShrink: 1 },
  nameInput: { minHeight: 48, borderRadius: 12, backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, paddingHorizontal: 12, marginTop: 4 },
});
