import LottieView from "lottie-react-native";
import { StyleSheet } from "react-native";

const animation = require("../../assets/gather-splash.json");

export function SplashAnimation({ onFinish, onReady }: { onFinish: () => void; onReady: () => void }) {
  return (
    <LottieView
      source={animation}
      autoPlay
      loop={false}
      resizeMode="contain"
      style={styles.animation}
      onAnimationLoaded={onReady}
      onAnimationFinish={(cancelled) => { if (!cancelled) onFinish(); }}
      onAnimationFailure={(error) => { console.error("Unable to play splash animation:", error); onFinish(); }}
    />
  );
}

const styles = StyleSheet.create({
  animation: { width: "100%", height: "100%" },
});
