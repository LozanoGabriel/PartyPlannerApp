import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { useAppPreferences } from "../components/app-preferences";

export default function GuestListScreen() {
  const { darkMode } = useAppPreferences();
  return (
    <DashboardLayout active="Events">
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Guest List</Text>
        <Text style={[styles.message, darkMode && styles.darkText]}>Guest details are not available in this preview.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/events")} style={styles.button}>
          <Text style={[styles.buttonText, darkMode && styles.darkText]}>Back to My Event</Text>
        </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 30 },
  message: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  button: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  buttonText: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 16, textDecorationLine: "underline" },
  darkText: { color: "#ffffff" },
});
