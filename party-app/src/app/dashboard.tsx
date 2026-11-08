import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { User } from "@supabase/supabase-js";
import { DashboardLayout } from "../components/dashboard-layout";
import { GatherBrand } from "../components/gather-brand";
import { useAppPreferences } from "../components/app-preferences";
import { useNotificationPreview } from "../components/notification-preview";
import { EventRecord, getEvents } from "../lib/events-api";
import { EventTask, getTasks } from "../lib/tasks-api";
import { EventGuest, getGuests } from "../lib/guests-api";
import { getSupabaseClient } from "../lib/supabase";

type Milestone = { title: string; date: Date; due: string };

function firstName(user: User | null) {
  const metadata = user?.user_metadata;
  const name = [metadata?.first_name, metadata?.given_name, metadata?.full_name, metadata?.name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  return name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";
}

function dayStart(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dueLabel(date: Date, today: Date) {
  const days = Math.round((dayStart(date).getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function getMilestones(event: EventRecord, tasks: EventTask[]): Milestone[] {
  const today = dayStart(new Date());
  const candidates: { title: string; date: Date }[] = [];

  if (event.rsvp_deadline) {
    candidates.push({ title: "RSVP Deadline", date: new Date(event.rsvp_deadline) });
  }
  for (const task of tasks) {
    if (task.status !== "complete" && task.due_date) {
      candidates.push({ title: task.title, date: new Date(`${task.due_date}T00:00:00`) });
    }
  }
  candidates.push({ title: "Event Day", date: new Date(event.start_time) });

  return candidates
    .filter(({ date }) => !Number.isNaN(date.getTime()) && dayStart(date) >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3)
    .map(({ title, date }) => ({
      title,
      date,
      due: dueLabel(date, today),
    }));
}

export default function DashboardScreen() {
  const { darkMode } = useAppPreferences();
  const { unreadCount } = useNotificationPreview();
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [taskDueDatesAvailable, setTaskDueDatesAvailable] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setDetailsLoaded(false);
    setTaskDueDatesAvailable(true);
    setError("");

    void (async () => {
      try {
        const [sessionResult, events] = await Promise.all([
          getSupabaseClient().auth.getSession(),
          getEvents(),
        ]);
        if (sessionResult.error) throw new Error(`Could not read the login session: ${sessionResult.error.message}`);
        const nextUser = sessionResult.data.session?.user ?? null;
        const today = new Date();
        const nextEvent = events.find((item) => new Date(item.start_time) >= today) ?? null;
        if (!active) return;
        setUser(nextUser);
        setEvent(nextEvent);
        setTasks([]);
        setGuests([]);

        if (nextEvent) {
          const [taskList, nextGuests] = await Promise.all([
            getTasks(nextEvent.id),
            getGuests(nextEvent.id),
          ]);
          if (!active) return;
          setTasks(taskList.tasks);
          setGuests(nextGuests);
          setTaskDueDatesAvailable(taskList.dueDateAvailable);
          setDetailsLoaded(true);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your homepage data.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []));

  const attending = guests.filter((guest) => guest.rsvp_status === "attending").length;
  const expected = event?.expected_headcount ?? guests.length;
  const milestones = event && detailsLoaded && taskDueDatesAvailable
    ? getMilestones(event, tasks)
    : [];
  const progress = expected > 0 ? Math.min(attending / expected * 100, 100) : 0;

  return (
    <DashboardLayout active="Home" compactContent>
      <View style={styles.dashboard}>
        <View style={styles.header}>
          <GatherBrand />
          <Pressable accessibilityRole="link" accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications, no unread notifications"} onPress={() => router.push("/notifications")} style={styles.settings}>
            <Ionicons name={unreadCount ? "notifications" : "notifications-outline"} size={28} color="#ffffff" />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View>}
          </Pressable>
        </View>
        <Text style={styles.welcome} accessibilityRole="header">Welcome, {firstName(user)}!</Text>
        <Text style={styles.heading}>Event Overview</Text>

        {loading && <ActivityIndicator color="#ffffff" accessibilityLabel="Loading homepage data" />}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}

        {!loading && !error && !event && (
          <View style={styles.card}>
            <Text style={styles.eventName}>No upcoming events</Text>
            <Text style={styles.eventDate}>Create an event to see its RSVPs and planning milestones here.</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push("/events")} style={styles.viewEventsButton}>
              <Text style={styles.viewEventsText}>View all events</Text>
            </Pressable>
          </View>
        )}

        {!loading && event && (
          <View style={styles.card}>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventDate}>{new Date(event.start_time).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</Text>

            <View style={styles.rsvpHeader}>
              <Text style={styles.sectionTitle}>RSVPs</Text>
              <Text style={styles.rsvpCount}>{detailsLoaded ? `${attending}/${expected}` : "—"}</Text>
            </View>
            <View
              style={styles.progress}
              accessibilityRole="progressbar"
              accessibilityLabel="RSVPs"
              accessibilityValue={{ min: 0, max: expected || 1, now: attending, text: detailsLoaded ? `${attending} of ${expected} expected guests attending` : "Loading RSVP information" }}
              aria-valuemin={0}
              aria-valuemax={expected || 1}
              aria-valuenow={attending}
            >
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.sectionTitle}>Upcoming milestones</Text>
            {!detailsLoaded && !error && <Text style={styles.detail}>Loading event milestones...</Text>}
            {detailsLoaded && !taskDueDatesAvailable && <Text style={styles.detail}>None</Text>}
            {detailsLoaded && taskDueDatesAvailable && milestones.length === 0 && <Text style={styles.detail}>None</Text>}
            {milestones.map((milestone, index) => (
              <View key={`${milestone.title}-${milestone.date.toISOString()}-${index}`} style={styles.milestone}>
                <View style={styles.milestoneText}>
                  <Text style={styles.milestoneTitle} numberOfLines={1}>{milestone.title}</Text>
                  <Text style={styles.detail}>{milestone.due}</Text>
                </View>
                <View style={styles.date}>
                  <Ionicons name="calendar-outline" size={18} color="#ffffff" />
                  <Text style={styles.dateText}>{milestone.date.toLocaleDateString([], { month: "short", day: "numeric" })}</Text>
                </View>
              </View>
            ))}
            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
            <Pressable accessibilityRole="link" onPress={() => router.push("/events")} style={styles.viewEventsButton}>
              <Text style={styles.viewEventsText}>View all events</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.createButton} accessibilityRole="link" onPress={() => router.push({ pathname: "/create-event/[step]", params: { step: "1" } })}>
          <Text style={styles.createText}>Create new event</Text>
        </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  dashboard: { flex: 1, justifyContent: "space-evenly", gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcome: { color: "#ffffff", fontFamily: "NanumPenScript_400Regular", fontSize: 43, lineHeight: 52, textAlign: "center" },
  settings: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", right: 0, top: 0, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 3, backgroundColor: "#a82525", alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 11 },
  heading: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 22, textAlign: "center", marginTop: 2 },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13, textAlign: "center" },
  card: { backgroundColor: "#c65d58", borderRadius: 36, paddingHorizontal: 22, paddingVertical: 16, gap: 6 },
  eventName: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 21 },
  eventDate: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  rsvpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 17, marginTop: 4 },
  rsvpCount: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  progress: { height: 8, borderRadius: 8, backgroundColor: "#e8a29e", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#ffffff", borderRadius: 8 },
  milestone: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#e0938f", paddingTop: 6 },
  milestoneText: { flex: 1, gap: 1 },
  milestoneTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  detail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 16 },
  date: { alignItems: "center", gap: 2 },
  dateText: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11 },
  viewEventsButton: { alignSelf: "flex-start", marginTop: 4 },
  viewEventsText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13, textDecorationLine: "underline" },
  createButton: { backgroundColor: "#c65d58", borderRadius: 60, alignItems: "center", justifyContent: "center", minHeight: 48, padding: 12, marginTop: 4 },
  createText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
