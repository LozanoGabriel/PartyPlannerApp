import { Pressable, StyleSheet, View } from "react-native";

export type PreferenceSwitchProps = {
  label: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
  dark: boolean;
};

export function PreferenceSwitch({ label, detail, value, onChange, dark }: PreferenceSwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={detail}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.target}
    >
      <View style={[styles.track, value && styles.trackOn, dark && styles.darkTrack, dark && value && styles.darkTrackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn, dark && value && styles.darkThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { width: 52, height: 48, alignItems: "center", justifyContent: "center" },
  track: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#767676", padding: 3, justifyContent: "center" },
  trackOn: { backgroundColor: "#242424" },
  darkTrack: { backgroundColor: "#777777" },
  darkTrackOn: { backgroundColor: "#ffffff" },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff", alignSelf: "flex-start" },
  thumbOn: { alignSelf: "flex-end" },
  darkThumbOn: { backgroundColor: "#222222" },
});
