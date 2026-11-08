import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Image, StyleSheet, View } from "react-native";
import { SplashAnimation } from "./splash-animation";

const firstFrame = require("../../assets/images/gather_frame_1.png");

export function StartupSplash({ onFinish }: { onFinish: () => void }) {
  const [motion, setMotion] = useState<"loading" | "animate" | "reduced">("loading");
  const [animationReady, setAnimationReady] = useState(false);
  const finish = useCallback(() => onFinish(), [onFinish]);
  const ready = useCallback(() => setAnimationReady(true), []);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
      changed = true;
      if (reduced) finish();
      else setMotion("animate");
    });
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active && !changed) setMotion(reduced ? "reduced" : "animate");
    }).catch((error) => {
      console.error("Unable to check reduced motion preference:", error);
      if (active) setMotion("reduced");
    });
    const timeout = setTimeout(() => {
      console.error("Splash animation did not finish in time.");
      finish();
    }, 6000);
    return () => { active = false; clearTimeout(timeout); subscription.remove(); };
  }, [finish]);

  useEffect(() => {
    if (motion !== "reduced") return;
    const timeout = setTimeout(finish, 400);
    return () => clearTimeout(timeout);
  }, [finish, motion]);

  return (
    <View style={styles.overlay} accessibilityLabel="Gather is starting">
      <View style={styles.art}>
        {!animationReady && <Image source={firstFrame} resizeMode="contain" style={styles.firstFrame} accessible={false} />}
        {motion === "animate" && <SplashAnimation onFinish={finish} onReady={ready} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#ffa49f", alignItems: "center", justifyContent: "center" },
  art: { width: "85%", maxWidth: 480, aspectRatio: 720 / 870 },
  firstFrame: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
});
