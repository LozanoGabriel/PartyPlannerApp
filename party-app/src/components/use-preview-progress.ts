import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";

export function usePreviewProgress() {
  const progress = useRef(new Animated.Value(0)).current;
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    let active = true;
    let motionChanged = false;
    let started = false;
    const listener = progress.addListener(({ value }) => setFraction(value));
    const finish = () => { progress.stopAnimation(); progress.setValue(1); };
    const start = () => {
      if (started) return;
      started = true;
      Animated.timing(progress, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    };
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
      motionChanged = true;
      if (reduced) finish();
      else start();
    });
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active || motionChanged) return;
      if (reduced) finish();
      else start();
    }).catch((error) => {
      console.error("Unable to check reduced motion preference:", error);
      if (active) finish();
    });
    return () => {
      active = false;
      subscription.remove();
      progress.stopAnimation();
      progress.removeListener(listener);
    };
  }, [progress]);

  return { progress, fraction };
}
