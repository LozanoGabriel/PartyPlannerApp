import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet } from "react-native";

const frames = [
  require("../../assets/images/gather_frame_1.png"),
  require("../../assets/images/gather_frame_2.png"),
  require("../../assets/images/gather_frame_3.png"),
  require("../../assets/images/gather_frame_4.png"),
];

export function SplashAnimation({ onFinish, onReady }: { onFinish: () => void; onReady: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onReady();
    const animation = Animated.timing(progress, { toValue: 84, duration: 2800, useNativeDriver: false });
    animation.start(({ finished }) => { if (finished) onFinish(); });
    return () => animation.stop();
  }, [onFinish, onReady, progress]);

  return (
    <>
      {frames.map((source, index) => {
        const opacity = progress.interpolate({
          inputRange: index === 0 ? [18, 24] : index === 3 ? [54, 60] : [index * 18, index * 18 + 6, index * 18 + 18, index * 18 + 24],
          outputRange: index === 0 ? [1, 0] : index === 3 ? [0, 1] : [0, 1, 1, 0],
          extrapolate: "clamp",
        });
        return <Animated.View key={index} style={[StyleSheet.absoluteFill, { opacity }]}><Image source={source} resizeMode="contain" style={styles.image} accessible={false} /></Animated.View>;
      })}
    </>
  );
}

const styles = StyleSheet.create({ image: { width: "100%", height: "100%" } });
