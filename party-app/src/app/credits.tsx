import { StyleSheet, Text, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { SettingsLayout } from "../components/settings-layout";

export default function CreditsScreen() {
  const { darkMode } = useAppPreferences();
  return (
    <SettingsLayout title="Credits">
      <View style={[styles.card, darkMode && styles.darkCard]}>
        {[
          { title: "Frontend Team:", lines: ["Gabriel Lozano", "Mario Casas"] },
          { title: "Backend Team:", lines: ["Claribel Hernandez", "Cristian Mantilla"] },
          { title: "From:", lines: ["Florida International University"] },
          { title: "Logo/Icon Art:", lines: ["Audrey Jones"] },
        ].map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.heading, darkMode && styles.darkText]}>{section.title}</Text>
            {section.lines.map((line) => <Text key={line} style={[styles.text, darkMode && styles.darkText]}>{line}</Text>)}
          </View>
        ))}
      </View>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, gap: 24 },
  section: { gap: 4 },
  heading: { color: "#251e20", fontFamily: "DMSans_700Bold", fontSize: 16, lineHeight: 23 },
  darkCard: { backgroundColor: darkPalette.panel },
  text: { color: "#251e20", fontFamily: "DMSans_400Regular", fontSize: 16, lineHeight: 23 },
  darkText: { color: darkPalette.text },
});
