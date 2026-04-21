import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SplashLoader() {
  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={64} color="#2563EB" />

      <Text style={styles.title}>HomeServex</Text>

      <ActivityIndicator
        size="large"
        color="#2563EB"
        style={{ marginTop: 20 }}
      />

      <Text style={styles.subtitle}>
        Preparing your workspace...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    color: "#111827",
  },

  subtitle: {
    marginTop: 12,
    color: "#6B7280",
  },
});