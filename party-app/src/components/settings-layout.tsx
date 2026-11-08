import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "./dashboard-layout";
import { GatherBrand } from "./gather-brand";
import { useAppPreferences } from "./app-preferences";

export function SettingsLayout({ title, children, back = true, onNavigate, onBack }: { title: string; children: ReactNode; back?: boolean; onNavigate?: (href: Href) => void; onBack?: () => void }) {
  const { darkMode } = useAppPreferences();
  return (
    <DashboardLayout active="Settings" onNavigate={onNavigate}>
      <GatherBrand />
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {children}
      </View>
      {back && <Pressable accessibilityRole="link" onPress={onBack ?? (() => router.replace("/settings"))} style={styles.back}><Text style={[styles.backText, darkMode && styles.darkText]}>Back to Settings</Text></Pressable>}
    </DashboardLayout>
  );
}

export function SettingsPlaceholder({ title }: { title: string }) {
  return <SettingsLayout title={title}><Text style={styles.description}>This page is a preview and is not connected yet.</Text></SettingsLayout>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#c65d58", borderRadius: 30, padding: 20, gap: 16 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  description: { color: "#ffffff", backgroundColor: "#333333", borderRadius: 12, padding: 12, fontFamily: "DMSans_400Regular", fontSize: 15, lineHeight: 22, textAlign: "center" },
  back: { minHeight: 48, justifyContent: "center", alignItems: "center", marginTop: 8 },
  backText: { color: "#533331", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
  darkText: { color: "#ffffff" },
});
