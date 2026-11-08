import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { AuthField, AuthPage, darkStyles, isValidEmail, styles } from "../../components/auth-ui";
import { useAppPreferences } from "../../components/app-preferences";
import { getSupabaseClient } from "../../lib/supabase";
import { signInWithGoogle } from "../../lib/google-auth";

const elephant = require("../../../assets/images/gala_front_facing.png");

export default function LoginScreen() {
  const { darkMode } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const { width } = useWindowDimensions();
  const elephantSize = Math.min(width, 480) * 1.08;
  const emailError = (submitted || emailTouched) && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError = (submitted || passwordTouched) && !password ? "Enter your password." : undefined;

  async function signIn() {
    setSubmitted(true);
    setAuthError(undefined);
    if (!isValidEmail(email) || !password) return;

    setIsSigningIn(true);
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      router.replace("/dashboard");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function googleSignIn() {
    setAuthError(undefined);
    setIsGoogleSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result === "success") router.replace("/dashboard");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in with Google.");
    } finally {
      setIsGoogleSigningIn(false);
    }
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
        {authError && <Text style={[styles.error, darkMode && darkStyles.accent]} accessibilityLiveRegion="polite">{authError}</Text>}
        <Pressable
          style={[styles.button, darkMode && darkStyles.button, (isSigningIn || isGoogleSigningIn) && styles.disabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningIn || isGoogleSigningIn }}
          disabled={isSigningIn || isGoogleSigningIn}
          onPress={signIn}
        >
          <Text style={styles.buttonText}>{isSigningIn ? "Signing In..." : "Sign In"}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.googleButton, darkMode && darkStyles.button, isGoogleSigningIn && styles.disabled]}
          onPress={googleSignIn}
          disabled={isSigningIn || isGoogleSigningIn}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningIn || isGoogleSigningIn }}
        >
          <Text style={[styles.googleButtonText, darkMode && darkStyles.text]}>
            {isGoogleSigningIn ? "Connecting to Google..." : "Sign in with Google"}
          </Text>
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
