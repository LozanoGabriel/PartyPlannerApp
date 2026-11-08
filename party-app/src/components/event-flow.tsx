import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DashboardLayout } from "./dashboard-layout";

const TOTAL_STEPS = 5;
const gala = require("../../assets/images/gala_front_facing.png");

export function GalaMessage({ heading, children }: { heading: string; children: string }) {
  return (
    <View style={styles.galaBox}>
      <View style={styles.galaFrame}>
        <Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} />
      </View>
      <View style={styles.galaText}>
        <Text style={styles.galaHeading}>{heading}</Text>
        <Text style={styles.galaMessage}>{children}</Text>
      </View>
    </View>
  );
}

export function EventFlowLayout({ step, children }: { step: number; children: ReactNode }) {
  return (
    <DashboardLayout showNavigation={false} compactContent>
      <View style={[styles.flow, step === 3 && styles.compactFlow]}>
        <View style={step === 3 && styles.stepThreeProgress}>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
          <View
            style={styles.progress}
            accessibilityRole="progressbar"
            accessibilityLabel="Event planning progress"
            accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: step, text: `Step ${step} of ${TOTAL_STEPS}` }}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step}
            aria-valuetext={`Step ${step} of ${TOTAL_STEPS}`}
          >
            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
        </View>
        {children}
      </View>
    </DashboardLayout>
  );
}

export function EventFlowButtons({ onBack, onContinue, disabled = false, disabledHint, continueLabel = "Continue" }: {
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
  disabledHint?: string;
  continueLabel?: string;
}) {
  return (
    <View style={styles.buttons}>
      <Pressable style={styles.button} accessibilityRole="button" onPress={onBack}>
        <Text style={styles.buttonText}>Go Back</Text>
      </Pressable>
      <Pressable
        style={[styles.button, disabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityHint={disabled ? disabledHint : undefined}
        disabled={disabled}
        onPress={onContinue}
      >
        <Text style={styles.buttonText}>{continueLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1, gap: 12 },
  compactFlow: { gap: 5 },
  stepThreeProgress: { marginBottom: 8 },
  stepLabel: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, marginBottom: 6 },
  progress: { height: 8, borderRadius: 8, backgroundColor: "#ffffff", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#c65d58", borderRadius: 8 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 4 },
  button: { flex: 1, minHeight: 48, backgroundColor: "#ffffff", borderRadius: 24, justifyContent: "center", alignItems: "center", padding: 12 },
  buttonText: { color: "#c65d58", fontFamily: "DMSans_700Bold", fontSize: 16, textAlign: "center" },
  disabled: { opacity: 0.55 },
  galaBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffffff", borderRadius: 18, padding: 10 },
  galaFrame: { width: 52, height: 52, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 86, height: 86 },
  galaText: { flex: 1, gap: 2 },
  galaHeading: { color: "#c65d58", fontFamily: "DMSans_700Bold", fontSize: 16 },
  galaMessage: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 17 },
});
