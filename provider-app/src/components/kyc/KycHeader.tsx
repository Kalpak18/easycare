import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function KycHeader({ title, step }: { title: string; step?: string }) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {step && <Text style={styles.step}>{step}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  step: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
