import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

const thinkingGala = require("../../assets/images/gala_thinking.png");

export function SaveChangesDialog({ visible, onClose, onDiscard, onSave, message }: {
  visible: boolean;
  onClose: () => void;
  onDiscard?: () => void;
  onSave?: () => void;
  message: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <Image source={thinkingGala} style={styles.image} resizeMode="contain" accessible={false} />
            <Text style={styles.title} accessibilityRole="header">Save changes?</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          {onSave && <Pressable accessibilityRole="button" onPress={onSave} style={styles.primary}><Text style={styles.primaryText}>Save Changes</Text></Pressable>}
          {onDiscard && <Pressable accessibilityRole="button" onPress={onDiscard} style={styles.action}><Text style={styles.actionText}>Discard Changes</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.action}><Text style={styles.actionText}>Keep Editing</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 400, backgroundColor: "#ffffff", borderRadius: 20, padding: 20, gap: 12 },
  header: { alignItems: "center", gap: 4 },
  image: { width: 88, height: 72 },
  title: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 20, textAlign: "center" },
  message: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  primary: { backgroundColor: "#c65d58", minHeight: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  action: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  actionText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15 },
});
