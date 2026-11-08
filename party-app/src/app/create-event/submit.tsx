import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../../components/dashboard-layout";
import { useEventSettings } from "../../components/event-settings-context";
import { useAppPreferences } from "../../components/app-preferences";
import { CreateEventInput, CreatedEvent, EventType, createEvent } from "../../lib/events-api";
import { archiveGalaConversation } from "../../lib/gala-conversation";

const gala = require("../../../assets/images/gala_front_facing.png");

const EVENT_TYPE_BY_ID: Record<string, EventType> = {
  conversation: "Conversation",
  celebration: "Celebration",
  dance: "Dance Party",
  family: "Family Gathering",
  meal: "Shared Meal",
};

export default function EventSubmission() {
  const { resetPreview, galaConversationId, eventDate, eventStartTime, settings, guestCount, budgetChoice, budgetAmount } = useEventSettings();
  const eventStartAt = eventDate && eventStartTime
    ? new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventStartTime.getHours(),
        eventStartTime.getMinutes(),
      )
    : null;
  const { darkMode } = useAppPreferences();
  const { type, name } = useLocalSearchParams<{ type?: string; name?: string }>();
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent>();

  async function submitEvent() {
    setError(undefined);
    const eventType = type ? EVENT_TYPE_BY_ID[type] : undefined;
    if (!name?.trim() || !eventType || !eventStartAt) {
      setError("Some event details are missing. Go back and complete the event name, type, date, and time.");
      return;
    }

    const start = new Date(eventStartAt);
    if (start.getTime() <= Date.now()) {
      setError("The event start time must be in the future. Go back and update the date or time.");
      return;
    }

    const end = new Date(start.getTime() + Number(settings.duration) * 60 * 60 * 1000);
    const eventDetails: CreateEventInput = {
      name: name.trim(),
      eventType,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    const rsvpDays = Number(settings.rsvp);
    if (rsvpDays > 0) {
      eventDetails.rsvpDeadline = new Date(start.getTime() - rsvpDays * 24 * 60 * 60 * 1000).toISOString();
    }
    const headcount = Number(guestCount);
    if (Number.isSafeInteger(headcount) && headcount > 0) eventDetails.expectedHeadcount = headcount;
    if ((budgetChoice === "manual" || budgetChoice === "generate") && budgetAmount) eventDetails.totalBudget = Number(budgetAmount);

    setIsSubmitting(true);
    try {
      const event = await createEvent(eventDetails);
      setCreatedEvent(event);
      try {
        await archiveGalaConversation(galaConversationId, event.id);
      } catch (archiveError) {
        setError(
          archiveError instanceof Error
            ? `The event was created, but Gala's conversation could not be linked to it: ${archiveError.message}`
            : "The event was created, but Gala's conversation could not be linked to it.",
        );
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The event could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function finish() {
    resetPreview();
    router.replace("/dashboard");
  }

  return (
    <DashboardLayout showNavigation={false} compactContent>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {createdEvent ? "Your event is ready!" : "Review and create your event"}
        </Text>
        <View style={styles.galaFrame}>
          {imageError ? (
            <Text style={[styles.notice, darkMode && styles.darkText]} accessibilityRole="alert">Unable to load Gala&apos;s birthday image.</Text>
          ) : (
            <Image source={gala} style={styles.gala} resizeMode="contain" accessibilityLabel="Gala assistant" onError={(event) => { console.error("Failed to load Gala's image:", event.nativeEvent.error); setImageError(true); }} />
          )}
        </View>
        <Text style={styles.subtitle}>
          {createdEvent ? "The event was saved to your account." : "Check the event details, then save it to your account."}
        </Text>
        {!createdEvent && (
          <Text style={styles.notice}>
            Food and drink selections, invitation lead time, and timeline remain preview-only; the current backend does not save these settings.
          </Text>
        )}
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{createdEvent?.name ?? name ?? "Untitled event"}</Text>
          <Text style={styles.details}>
            {createdEvent
              ? new Date(createdEvent.start_time).toLocaleString([], { dateStyle: "long", timeStyle: "short" })
              : eventStartAt?.toLocaleString([], { dateStyle: "long", timeStyle: "short" }) ?? "Start time not set"}
          </Text>
          {createdEvent && (
            <>
              <View style={styles.row}>
                <Text style={styles.details}>Event type</Text>
                <Text style={styles.rowValue}>{createdEvent.event_type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.details}>Expected headcount</Text>
                <Text style={styles.rowValue}>{createdEvent.expected_headcount ?? "Not set"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.details}>Budget</Text>
                <Text style={styles.rowValue}>
                  {createdEvent.total_budget === null ? "Not set" : `$${Number(createdEvent.total_budget).toFixed(2)}`}
                </Text>
              </View>
              <Text style={styles.sample}>Event ID: {createdEvent.id}</Text>
            </>
          )}
          {!createdEvent && (
            <>
              <Text style={styles.details}>{EVENT_TYPE_BY_ID[type ?? ""] ?? "Event type not selected"}</Text>
              <Text style={styles.sample}>Duration: {settings.duration} hours</Text>
            </>
          )}
        </View>
        {!!error && <Text style={[styles.error, darkMode && styles.darkText]} accessibilityRole="alert">{error}</Text>}
        {createdEvent ? (
          <Pressable style={styles.primary} accessibilityRole="button" onPress={finish}>
            <Text style={styles.primaryText}>Back to Dashboard</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primary, isSubmitting && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={submitEvent}
          >
            {isSubmitting
              ? <ActivityIndicator color="#ffffff" accessibilityLabel="Creating event" />
              : <Text style={styles.primaryText}>Create Event</Text>}
          </Pressable>
        )}
        {!createdEvent && (
          <Pressable style={styles.secondary} accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.primaryText}>Go Back</Text>
          </Pressable>
        )}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  galaFrame: { width: 240, height: 220, alignSelf: "center", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  gala: { position: "absolute", top: -10, width: 320, height: 320 },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 15, lineHeight: 21, textAlign: "center" },
  notice: { color: "#533331", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "center" },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "center" },
  card: { backgroundColor: "#c65d58", borderRadius: 28, padding: 18, gap: 8 },
  eventTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 20 },
  details: { flexShrink: 1, color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  rowValue: { flexShrink: 1, color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "right" },
  sample: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  primary: { minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", alignItems: "center", justifyContent: "center", padding: 12 },
  secondary: { minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", alignItems: "center", justifyContent: "center", padding: 12, opacity: 0.9 },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  darkText: { color: "#ffffff" },
  disabled: { opacity: 0.6 },
});
