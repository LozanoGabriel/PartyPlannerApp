import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { EventFlowButtons, EventFlowLayout } from "../../components/event-flow";
import { EventSettingsStep } from "../../components/event-settings-step";
import { useEventSettings } from "../../components/event-settings-context";
import { BudgetStep, GuestStep } from "../../components/event-guest-budget";
import { useAppPreferences } from "../../components/app-preferences";
import { darkPalette } from "../../components/dark-palette";
import { TaskDatePicker } from "../../components/task-date-picker";
import { EventTimePicker } from "../../components/event-time-picker";
import { GalaAssistant } from "../../components/gala-assistant";

const eventTypes = [
  { id: "conversation", title: "Conversation / Meet-up", detail: "Coffee meetups and casual gatherings" },
  { id: "celebration", title: "Celebration", detail: "Birthdays, graduations, anniversaries" },
  { id: "dance", title: "Dance Party", detail: "Parties, themed nights, social events" },
  { id: "family", title: "Family Gathering", detail: "Family reunions and get-togethers" },
  { id: "meal", title: "Shared Meal", detail: "Dinners, potlucks, brunches" },
] as const;
type EventType = (typeof eventTypes)[number]["id"];
const eventCategoryById: Record<EventType, string> = {
  conversation: "Conversation",
  celebration: "Celebration",
  dance: "Dance Party",
  family: "Family Gathering",
  meal: "Shared Meal",
};
const eventIdByCategory = Object.fromEntries(
  Object.entries(eventCategoryById).map(([id, category]) => [category, id]),
) as Record<string, EventType>;

function isEventType(value: string | string[] | undefined): value is EventType {
  return eventTypes.some((type) => type.id === value);
}

export default function CreateEventStep() {
  const { darkMode } = useAppPreferences();
  const {
    resetPreview,
    eventDate,
    setEventDate,
    eventStartTime,
    setEventStartTime,
    settings,
    guestCount,
    budgetChoice,
    budgetAmount,
  } = useEventSettings();
  const { step: stepParam, type, name, nameMode } = useLocalSearchParams<{ step: string; type?: string; name?: string; nameMode?: string }>();
  const selected = isEventType(type) ? type : undefined;
  const customName = nameMode === "custom";
  const eventStartAt = eventDate && eventStartTime
    ? new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventStartTime.getHours(),
        eventStartTime.getMinutes(),
      )
    : null;
  const startIsInFuture = !!eventStartAt && eventStartAt.getTime() > Date.now();
  const routeParams = { ...(selected ? { type: selected } : {}), ...(name ? { name } : {}), ...(nameMode ? { nameMode } : {}) };
  const step = Number(stepParam);
  const eventDurationHours = Number(settings.duration);
  const hasValidDuration =
    /^\d+$/.test(settings.duration) &&
    Number.isSafeInteger(eventDurationHours) &&
    eventDurationHours >= 1 &&
    eventDurationHours <= 168;
  const rsvpDaysBefore = Number(settings.rsvp);
  const hasValidRsvpDays =
    /^\d+$/.test(settings.rsvp) && Number.isSafeInteger(rsvpDaysBefore);
  const expectedHeadcount = Number(guestCount);
  const hasValidHeadcount =
    /^\d+$/.test(guestCount) &&
    Number.isSafeInteger(expectedHeadcount) &&
    expectedHeadcount > 0;
  const totalBudget = Number(budgetAmount);
  const hasValidManualBudget =
    /^\d{1,9}(\.\d{1,2})?$/.test(budgetAmount) &&
    Number.isFinite(totalBudget);
  const eventDetails: Record<string, unknown> = {
    ...(selected ? { eventType: eventCategoryById[selected] } : {}),
    ...(step >= 2 && name?.trim() ? { name: name.trim() } : {}),
    ...(step >= 2 && eventStartAt ? { startTime: eventStartAt.toISOString() } : {}),
    ...(step >= 3 && eventStartAt && hasValidDuration
      ? {
          endTime: new Date(
            eventStartAt.getTime() + eventDurationHours * 60 * 60 * 1000,
          ).toISOString(),
        }
      : {}),
    ...(step >= 3 && eventStartAt && hasValidRsvpDays && rsvpDaysBefore > 0
      ? {
          rsvpDeadline: new Date(
            eventStartAt.getTime() - rsvpDaysBefore * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }
      : {}),
    ...(step >= 4 && hasValidHeadcount
      ? { expectedHeadcount }
      : {}),
    ...(step >= 5 && budgetChoice === "manual" && hasValidManualBudget
      ? { totalBudget }
      : {}),
  };

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
          <GalaAssistant
            context="Event Type"
            eventDetails={eventDetails}
            hint="Describe the event and Gala will figure out the Event Type!"
            onSelectEventType={(eventType) => {
              const suggestedId = eventIdByCategory[eventType];
              if (suggestedId) router.setParams({ type: suggestedId });
            }}
          />
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
          <GalaAssistant
            context="Name"
            eventDetails={eventDetails}
            hint="Describe the kind of name or style you want for your event."
            onSelectName={(suggestion) => router.setParams({ name: suggestion, nameMode: "suggested" })}
          />
          <View style={styles.nameSection}>
            <View style={styles.nameList} accessibilityRole="radiogroup" accessibilityLabel="Event name">
              <Text style={styles.centeredTitle} accessibilityRole="header">Create your event name</Text>
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
          <View style={styles.scheduleSection}>
            <Text style={styles.centeredTitle} accessibilityRole="header">When does it start?</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleField}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <TaskDatePicker
                  value={eventDate}
                  onChange={setEventDate}
                />
              </View>
              <View style={styles.scheduleField}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <EventTimePicker
                  value={eventStartTime}
                  onChange={setEventStartTime}
                />
              </View>
            </View>
            {eventStartAt && !startIsInFuture && (
              <Text style={styles.subtitle} accessibilityLiveRegion="polite">
                Choose a future date and time for your event.
              </Text>
            )}
            {(!eventDate || !eventStartTime) && (
              <Text style={styles.subtitle}>Select both a date and a time.</Text>
            )}
          </View>
          <EventFlowButtons
            onBack={goBack}
            disabled={!name?.trim() || !startIsInFuture}
            disabledHint={!name?.trim() ? "Choose or enter an event name to continue." : "Choose a future event date and time."}
            onContinue={() => goToStep(3)}
          />
        </>
      ) : step === 3 ? (
        <EventSettingsStep eventDetails={eventDetails} onBack={goBack} onContinue={() => goToStep(4)} />
      ) : step === 4 ? (
        <GuestStep eventDetails={eventDetails} onBack={goBack} onContinue={() => goToStep(5)} />
      ) : (
        <BudgetStep eventDetails={eventDetails} onBack={goBack} onContinue={() => router.push({ pathname: "/create-event/submit", params: routeParams })} />
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
  scheduleSection: { gap: 6 },
  scheduleRow: { flexDirection: "row", gap: 12 },
  scheduleField: { flex: 1, gap: 4 },
  scheduleLabel: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  centeredTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 18, textAlign: "center" },
  nameList: { gap: 7, marginTop: 5 },
  nameOption: { minHeight: 46, backgroundColor: "#c65d58", borderRadius: 14, borderWidth: 3, borderColor: "transparent", paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center", alignItems: "center" },
  customOption: { backgroundColor: "#dedede", flexDirection: "row", gap: 8 },
  customOptionText: { color: "#333333", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center", flexShrink: 1 },
  nameInput: { minHeight: 48, borderRadius: 12, backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, paddingHorizontal: 12, marginTop: 4 },
});
