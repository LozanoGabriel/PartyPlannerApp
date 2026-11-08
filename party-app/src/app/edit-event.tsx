import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { EventSelector } from "../components/event-selector";
import { EventTimePicker } from "../components/event-time-picker";
import { TaskDatePicker } from "../components/task-date-picker";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { EVENT_CATEGORIES, EventRecord, EventType, getEvents, updateEvent } from "../lib/events-api";

type EventDraft = {
  name: string;
  eventType: EventType;
  startDate: Date | null;
  startTime: Date | null;
  duration: string;
  rsvpDate: Date | null;
  headcount: string;
  budget: string;
  address: string;
};

function draftFromEvent(event: EventRecord): EventDraft {
  const start = new Date(event.start_time);
  const duration = Math.max(1, Math.ceil((new Date(event.end_time).getTime() - start.getTime()) / 3600000));
  return {
    name: event.name,
    eventType: event.event_type,
    startDate: start,
    startTime: start,
    duration: String(duration),
    rsvpDate: event.rsvp_deadline ? new Date(event.rsvp_deadline) : null,
    headcount: event.expected_headcount === null ? "" : String(event.expected_headcount),
    budget: event.total_budget === null ? "" : String(event.total_budget),
    address: event.address ?? "",
  };
}

export default function EditEventScreen() {
  const { darkMode } = useAppPreferences();
  const { eventId: routeEventId } = useLocalSearchParams<{ eventId?: string }>();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState(routeEventId ?? "");
  const [draft, setDraft] = useState<EventDraft>();
  const [typeMenu, setTypeMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedId), [events, selectedId]);

  useEffect(() => {
    let active = true;
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      const selected = items.find((event) => event.id === routeEventId) ?? items[0];
      setSelectedId(selected?.id ?? "");
      setDraft(selected ? draftFromEvent(selected) : undefined);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load your events.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [routeEventId]);

  function chooseEvent(id: string) {
    const event = events.find((item) => item.id === id);
    setSelectedId(id);
    setDraft(event ? draftFromEvent(event) : undefined);
    setError("");
    setNotice("");
  }

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setError("");
    setNotice("");
  }

  async function save() {
    if (!selectedEvent || !draft) return;
    if (!draft.name.trim()) { setError("Enter an event name."); return; }
    if (!draft.startDate || !draft.startTime) { setError("Choose an event date and start time."); return; }
    if (!/^\d+$/.test(draft.duration) || Number(draft.duration) < 1 || Number(draft.duration) > 168) {
      setError("Enter an event duration from 1 to 168 hours.");
      return;
    }
    if (draft.headcount && (!/^\d+$/.test(draft.headcount) || Number(draft.headcount) < 1)) {
      setError("Expected headcount must be a positive whole number.");
      return;
    }
    if (draft.budget && !/^\d{1,9}(\.\d{1,2})?$/.test(draft.budget)) {
      setError("Enter a budget with up to two decimal places.");
      return;
    }
    const start = new Date(
      draft.startDate.getFullYear(), draft.startDate.getMonth(), draft.startDate.getDate(),
      draft.startTime.getHours(), draft.startTime.getMinutes(),
    );
    const end = new Date(start.getTime() + Number(draft.duration) * 3600000);
    const rsvpDeadline = draft.rsvpDate
      ? new Date(draft.rsvpDate.getFullYear(), draft.rsvpDate.getMonth(), draft.rsvpDate.getDate())
      : null;
    if (rsvpDeadline && rsvpDeadline >= start) {
      setError("The RSVP deadline must be before the event starts.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateEvent(selectedEvent.id, {
        name: draft.name.trim(),
        eventType: draft.eventType,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        rsvpDeadline: rsvpDeadline?.toISOString() ?? null,
        expectedHeadcount: draft.headcount ? Number(draft.headcount) : null,
        totalBudget: draft.budget ? Number(draft.budget) : null,
        address: draft.address.trim(),
      });
      setEvents((current) => current.map((event) => event.id === updated.id ? updated : event));
      setDraft(draftFromEvent(updated));
      setNotice("Your event changes were saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save event changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout showNavigation={false}>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">Edit Event</Text>
        {loading ? <Text style={styles.notice}>Loading your events...</Text> : events.length > 0 ? (
          <View style={styles.field}>
            <Text style={styles.label}>Choose an event</Text>
            <EventSelector events={events} selectedId={selectedId} onSelect={chooseEvent} />
          </View>
        ) : <Text style={styles.notice}>You haven&apos;t created an event yet.</Text>}

        {draft && <>
          <View style={styles.field}><Text style={styles.label}>Event Name</Text><TextInput accessibilityLabel="Event name" value={draft.name} onChangeText={(value) => update("name", value)} maxLength={100} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <View style={styles.field}>
            <Text style={styles.label}>Event Type</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: typeMenu }} onPress={() => setTypeMenu(!typeMenu)} style={[styles.select, darkMode && styles.darkPanel]}>
              <Text style={[styles.inputText, darkMode && styles.darkText]}>{draft.eventType}</Text>
              <Ionicons name={typeMenu ? "chevron-up" : "chevron-down"} size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
            </Pressable>
            {typeMenu && <View style={[styles.options, darkMode && styles.darkPanel]}>{EVENT_CATEGORIES.map((category) => (
              <Pressable key={category} accessibilityRole="button" onPress={() => { update("eventType", category); setTypeMenu(false); }} style={styles.option}>
                <Text style={[styles.inputText, darkMode && styles.darkText]}>{category}</Text>
              </Pressable>
            ))}</View>}
          </View>
          <View style={styles.field}><Text style={styles.label}>Event Date</Text><TaskDatePicker value={draft.startDate} onChange={(value) => update("startDate", value)} /></View>
          <View style={styles.field}><Text style={styles.label}>Start Time</Text><EventTimePicker value={draft.startTime} onChange={(value) => update("startTime", value)} /></View>
          <View style={styles.field}><Text style={styles.label}>Duration (hours)</Text><TextInput accessibilityLabel="Event duration in hours" value={draft.duration} onChangeText={(value) => update("duration", value)} keyboardType="number-pad" maxLength={3} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <View style={styles.field}><Text style={styles.label}>RSVP Deadline (optional)</Text><TaskDatePicker value={draft.rsvpDate} onChange={(value) => update("rsvpDate", value)} /></View>
          <View style={styles.field}><Text style={styles.label}>Expected Headcount (optional)</Text><TextInput accessibilityLabel="Expected headcount" value={draft.headcount} onChangeText={(value) => update("headcount", value)} keyboardType="number-pad" maxLength={9} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <View style={styles.field}><Text style={styles.label}>Total Budget (optional)</Text><TextInput accessibilityLabel="Total budget" value={draft.budget} onChangeText={(value) => update("budget", value)} keyboardType="decimal-pad" maxLength={12} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <View style={styles.field}><Text style={styles.label}>Address (optional)</Text><TextInput accessibilityLabel="Event address" value={draft.address} onChangeText={(value) => update("address", value)} maxLength={300} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <Text style={styles.hint}>Event images and food, drink, and timeline notes are not stored by the current database.</Text>
          {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => { void save(); }} style={[styles.button, darkMode && styles.darkPanel, saving && styles.disabled]}>
            <Text style={[styles.buttonText, darkMode && styles.darkAccent]}>{saving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.replace("/events")} style={styles.back}><Text style={styles.backText}>Back to My Events</Text></Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  card: { backgroundColor: "#c65d58", borderRadius: 32, padding: 20, gap: 14 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18, textAlign: "center" },
  field: { gap: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  input: { backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, minHeight: 48, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  inputText: { flexShrink: 1, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  select: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  options: { borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12 },
  option: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  hint: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center" },
  disabled: { opacity: 0.6 },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  back: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
});
