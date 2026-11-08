import { Image, StyleSheet, View } from "react-native";

const logo = require("../../assets/images/gather_logo.png");

export function GatherBrand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.frame, compact && styles.compactFrame]}>
      <Image source={logo} style={[styles.logo, compact && styles.compactLogo]} resizeMode="contain" accessibilityLabel="Gather logo" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 48, height: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  compactFrame: { width: 40, height: 32 },
  logo: { width: 68, height: 68 },
  compactLogo: { width: 60, height: 60 },
});
