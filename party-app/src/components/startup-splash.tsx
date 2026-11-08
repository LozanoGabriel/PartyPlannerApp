import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, View, type ImageErrorEventData, type NativeSyntheticEvent } from "react-native";

const splashImage = require("../../assets/images/gather_frame_4.png");
const SPLASH_DURATION_MS = 3500;
const ENTRANCE_DURATION_MS = 800;

export function StartupSplash({ onFinish }: { onFinish: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback((event: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.error("Unable to load splash image:", event.nativeEvent.error);
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
      changed = true;
      setReducedMotion(reduced);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active && !changed) setReducedMotion(reduced);
    }).catch((error) => {
      console.error("Unable to check reduced motion preference:", error);
      if (active && !changed) setReducedMotion(true);
    });
    return () => { active = false; subscription.remove(); };
  }, []);

  const ready = imageLoaded && reducedMotion !== null;

  useEffect(() => {
    if (!ready) return;
    const timeout = setTimeout(onFinish, SPLASH_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [ready, onFinish]);

  useEffect(() => {
    if (!ready) return;
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, ready, reducedMotion]);

  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => {
      console.error("Splash screen did not become ready in time.");
      onFinish();
    }, 5000);
    return () => clearTimeout(timeout);
  }, [ready, onFinish]);

  return (
    <View style={styles.overlay} accessibilityLabel="Gather is starting">
      <Animated.View style={[styles.art, {
        opacity: entrance,
        transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
      }]}>
        <Image
          source={splashImage}
          resizeMode="contain"
          style={styles.image}
          accessible={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#ffa49f", alignItems: "center", justifyContent: "center" },
  art: { width: "85%", maxWidth: 480, aspectRatio: 720 / 870 },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
});
