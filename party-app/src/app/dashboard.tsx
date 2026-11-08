import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { GatherBrand } from "../components/gather-brand";

// Replace this preview switch with the real event list when the backend is connected.
const showEmptyState = false;
const milestones = [
  { title: "RSVP Deadline", detail: "All guests should respond", date: "Nov 21, 2026", due: "Due in 14 days" },
  { title: "Finalize Food Menu", detail: "Confirm catering and drinks", date: "Nov 28, 2026", due: "Due in 21 days" },
  { title: "Party Day!", detail: "Time to celebrate", date: "Dec 5, 2026", due: "Due in 28 days" },
];

export default function DashboardScreen() {
  return (
    <DashboardLayout active="Home" compactContent>
      <View style={styles.dashboard}>
      <View style={styles.header}>
        <GatherBrand />
        <Pressable accessibilityRole="link" accessibilityLabel="Settings" onPress={() => router.push("/settings")} style={styles.settings}>
          <Ionicons name="settings-outline" size={28} color="#ffffff" />
        </Pressable>
      </View>
      <Text style={styles.welcome} accessibilityRole="header">Welcome, Gabriel!</Text>
      <Text style={styles.heading}>Event Overview</Text>
      <Text style={styles.preview}>Preview only: {showEmptyState ? "not signed in." : "sample data, not signed in."}</Text>

      {showEmptyState ? (
        <View style={styles.card}>
          <Text style={styles.eventName}>No events yet</Text>
          <Text style={styles.eventDate}>Create your first event to start planning something special.</Text>
        </View>
      ) : <View style={styles.card}>
        <Text style={styles.eventName}>Mario&apos;s Birthday</Text>
        <Text style={styles.eventDate}>December 5th, 2026 • 5:00 PM EST</Text>

        <View style={styles.rsvpHeader}>
          <Text style={styles.sectionTitle}>RSVPs</Text>
          <Text style={styles.rsvpCount}>12/20</Text>
        </View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="RSVPs" accessibilityValue={{ min: 0, max: 20, now: 12, text: "12 of 20" }} aria-valuemin={0} aria-valuemax={20} aria-valuenow={12} aria-valuetext="12 of 20">
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.sectionTitle}>Upcoming milestones</Text>
        {milestones.map((milestone) => (
          <View key={milestone.title} style={styles.milestone}>
            <View style={styles.milestoneText}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.detail}>{milestone.detail}</Text>
              <Text style={styles.detail}>{milestone.due}</Text>
            </View>
            <View style={styles.date}>
              <Ionicons name="calendar-outline" size={18} color="#ffffff" />
              <Text style={styles.dateText}>{milestone.date}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.sampleNote}>Example timeline based on November 7, 2026.</Text>
      </View>}
      <Pressable style={styles.createButton} accessibilityRole="link" onPress={() => router.push({ pathname: "/create-event/[step]", params: { step: "1" } })}>
        <Text style={styles.createText}>Create new event</Text>
      </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  dashboard: { flex: 1, justifyContent: "space-evenly" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcome: { color: "#ffffff", fontFamily: "NanumPenScript_400Regular", fontSize: 43, lineHeight: 52, textAlign: "center" },
  settings: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  heading: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 22, textAlign: "center", marginTop: 2 },
  preview: { color: "#533331", fontFamily: "DMSans_400Regular", fontSize: 12, textAlign: "center", marginTop: 2, marginBottom: 8 },
  card: { backgroundColor: "#c65d58", borderRadius: 36, paddingHorizontal: 22, paddingVertical: 12, gap: 3 },
  eventName: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 21 },
  eventDate: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  rsvpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 17, marginTop: 4 },
  rsvpCount: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  progress: { height: 8, borderRadius: 8, backgroundColor: "#e8a29e", overflow: "hidden" },
  progressFill: { width: "60%", height: "100%", backgroundColor: "#ffffff", borderRadius: 8 },
  milestone: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#e0938f", paddingTop: 6 },
  milestoneText: { flex: 1, gap: 1 },
  milestoneTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  detail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 16 },
  date: { alignItems: "center", gap: 2 },
  dateText: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11 },
  sampleNote: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11 },
  createButton: { backgroundColor: "#c65d58", borderRadius: 60, alignItems: "center", justifyContent: "center", minHeight: 48, padding: 12, marginTop: 10 },
  createText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
