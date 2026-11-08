import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../../components/dashboard-layout";
import { useEventSettings } from "../../components/event-settings-context";

export default function EventSubmission() {
  const { type, name, nameMode } = useLocalSearchParams<{ type?: string; name?: string; nameMode?: string }>();
  const { reset } = useEventSettings();

  return (
    <DashboardLayout showNavigation={false}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Event submission preview</Text>
        <Text style={styles.message}>Event submission is not available yet. No event has been created or saved.</Text>
        <Pressable style={styles.button} accessibilityRole="button" onPress={() => router.replace({ pathname: "/create-event/[step]", params: { step: "5", ...(type ? { type } : {}), ...(name ? { name } : {}), ...(nameMode ? { nameMode } : {}) } })}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
        <Pressable style={styles.button} accessibilityRole="link" onPress={() => { reset(); router.replace("/dashboard"); }}>
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 400, justifyContent: "center", gap: 16 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 27, textAlign: "center" },
  message: { color: "#533331", fontFamily: "DMSans_400Regular", fontSize: 16, lineHeight: 23, textAlign: "center" },
  button: { minHeight: 48, backgroundColor: "#ffffff", borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#c65d58", fontFamily: "DMSans_700Bold", fontSize: 16, textAlign: "center" },
});
