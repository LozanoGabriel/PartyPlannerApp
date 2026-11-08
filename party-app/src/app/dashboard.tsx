import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AuthPage, styles } from "../components/auth-ui";

export default function DashboardScreen() {
  return (
    <AuthPage>
      <View style={styles.hero}>
        <Text style={styles.title}>Dashboard preview</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>This is a placeholder. You are not signed in.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthPage>
  );
}
