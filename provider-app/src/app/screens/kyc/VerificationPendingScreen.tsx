import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function VerificationPendingScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </TouchableOpacity>
      <View style={styles.container}>
        {/* Icon */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.iconWrap}>
          <Ionicons name="document-text" size={56} color="#6366F1" />
        </Animated.View>

        {/* Text */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.textBlock}>
          <Text style={styles.title}>Documents Submitted!</Text>
          <Text style={styles.subtitle}>
            Our team will review your KYC documents within{" "}
            <Text style={styles.highlight}>24–48 hours</Text>.
          </Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.steps}>
          {[
            { icon: "checkmark-circle", text: "Documents uploaded successfully", done: true },
            { icon: "time-outline",     text: "Admin review in progress",        done: false },
            { icon: "rocket-outline",   text: "Account activated & ready",       done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Ionicons
                name={step.icon as any}
                size={20}
                color={step.done ? "#16A34A" : "#D1D5DB"}
              />
              <Text style={[styles.stepText, !step.done && { color: "#9CA3AF" }]}>
                {step.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Button */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("WaitingApproval")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Track Approval Status</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.note}>
            You'll be notified as soon as your account is approved
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  textBlock: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  highlight: { color: "#6366F1", fontWeight: "700" },

  steps: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 32,
  },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepText: { fontSize: 14, fontWeight: "500", color: "#374151", flex: 1 },

  footer: { width: "100%", alignItems: "center", gap: 12 },
  btn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    borderRadius: 14,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  note: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },
});
