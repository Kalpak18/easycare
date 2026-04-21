import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const STEPS = [
  {
    icon: "person-circle-outline",
    color: "#6366F1",
    bg: "#EEF2FF",
    title: "Personal Documents",
    desc: "Aadhaar card (front & back), PAN card",
  },
  {
    icon: "card-outline",
    color: "#0EA5E9",
    bg: "#E0F2FE",
    title: "Bank Proof",
    desc: "Passbook or cancelled cheque for payouts",
  },
  {
    icon: "camera-outline",
    color: "#10B981",
    bg: "#D1FAE5",
    title: "Profile Photo",
    desc: "Clear face photo for customer trust",
  },
  {
    icon: "time-outline",
    color: "#F59E0B",
    bg: "#FEF3C7",
    title: "24–48 hrs Review",
    desc: "Our team reviews and activates your account",
  },
];

export default function KycIntroScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Icon */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={48} color="#6366F1" />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.titleBlock}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            Complete KYC to unlock all features and start receiving jobs.
          </Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.stepsCard}>
          {STEPS.map((s, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.stepDivider} />}
              <View style={styles.stepRow}>
                <View style={[styles.stepIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.noteCard}>
          <Ionicons name="lock-closed-outline" size={14} color="#2563EB" />
          <Text style={styles.noteText}>
            Your documents are encrypted and used only for verification.
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("KycStatus")}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Start Verification</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  titleBlock: { alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  stepsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
  stepDivider: { height: 1, backgroundColor: "#F3F4F6" },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: { flex: 1, justifyContent: "center" },
  stepTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  stepDesc: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 17 },

  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    width: "100%",
  },
  noteText: { flex: 1, fontSize: 12, color: "#1E40AF", lineHeight: 17 },

  footer: { width: "100%" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
