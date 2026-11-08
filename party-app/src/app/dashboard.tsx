import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";

const gala = require("../../assets/images/gala_front_facing.png");
const milestones = [
  { title: "RSVP Deadline", detail: "All guests should respond", date: "Nov 21, 2026", due: "Due in 14 days" },
  { title: "Finalize Food Menu", detail: "Confirm catering and drinks", date: "Nov 28, 2026", due: "Due in 21 days" },
  { title: "Party Day!", detail: "Time to celebrate", date: "Dec 5, 2026", due: "Due in 28 days" },
];

export default function DashboardScreen() {
  const { width, fontScale } = useWindowDimensions();
  const welcomeSize = Math.min(43, Math.max(24, (width - 166) * 0.165));

  return (
    <DashboardLayout active="Home">
      <View style={styles.header}>
        <View style={styles.galaFrame}>
          <Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} />
        </View>
        <Text
          style={[styles.welcome, { fontSize: welcomeSize, lineHeight: welcomeSize * 1.2 * fontScale }]}
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          Welcome, Gabriel
        </Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Settings" onPress={() => router.push("/settings")} style={styles.settings}>
          <Ionicons name="settings-outline" size={28} color="#ffffff" />
        </Pressable>
      </View>
      <Text style={styles.heading}>Event Overview</Text>
      <Text style={styles.preview}>Preview only: sample data, not signed in.</Text>

      <View style={styles.card}>
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
      </View>
      <Pressable style={styles.createButton} disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityHint="Event creation is not available yet.">
        <Text style={styles.createText}>Create new event</Text>
      </Pressable>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  galaFrame: { width: 60, height: 60, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 100, height: 100 },
  welcome: { flex: 1, color: "#ffffff", fontFamily: "NanumPenScript_400Regular" },
  settings: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  heading: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 24, textAlign: "center", marginTop: 14 },
  preview: { color: "#533331", fontFamily: "DMSans_400Regular", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 14 },
  card: { backgroundColor: "#c65d58", borderRadius: 60, paddingHorizontal: 28, paddingVertical: 32, gap: 10 },
  eventName: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 24 },
  eventDate: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 21 },
  rsvpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 19, marginTop: 8 },
  rsvpCount: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 18 },
  progress: { height: 10, borderRadius: 8, backgroundColor: "#e8a29e", overflow: "hidden" },
  progressFill: { width: "60%", height: "100%", backgroundColor: "#ffffff", borderRadius: 8 },
  milestone: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#e0938f", paddingTop: 12 },
  milestoneText: { flex: 1, gap: 3 },
  milestoneTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  detail: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  date: { alignItems: "center", gap: 4 },
  dateText: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11 },
  sampleNote: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 11, marginTop: 4 },
  createButton: { backgroundColor: "#c65d58", borderRadius: 60, alignItems: "center", padding: 17, marginTop: 18, opacity: 0.7 },
  createText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
