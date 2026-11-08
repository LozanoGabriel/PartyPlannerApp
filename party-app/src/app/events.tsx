import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { DashboardLayout } from "../components/dashboard-layout";
import { GatherBrand } from "../components/gather-brand";
import { EventSelector } from "../components/event-selector";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { EventRecord, getEvents } from "../lib/events-api";
import { EventTask, getTasks } from "../lib/tasks-api";
import { EventGuest, getGuests } from "../lib/guests-api";

function PageLink({ label, href }: { label: string; href: Href }) {
  const { darkMode } = useAppPreferences();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)} style={styles.link}>
      <Text style={[styles.linkText, darkMode && styles.darkAccent]}>{label}</Text>
      <Ionicons name="arrow-forward" size={18} color={darkMode ? darkPalette.accent : "#a43f3a"} />
    </Pressable>
  );
}

export default function EventsScreen() {
  const { darkMode } = useAppPreferences();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      setSelectedId((current) => items.some((event) => event.id === current) ? current : items[0]?.id ?? "");
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load your events.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));
  const event = events.find((item) => item.id === selectedId);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!selectedId) {
      setTasks([]);
      setGuests([]);
      return () => { active = false; };
    }
    Promise.all([getTasks(selectedId), getGuests(selectedId)]).then(([nextTasks, nextGuests]) => {
      if (active) { setTasks(nextTasks); setGuests(nextGuests); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load event details.");
    });
    return () => { active = false; };
  }, [selectedId]));
  const attending = guests.filter((guest) => guest.rsvp_status === "attending").length;
  const declined = guests.filter((guest) => guest.rsvp_status === "declined").length;
  const maybe = guests.filter((guest) => guest.rsvp_status === "maybe").length;
  const awaiting = guests.filter((guest) => guest.rsvp_status === "pending").length;
  const completedTasks = tasks.filter((task) => task.status === "complete").length;
  return (
    <DashboardLayout active="Events">
      <GatherBrand />
      <View style={styles.overview}>
        <Text style={styles.title} accessibilityRole="header">My Events</Text>
        {events.length > 0 && <EventSelector events={events} selectedId={selectedId} onSelect={setSelectedId} label="Select an event" />}
        {loading && <Text style={styles.whiteDetail}>Loading your events...</Text>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {!loading && events.length === 0 && !error && <Text style={styles.whiteDetail}>You haven&apos;t created an event yet.</Text>}
        {event && <>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.whiteDetail}>{new Date(event.start_time).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</Text>
          <Text style={styles.whiteDetail}>{event.event_type}</Text>
          {event.address && <Text style={styles.whiteDetail}>{event.address}</Text>}
          <View style={[styles.card, darkMode && styles.darkPanel]}>
            <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Guest Responses</Text>
            <Text style={[styles.detail, darkMode && styles.darkText]}>{attending} attending · {declined} declined · {maybe} maybe · {awaiting} awaiting</Text>
            <Text style={[styles.detail, darkMode && styles.darkText]}>RSVP deadline: {event.rsvp_deadline ? new Date(event.rsvp_deadline).toLocaleDateString() : "Not set"}</Text>
            <PageLink label="View guest list" href={{ pathname: "/guest-list", params: { eventId: event.id } }} />
          </View>
          <View style={[styles.card, darkMode && styles.darkPanel]}>
            <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Planning progress</Text>
            <Text style={[styles.detail, darkMode && styles.darkText]}>{completedTasks} of {tasks.length} tasks completed</Text>
            <PageLink label="View planning tasks" href={{ pathname: "/tasks", params: { eventId: event.id } }} />
          </View>
          <View style={styles.metrics}>
            <View style={[styles.card, styles.metric, darkMode && styles.darkPanel]}>
              <Text style={[styles.detail, darkMode && styles.darkText]}>Budget</Text>
              <Text style={[styles.metricValue, darkMode && styles.darkText]}>{event.total_budget === null ? "Not set" : `$${Number(event.total_budget).toFixed(2)}`}</Text>
            </View>
            <View style={[styles.card, styles.metric, darkMode && styles.darkPanel]}>
              <Text style={[styles.detail, darkMode && styles.darkText]}>Expected guests</Text>
              <Text style={[styles.metricValue, darkMode && styles.darkText]}>{event.expected_headcount ?? "Not set"}</Text>
            </View>
          </View>
        </>}
      </View>
      <Pressable style={styles.primary} accessibilityRole="link" onPress={() => router.push({ pathname: "/create-event/[step]", params: { step: "1" } })}>
        <Text style={styles.primaryText}>Create New Event</Text>
      </Pressable>
      {event && <Pressable style={[styles.secondary, darkMode && styles.darkPanel]} accessibilityRole="link" onPress={() => router.push({ pathname: "/edit-event", params: { eventId: event.id } })}>
        <Text style={[styles.secondaryText, darkMode && styles.darkAccent]}>Edit Event</Text>
      </Pressable>}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13 },
  overview: { backgroundColor: "#c65d58", borderRadius: 32, padding: 18, gap: 8 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  eventImage: { width: "100%", height: 150, borderRadius: 16 },
  whiteDetail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  eventName: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 22 },
  preview: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, marginBottom: 4 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 },
  cardTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 19 },
  bold: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 13 },
  small: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12 },
  progress: { height: 10, borderRadius: 6, backgroundColor: "#f6e5d8", flexDirection: "row", overflow: "hidden" },
  attendingBar: { backgroundColor: "#d89728" },
  declinedBar: { backgroundColor: "#efcb8f" },
  maybeBar: { backgroundColor: "#8eaba8" },
  tasksBar: { backgroundColor: "#c65d58" },
  link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  linkText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 14 },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1 },
  metricValue: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 20 },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  galaFrame: { width: 52, height: 52, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 86, height: 86 },
  primary: { marginTop: 12, minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", alignItems: "center", justifyContent: "center", padding: 12 },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  secondary: { marginTop: 8, minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  secondaryText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
