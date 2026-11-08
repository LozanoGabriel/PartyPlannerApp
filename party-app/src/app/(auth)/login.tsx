import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { AuthField, AuthPage, darkStyles, isValidEmail, styles } from "../../components/auth-ui";
import { useAppPreferences } from "../../components/app-preferences";

const elephant = require("../../../assets/images/gala_front_facing.png");

export default function LoginScreen() {
  const { darkMode } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { width } = useWindowDimensions();
  const elephantSize = Math.min(width, 480) * 1.08;
  const emailError = (submitted || emailTouched) && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError = (submitted || passwordTouched) && !password ? "Enter your password." : undefined;

  function previewDashboard() {
    setSubmitted(true);
    if (isValidEmail(email) && password) router.push("/dashboard");
  }

  return (
    <AuthPage>
      <View style={styles.hero}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          Welcome to gather!
        </Text>
        <Text style={styles.subtitle}>The Event Planner App</Text>
        <View style={[styles.elephantFrame, { height: elephantSize * 0.48 }]}>
          <Image
            source={elephant}
            resizeMode="contain"
            style={[styles.elephant, { width: elephantSize, height: elephantSize, top: -elephantSize * 0.25 }]}
            accessible={false}
          />
        </View>
      </View>

      <View style={[styles.card, darkMode && darkStyles.card]}>
        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setEmailTouched(true)}
          error={emailError}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Enter email address here..."
        />
        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setPasswordTouched(true)}
          error={passwordError}
          autoCapitalize="none"
          autoComplete="current-password"
          revealPassword
          placeholder="Enter Password here..."
        />
        <Pressable style={[styles.button, darkMode && darkStyles.button]} accessibilityRole="button" onPress={previewDashboard}>
          <Text style={styles.buttonText}>Sign In (preview)</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.googleButton, darkMode && darkStyles.button, styles.disabled]}
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
        >
          <Text style={[styles.googleButtonText, darkMode && darkStyles.text]}>Sign in with Google</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/forgot-password")}>
          <Text style={[styles.link, darkMode && darkStyles.text]}>Forgot password?</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.signUpButton, darkMode && darkStyles.button]} accessibilityRole="button" onPress={() => router.push("/sign-up")}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>
        <Text style={[styles.notice, darkMode && darkStyles.text]}>Credentials are not verified and Google sign in is unavailable.</Text>
      </View>
    </AuthPage>
  );
}
