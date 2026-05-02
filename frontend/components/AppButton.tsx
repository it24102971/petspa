import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { SIZES } from "../constants/spacing";

export default function AppButton({ title, onPress, color, textColor }: { title: string; onPress: () => void; color?: string; textColor?: string }) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color || COLORS.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: textColor || COLORS.primaryText }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: SIZES.buttonHeight,
    borderRadius: SIZES.buttonRadius,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
