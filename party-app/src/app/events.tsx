import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { useEventPreview } from "../components/event-preview-context";

const gala = require("../../assets/images/gala_front_facing.png");

function EventImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Text style={styles.whiteDetail} accessibilityRole="alert">Unable to display the event image. Choose another in Edit Event.</Text>;
  return <Image source={{ uri }} style={styles.eventImage} resizeMode="cover" accessibilityLabel="Selected event image" onError={(error) => { console.error("Failed to load event image:", error.nativeEvent.error); setFailed(true); }} />;
}

function PageLink({ label, href }: { label: string; href: Href }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="arrow-forward" size={18} color="#a43f3a" />
    </Pressable>
  );
}

function ProgressCards() {
  const progress = useRef(new Animated.Value(0)).current;
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    let active = true;
    let motionChanged = false;
    let started = false;
    const listener = progress.addListener(({ value }) => setFraction(value));
    const finish = () => {
      progress.stopAnimation();
      progress.setValue(1);
    };
    const start = () => {
      if (started) return;
      started = true;
      Animated.timing(progress, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    };
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
      motionChanged = true;
      if (reduced) finish();
      else start();
    });

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active || motionChanged) return;
      if (reduced) {
        finish();
      } else {
        start();
      }
    }).catch((error) => {
      console.error("Unable to check reduced motion preference:", error);
      if (active) finish();
    });

    return () => {
      active = false;
      subscription.remove();
      progress.stopAnimation();
      progress.removeListener(listener);
    };
  }, [progress]);

  const width = (percentage: number) => progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${percentage}%`] });

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Guest Responses</Text>
          <Text style={styles.bold} accessibilityLabel="18 of 30 invited">{Math.round(18 * fraction)} of 30 invited</Text>
        </View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Guest responses" accessibilityValue={{ min: 0, max: 30, now: 18, text: "18 responses of 30 invited" }}>
          <Animated.View style={[styles.attendingBar, { width: width(40) }]} /><Animated.View style={[styles.declinedBar, { width: width(20) }]} />
        </View>
        <Text style={styles.detail}>12 attending · 6 declined · 6 awaiting</Text>
        <Text style={styles.small}>6 additional invitees are untracked in this example.</Text>
        <Text style={styles.detail}><Text style={styles.bold}>RSVP Deadline:</Text> November 21</Text>
        <PageLink label="View guest list" href="/guest-list" />
      </View>
      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.cardTitle}>Planning progress</Text><Text style={styles.cardTitle} accessibilityLabel="65 percent">{Math.round(65 * fraction)}%</Text></View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Planning progress" accessibilityValue={{ min: 0, max: 100, now: 65, text: "13 of 20 planning tasks completed" }}>
          <Animated.View style={[styles.tasksBar, { width: width(65) }]} />
        </View>
        <Text style={styles.detail} accessibilityLabel="13 of 20 planning tasks completed">{Math.round(13 * fraction)} of 20 planning tasks completed</Text>
        <PageLink label="View planning tasks" href="/tasks" />
      </View>
    </>
  );
}

export default function EventsScreen() {
  const { event } = useEventPreview();
  return (
    <DashboardLayout active="Events">
      <View style={styles.brandFrame}><Image source={gala} style={styles.brand} resizeMode="contain" accessible={false} /></View>
      <View style={styles.overview}>
        <Text style={styles.title} accessibilityRole="header">My Event</Text>
        <Text style={styles.whiteDetail}>Saturday, December 5 • 5:00 PM</Text>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.whiteDetail}>Birthday Celebration • 28 days to go</Text>
        <Text style={styles.preview}>Sample event • Countdown based on November 7, 2026</Text>
        {event.imageUri && <EventImage key={event.imageUri} uri={event.imageUri} />}

        <ProgressCards />

        <View style={styles.metrics}>
          <View style={[styles.card, styles.metric]}>
            <Text style={styles.detail}>Budget remaining</Text>
            <Text style={styles.metricValue}>$650.00</Text>
            <Text style={styles.small}>of $1,000.00</Text>
          </View>
          <View style={[styles.card, styles.metric]}>
            <Text style={styles.detail}>Next Milestone</Text>
            <Text style={styles.metricValue}>Nov 21</Text>
            <Text style={styles.small}>RSVP Deadline</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.insightHeader}>
            <View style={styles.galaFrame}><Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} /></View>
            <Text style={styles.cardTitle}>Gala&apos;s Insights</Text>
          </View>
          <Text style={styles.detail}>You&apos;re making great progress! 12 guests haven&apos;t responded yet. It might be a good time to send a friendly RSVP reminder.</Text>
          <PageLink label="Ask Gala" href="/gala" />
        </View>
      </View>
      <Pressable style={styles.primary} accessibilityRole="link" onPress={() => router.push({ pathname: "/create-event/[step]", params: { step: "1" } })}>
        <Text style={styles.primaryText}>Create New Event</Text>
      </Pressable>
      <Pressable style={styles.secondary} accessibilityRole="link" onPress={() => router.push("/edit-event")}>
        <Text style={styles.secondaryText}>Edit Event</Text>
      </Pressable>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  overview: { backgroundColor: "#c65d58", borderRadius: 32, padding: 18, gap: 8 },
  brandFrame: { width: 48, height: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  brand: { width: 80, height: 80 },
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
