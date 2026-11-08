import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { NanumPenScript_400Regular } from "@expo-google-fonts/nanum-pen-script/400Regular";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const elephant = require("../../../assets/images/gala_front_facing.png");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailErrorMessage = "Enter a valid email address.";
const passwordErrorMessage = "Enter your password.";

export default function LoginScreen() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    NanumPenScript_400Regular,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { width } = useWindowDimensions();
  const elephantSize = Math.min(width, 480) * 1.08;

  useEffect(() => {
    if (fontError) {
      console.error("Failed to load login fonts:", fontError);
    }
  }, [fontError]);

  // Validate on blur so errors do not appear before the user finishes typing.
  const emailError = emailTouched && !emailPattern.test(email.trim());
  const passwordError = passwordTouched && password.length === 0;

  // Keep the form hidden until its fonts are ready, and report loading failures.
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.page}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.status}>
          {fontError ? (
            <Text accessibilityRole="alert">Unable to load the login fonts. Please restart the app.</Text>
          ) : (
            <ActivityIndicator size="large" color="#2c2c2c" accessibilityLabel="Loading login screen" />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              Welcome to gather!
            </Text>
            <Text style={styles.subtitle}>The Event Planner App</Text>
            {/* Crop the transparent padding so Gala sits between the text and form. */}
            <View style={[styles.elephantFrame, { height: elephantSize * 0.48 }]}>
              <Image
                source={elephant}
                resizeMode="contain"
                style={[styles.elephant, {
                  width: elephantSize,
                  height: elephantSize,
                  top: -elephantSize * 0.25,
                }]}
                accessible={false}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                accessibilityHint={emailError ? emailErrorMessage : undefined}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setEmailTouched(true)}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="Enter email address here..."
                placeholderTextColor="#767676"
                style={[styles.input, emailError && styles.invalidInput]}
              />
              {emailError && (
                <Text style={styles.error} accessibilityLiveRegion="polite">{emailErrorMessage}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                accessibilityHint={passwordError ? passwordErrorMessage : undefined}
                value={password}
                onChangeText={setPassword}
                onBlur={() => setPasswordTouched(true)}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                placeholder="Enter Password here..."
                placeholderTextColor="#767676"
                style={[styles.input, passwordError && styles.invalidInput]}
              />
              {passwordError && (
                <Text style={styles.error} accessibilityLiveRegion="polite">{passwordErrorMessage}</Text>
              )}
            </View>

            {/* Enable these controls when authentication and its routes are implemented. */}
            <Pressable
              style={[styles.button, styles.disabled]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.googleButton, styles.disabled]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </Pressable>

            <Pressable
              disabled
              accessibilityRole="link"
              accessibilityState={{ disabled: true }}
            >
              <Text
                style={[styles.link, styles.disabledLink]}
              >
                Forgot password?
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.signUpButton, styles.disabled]}
              disabled
              accessibilityRole="button"
              accessibilityLabel="Sign Up"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>
            <Text style={styles.notice}>Sign in, Google sign in, sign up, and password reset are not available yet.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#ffa49f" },
  keyboard: { flex: 1 },
  status: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { flexGrow: 1, paddingBottom: 48 },
  hero: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "center" },
  title: {
    marginTop: 24,
    color: "#ffffff",
    fontFamily: "NanumPenScript_400Regular",
    fontSize: 50,
    lineHeight: 60,
    maxWidth: "100%",
    paddingHorizontal: 12,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "#ffffff",
    fontFamily: "NanumPenScript_400Regular",
    fontSize: 38,
    lineHeight: 46,
    textAlign: "center",
  },
  elephantFrame: { width: "100%", overflow: "hidden", alignItems: "center" },
  elephant: { position: "absolute" },
  card: {
    width: "77%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 24,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  field: { gap: 8 },
  label: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22.4 },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#1e1e1e",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 20,
  },
  invalidInput: { borderColor: "#b3261e" },
  error: { color: "#b3261e", fontFamily: "Inter_400Regular", fontSize: 14 },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2c2c2c",
    borderRadius: 8,
    backgroundColor: "#2c2c2c",
    padding: 12,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#f5f5f5", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 20 },
  googleButton: { backgroundColor: "#ffffff", borderColor: "#767676" },
  googleButtonText: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 20, textAlign: "center" },
  link: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22.4, textDecorationLine: "underline" },
  disabledLink: { color: "#767676" },
  signUpButton: { marginTop: 8 },
  notice: { color: "#555555", fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
});
