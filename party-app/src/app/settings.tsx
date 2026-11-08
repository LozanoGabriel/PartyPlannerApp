import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SettingsLayout } from "../components/settings-layout";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";

const items: { title: string; href: Href; icon: "person-outline" | "calendar-outline" | "options-outline" | "heart-outline" }[] = [
  { title: "Profile", href: "/profile", icon: "person-outline" },
  { title: "Event Preferences", href: "/event-preferences", icon: "calendar-outline" },
  { title: "App Preferences", href: "/app-preferences", icon: "options-outline" },
  { title: "Credits", href: "/credits", icon: "heart-outline" },
];

export default function SettingsScreen() {
  const { darkMode } = useAppPreferences();
  return (
    <SettingsLayout title="Settings" back={false}>
      <Text style={styles.section}>ACCOUNT</Text>
      <View style={styles.list}>
        {items.map((item) => <Pressable key={item.title} accessibilityRole="link" accessibilityLabel={item.title} onPress={() => router.push(item.href)} style={[styles.item, darkMode && styles.darkItem]}>
          <Ionicons name={item.icon} size={23} color={darkMode ? "#ffffff" : "#87332f"} />
          <Text style={[styles.itemText, darkMode && styles.darkText]}>{item.title}</Text>
          <Ionicons name="chevron-back" size={22} color={darkMode ? "#ffffff" : "#87332f"} />
        </Pressable>)}
      </View>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  section: { color: "#ffffff", backgroundColor: "#333333", borderRadius: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, fontFamily: "DMSans_400Regular", fontSize: 13, letterSpacing: 1 },
  list: { gap: 10 },
  item: { backgroundColor: "#ffffff", borderRadius: 14, minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 15 },
  darkItem: { backgroundColor: darkPalette.panel },
  itemText: { flex: 1, color: "#251e20", fontFamily: "DMSans_700Bold", fontSize: 16 },
  darkText: { color: "#ffffff" },
});
