import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "./dashboard-layout";

export function TaskPlaceholder({ title, task }: { title: string; task?: string }) {
  return (
    <DashboardLayout active="Tasks">
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {task && <Text style={styles.message}>{task}</Text>}
        <Text style={styles.message}>This is a preview. Task creation and editing are not connected yet.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/tasks")} style={styles.button}>
          <Text style={styles.buttonText}>Back to My Tasks</Text>
        </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 30, textAlign: "center" },
  message: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  button: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  buttonText: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 16, textDecorationLine: "underline" },
});
