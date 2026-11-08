import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";

const gala = require("../../assets/images/gala_not_found.png");

export default function NotFoundScreen() {
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <DashboardLayout showNavigation={false}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">404 Not Found</Text>
        <Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} />
        <Text style={styles.subtitle}>Gala could not find what you were looking for.</Text>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.button}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 28, textAlign: "center" },
  gala: { width: "100%", maxWidth: 280, height: 220 },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 16, lineHeight: 23, textAlign: "center" },
  button: { minHeight: 48, minWidth: 180, borderRadius: 24, backgroundColor: "#c65d58", justifyContent: "center", alignItems: "center", padding: 12 },
  buttonText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
