import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../../components/dashboard-layout";
import { useEventSettings } from "../../components/event-settings-context";
import { useAppPreferences } from "../../components/app-preferences";
import { BackToDashboard } from "../../components/event-flow";

const gala = require("../../../assets/images/gala_birthday.png");

export default function EventSubmission() {
  const { resetPreview } = useEventSettings();
  const { darkMode, aiSuggestions } = useAppPreferences();
  const [imageError, setImageError] = useState(false);

  return (
    <DashboardLayout showNavigation={false} compactContent>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Let the planning party begin!</Text>
        <View style={styles.galaFrame}>
          {imageError ? (
            <Text style={[styles.notice, darkMode && styles.darkText]} accessibilityRole="alert">Unable to load Gala&apos;s birthday image.</Text>
          ) : (
            <Image source={gala} style={styles.gala} resizeMode="contain" accessibilityLabel="Gala celebrating a birthday" onError={(event) => { console.error("Failed to load Gala's birthday image:", event.nativeEvent.error); setImageError(true); }} />
          )}
        </View>
        <Text style={styles.subtitle}>{aiSuggestions ? "Gala has prepared your event workspace and initial planning checklist." : "Your event workspace and planning checklist preview."}</Text>
        <Text style={[styles.notice, darkMode && styles.darkText]}>Example preview only. No event, workspace, or checklist has been created.</Text>
        <View style={styles.card}>
          <Text style={styles.eventTitle}>Mario&apos;s Birthday</Text>
          <Text style={styles.details}>December 5, 2026 • 5:00 PM</Text>
          {[
            ["Planning template", "Created"],
            ["Guest list", "2 guests"],
            ["Budget", "$1,000.00"],
          ].map(([label, value]) => (
            <View style={styles.row} key={label}>
              <Text style={styles.details}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.sample}>All details shown are examples.</Text>
        </View>
        <Pressable style={styles.primary} accessibilityRole="link" onPress={() => { resetPreview(); router.replace("/events"); }}>
          <Text style={styles.primaryText}>Go to My Event</Text>
        </Pressable>
        <BackToDashboard />
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
  notice: { color: "#533331", fontFamily: "DMSans_700Bold", fontSize: 12, textAlign: "center" },
  card: { backgroundColor: "#c65d58", borderRadius: 28, padding: 18, gap: 8 },
  eventTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 20 },
  details: { flexShrink: 1, color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  rowValue: { flexShrink: 1, color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "right" },
  sample: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  primary: { minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", alignItems: "center", justifyContent: "center", padding: 12 },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  darkText: { color: "#ffffff" },
});
