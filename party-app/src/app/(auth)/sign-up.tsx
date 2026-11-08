import { router } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AuthField, AuthPage, darkStyles, isValidEmail, styles } from "../../components/auth-ui";
import { useAppPreferences } from "../../components/app-preferences";

const logo = require("../../../assets/images/gather_frame_3.png");

export default function SignUpScreen() {
  const { darkMode } = useAppPreferences();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width, 480);

  const nameError = submitted && !fullName.trim() ? "Enter your full name." : undefined;
  const emailError = submitted && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError = submitted && !password ? "Enter your password." : undefined;
  const confirmError = submitted && (!confirmPassword || confirmPassword !== password)
    ? "Passwords must match." : undefined;
  const termsError = submitted && !agreed ? "Please agree to the terms to continue." : undefined;

  function submit() {
    setSubmitted(true);
    if (fullName.trim() && isValidEmail(email) && password && confirmPassword === password && agreed) {
      router.push("/dashboard");
    }
  }

  return (
    <AuthPage>
      <View style={[styles.hero, local.logoFrame, { height: logoSize * 0.38 }]}>
        <Image
          source={logo}
          resizeMode="contain"
          style={[local.logo, { width: logoSize, height: logoSize, top: -logoSize * 0.39 }]}
          accessibilityLabel="Gather logo"
        />
      </View>
      <View style={[styles.card, darkMode && darkStyles.card]}>
        <Text style={[local.heading, darkMode && darkStyles.text]}>Create an account</Text>
        <AuthField label="Full Name" value={fullName} onChangeText={setFullName} error={nameError}
          autoCapitalize="words" autoComplete="name" autoCorrect={false} placeholder="Enter your full name" />
        <AuthField label="Email" value={email} onChangeText={setEmail} error={emailError}
          autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address"
          placeholder="Enter your email" />
        <AuthField label="Password" value={password} onChangeText={setPassword} error={passwordError}
          autoCapitalize="none" autoComplete="new-password" revealPassword placeholder="Enter your password" />
        <AuthField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} error={confirmError}
          autoCapitalize="none" autoComplete="new-password" revealPassword placeholder="Confirm your password" />
        <View style={local.termsSection}>
          <Pressable
            style={local.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityLabel="I agree to the terms and conditions"
            accessibilityState={{ checked: agreed }}
            aria-checked={agreed}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[local.checkbox, darkMode && local.darkCheckbox, agreed && local.checked]}>
              {agreed && <Text style={local.checkmark}>✓</Text>}
            </View>
            <Text style={[local.termsLabel, darkMode && darkStyles.text]}>I agree to the terms and conditions</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setTermsVisible(true)}>
            <Text style={[styles.link, darkMode && darkStyles.text]}>Read terms and privacy notice</Text>
          </Pressable>
          {termsError && <Text style={[styles.error, darkMode && darkStyles.accent]} accessibilityLiveRegion="polite">{termsError}</Text>}
        </View>
        <Pressable style={[styles.button, darkMode && darkStyles.button]} accessibilityRole="button" onPress={submit}>
          <Text style={styles.buttonText}>Sign Up (preview)</Text>
        </Pressable>
        <Text style={[styles.notice, darkMode && darkStyles.text]}>No account will be created.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
          <Text style={[styles.link, darkMode && darkStyles.text]}>Back to sign in</Text>
        </Pressable>
      </View>

      <Modal visible={termsVisible} transparent animationType="slide" onRequestClose={() => setTermsVisible(false)}>
        <View style={local.modalBackdrop}>
          <View style={[local.modal, darkMode && darkStyles.card]} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={local.modalContent}>
              <Text style={[local.heading, darkMode && darkStyles.text]} accessibilityRole="header">Terms and privacy (draft)</Text>
              <Text style={[styles.label, darkMode && darkStyles.text]}>This is a placeholder for review, not the final terms or privacy policy. Account registration is not yet available.</Text>
              <Text style={[styles.label, darkMode && darkStyles.text]}>The final notice should explain how account and event information is collected, used, stored, and shared, including any information sent to AI providers.</Text>
              <Text style={[styles.label, darkMode && darkStyles.text]}>It should also explain applicable privacy rights, how to make a request, and the limitations of AI-generated suggestions.</Text>
              <Pressable style={[styles.button, darkMode && darkStyles.button]} accessibilityRole="button" onPress={() => setTermsVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AuthPage>
  );
}

const local = StyleSheet.create({
  logoFrame: { overflow: "hidden", marginTop: 16 },
  logo: { position: "absolute" },
  heading: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 22, lineHeight: 28 },
  termsSection: { gap: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: "#2c2c2c", borderRadius: 4, alignItems: "center", justifyContent: "center" },
  darkCheckbox: { borderColor: "#ffffff" },
  checked: { backgroundColor: "#2c2c2c" },
  checkmark: { color: "#ffffff", fontSize: 18 },
  termsLabel: { flex: 1, color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#ffffff", borderRadius: 8, maxHeight: "80%", width: "100%", maxWidth: 480, alignSelf: "center" },
  modalContent: { padding: 24, gap: 20 },
});
