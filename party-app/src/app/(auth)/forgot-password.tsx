import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthField, AuthPage, darkStyles, isValidEmail, styles } from "../../components/auth-ui";
import { useAppPreferences } from "../../components/app-preferences";

export default function ForgotPasswordScreen() {
  const { darkMode } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const emailError = submitted && !isValidEmail(email) ? "Enter a valid email address." : undefined;

  return (
    <AuthPage>
      <View style={styles.hero}>
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>Reset your password</Text>
      </View>
      <View style={[styles.card, darkMode && darkStyles.card]}>
        <Text style={[styles.label, darkMode && darkStyles.text]}>Enter the email address associated with your account.</Text>
        <AuthField label="Email" value={email} onChangeText={(value) => { setEmail(value); setUnavailable(false); }} error={emailError}
          autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address"
          placeholder="Enter your email" />
        <Pressable style={[styles.button, darkMode && darkStyles.button]} accessibilityRole="button" onPress={() => {
          setSubmitted(true);
          setUnavailable(isValidEmail(email));
        }}>
          <Text style={styles.buttonText}>Send reset link</Text>
        </Pressable>
        {unavailable && (
          <Text style={[styles.notice, darkMode && darkStyles.text]} accessibilityRole="alert">Password reset is not available yet. No email was sent.</Text>
        )}
        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
          <Text style={[styles.link, darkMode && darkStyles.text]}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthPage>
  );
}
