import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  AppState,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

import { getSocket } from "../../../socket/socket";
import { useProviderStore } from "../../../store/provider.store";
import { useAuthStore } from "../../../store/auth.store";
import { listenForNewRequests } from "../../../socket/request.socket";
import { acceptRequest, rejectRequest } from "../../../services/request.service";
import { useRequestStore } from "../../../store/request.store";
import { joinProviderRoom } from "../../../socket/socket";
import {
  startLocationTracking,
  stopLocationTracking,
} from "../../../services/location.service";

type RootStackParamList = {
  JobDetails: { requestId: string };
  KycFlow: undefined;
};
type Nav = NativeStackNavigationProp<RootStackParamList>;

// Animated status card that shifts between green/dark based on online state
function OnlineCard({
  isOnline,
  togglingOnline,
  onToggle,
}: {
  isOnline: boolean;
  togglingOnline: boolean;
  onToggle: () => void;
}) {
  const progress = useSharedValue(isOnline ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isOnline ? 1 : 0, { duration: 350 });
  }, [isOnline]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["#1C1C1E", "#0A7E45"]
    ),
  }));

  return (
    <Animated.View style={[styles.onlineCard, animStyle]}>
      <View style={styles.onlineLeft}>
        <View
          style={[
            styles.onlinePulse,
            { backgroundColor: isOnline ? "#4ADE80" : "#6B7280" },
          ]}
        />
        <View>
          <Text style={styles.onlineLabel}>Status</Text>
          <Text style={styles.onlineStatus}>
            {togglingOnline ? "Updating..." : isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <Switch
        value={isOnline}
        onValueChange={onToggle}
        disabled={togglingOnline}
        trackColor={{ false: "#3A3A3C", true: "#4ADE80" }}
        thumbColor={isOnline ? "#fff" : "#9CA3AF"}
        ios_backgroundColor="#3A3A3C"
      />
    </Animated.View>
  );
}

function StatCard({
  icon,
  value,
  label,
  colors,
  delay,
}: {
  icon: string;
  value: string;
  label: string;
  colors: [string, string];
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statWrapper}>
      <LinearGradient colors={colors} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon as any} size={22} color="rgba(255,255,255,0.85)" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();

  const setRequest = useRequestStore((s) => s.setRequest);
  const request = useRequestStore((s) => s.request);
  const clearRequest = useRequestStore((s) => s.clearRequest);
  const [countdown, setCountdown] = useState(30);

  const { dashboard, loading, error, fetchDashboard, toggleOnline } =
    useProviderStore();

  const accessToken = useAuthStore((s) => s.accessToken);

  /* ─── Audio alert ──────────────────────────────── */
  const playAlert = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../../assets/job-alert.mp3")
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
      });
    } catch {}
  }, []);

  /* ─── Socket listener ──────────────────────────── */
  useEffect(() => {
    const handler = (data: any) => {
      setRequest(data);
      playAlert();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    listenForNewRequests(handler);
    return () => {
      getSocket()?.off("new_request", handler);
    };
  }, []);

  /* ─── Fetch on focus + poll every 20s while screen is active ──── */
  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      fetchDashboard();

      // Poll while the tab is in the foreground — picks up job assignments,
      // status changes, and wallet updates without needing a manual refresh.
      const poll = setInterval(() => fetchDashboard(true), 20_000);
      return () => clearInterval(poll);
    }, [accessToken])
  );

  /* ─── Re-fetch when app returns to foreground ──── */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && accessToken) fetchDashboard(true);
    });
    return () => sub.remove();
  }, [accessToken]);

  /* ─── Join socket room ─────────────────────────── */
  useEffect(() => {
    const providerId = (dashboard?.profile as any)?.id;
    if (providerId) joinProviderRoom(providerId);
  }, [dashboard?.profile]);

  /* ─── Clear pending request when busy ─────────── */
  useEffect(() => {
    if ((dashboard?.activeJobs?.length ?? 0) > 0) clearRequest();
  }, [dashboard?.activeJobs?.length]);

  /* ─── Countdown timer for job request ─────────── */
  useEffect(() => {
    if (!request) return;
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); clearRequest(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request?.requestId]);

  /* ─── Toggle handler ───────────────────────────── */
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const goingOnline = !dashboard?.profile.isOnline;
    toggleOnline();
    if (goingOnline) startLocationTracking();
    else stopLocationTracking();
  };

  /* ─── Loading skeleton ─────────────────────────── */
  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletonContainer}>
          {[180, 100, 100].map((h, i) => (
            <View key={i} style={[styles.skeletonBlock, { height: h }]} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard?.profile) return null;

  const profile = dashboard.profile;
  const activeJobs = dashboard.activeJobs ?? [];
  const todayEarnings = dashboard.todayEarnings ?? 0;
  const wallet = dashboard.wallet ?? { balance: 0, blocked: false };
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchDashboard}
            tintColor="#4ADE80"
            colors={["#4ADE80"]}
          />
        }
      >
        {/* ── HEADER ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
            <Text style={styles.name}>{profile.name}</Text>
            <View style={styles.categoryBadge}>
              <Ionicons name="construct-outline" size={12} color="#6366F1" />
              <Text style={styles.categoryText}>
                {profile.category?.name ?? "Service Provider"}
              </Text>
            </View>
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {profile.name?.charAt(0)?.toUpperCase() ?? "P"}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* ── ONLINE / OFFLINE CARD ──────────────── */}
          <Animated.View entering={FadeInDown.delay(150)}>
            <OnlineCard
              isOnline={profile.isOnline}
              togglingOnline={false}
              onToggle={handleToggle}
            />
          </Animated.View>

          {/* ── STATS ROW ──────────────────────────── */}
          <View style={styles.statsRow}>
            <StatCard
              icon="wallet-outline"
              value={`₹${wallet.balance}`}
              label="Wallet"
              colors={["#6366F1", "#818CF8"]}
              delay={200}
            />
            <StatCard
              icon="briefcase-outline"
              value={String(activeJobs.length)}
              label="Active Jobs"
              colors={["#0EA5E9", "#38BDF8"]}
              delay={250}
            />
            <StatCard
              icon="trending-up-outline"
              value={`₹${todayEarnings}`}
              label="Today"
              colors={["#10B981", "#34D399"]}
              delay={300}
            />
          </View>

          {/* ── RATING ROW ─────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(350)} style={styles.ratingCard}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.ratingValue}>
                {profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
              </Text>
              <Text style={styles.ratingLabel}>Your rating</Text>
            </View>
            <View style={styles.ratingDivider} />
            <View style={styles.ratingRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
              <Text style={styles.ratingValue}>{activeJobs.length}</Text>
              <Text style={styles.ratingLabel}>Jobs today</Text>
            </View>
          </Animated.View>

          {/* ── ERROR ──────────────────────────────── */}
          {error && (
            <Animated.View entering={FadeInDown} style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* ── ACTIVE JOBS LIST ───────────────────── */}
          {activeJobs.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <Text style={styles.sectionTitle}>Active Jobs</Text>
              {activeJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() =>
                    (navigation as any).navigate("JobDetails", { requestId: job.id })
                  }
                  activeOpacity={0.75}
                >
                  <View style={styles.jobLeft}>
                    <View style={styles.jobIconWrap}>
                      <Ionicons name="hammer-outline" size={18} color="#6366F1" />
                    </View>
                    <View>
                      <Text style={styles.jobCategory}>
                        {job.category?.name ?? "Service"}
                      </Text>
                      <Text style={styles.jobCustomer}>
                        {job.user?.name ?? "Customer"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.jobRight}>
                    <Text style={styles.jobAmount}>₹{job.totalAmount}</Text>
                    <View style={[styles.jobStatus, getStatusStyle(job.status)]}>
                      <Text style={styles.jobStatusText}>{job.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* ── EMPTY STATE when offline ───────────── */}
          {activeJobs.length === 0 && !profile.isOnline && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔌</Text>
              <Text style={styles.emptyTitle}>You're offline</Text>
              <Text style={styles.emptySub}>
                Toggle online above to start receiving job requests
              </Text>
            </Animated.View>
          )}

          {activeJobs.length === 0 && profile.isOnline && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👀</Text>
              <Text style={styles.emptyTitle}>Looking for jobs...</Text>
              <Text style={styles.emptySub}>
                You're online. New requests will appear here automatically.
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── INCOMING JOB REQUEST OVERLAY ───────────── */}
      {request && activeJobs.length === 0 && (
        <Animated.View entering={FadeInUp.duration(350).springify()} style={styles.requestOverlay}>
          <View style={styles.requestPill}>
            <View style={styles.requestPillDot} />
            <Text style={styles.requestPillText}>New Request</Text>
          </View>

          <Text style={styles.requestCustomer}>{request.customerName}</Text>
          <Text style={styles.requestService}>{request.service}</Text>

          <View style={styles.requestMeta}>
            <View style={styles.requestMetaItem}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.requestMetaText}>{request.distance}</Text>
            </View>
            <View style={styles.requestMetaItem}>
              <Ionicons name="cash-outline" size={14} color="#6B7280" />
              <Text style={styles.requestMetaText}>₹{request.price}</Text>
            </View>
          </View>

          {/* Countdown bar */}
          <View style={styles.countdownWrap}>
            <View style={[styles.countdownBar, { width: `${(countdown / 30) * 100}%` }]} />
          </View>
          <Text style={styles.countdownText}>Accept within {countdown}s</Text>

          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={async () => {
                try { await rejectRequest(request.requestId); } catch {}
                clearRequest();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#DC2626" />
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={async () => {
                try {
                  await acceptRequest(request.requestId);
                  clearRequest();
                  (navigation as any).navigate("JobDetails", { requestId: request.requestId });
                } catch (err: any) {
                  clearRequest();
                  console.error("Accept failed:", err?.response?.data?.message ?? err?.message);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getStatusStyle(status: string) {
  if (status === "IN_PROGRESS") return { backgroundColor: "#D1FAE5" };
  if (status === "ASSIGNED") return { backgroundColor: "#DBEAFE" };
  return { backgroundColor: "#F3F4F6" };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },

  skeletonContainer: { padding: 20, gap: 12 },
  skeletonBlock: {
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
    opacity: 0.6,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  name: { fontSize: 24, fontWeight: "700", color: "#111827", marginTop: 2 },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  categoryText: { fontSize: 11, color: "#6366F1", fontWeight: "600" },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "700", color: "#fff" },

  content: { paddingHorizontal: 16, paddingBottom: 100 },



  /* Online card */
  onlineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  onlineLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  onlinePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  onlineLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  onlineStatus: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 1 },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  statWrapper: { flex: 1 },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "500" },

  /* Rating card */
  ratingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  ratingValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  ratingLabel: { fontSize: 12, color: "#9CA3AF" },
  ratingDivider: { width: 1, height: 28, backgroundColor: "#F3F4F6", marginHorizontal: 12 },

  /* Error */
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: { fontSize: 13, color: "#DC2626", flex: 1 },

  /* Section title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 10,
  },

  /* Job cards */
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  jobLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  jobIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  jobCategory: { fontSize: 14, fontWeight: "600", color: "#111827" },
  jobCustomer: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  jobRight: { alignItems: "flex-end", gap: 4 },
  jobAmount: { fontSize: 15, fontWeight: "700", color: "#111827" },
  jobStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  jobStatusText: { fontSize: 10, fontWeight: "600", color: "#374151" },

  /* Empty states */
  emptyState: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20 },

  /* Job request overlay */
  requestOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  requestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  requestPillDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#D97706",
  },
  requestPillText: { fontSize: 11, fontWeight: "700", color: "#D97706" },
  requestCustomer: { fontSize: 20, fontWeight: "700", color: "#111827" },
  requestService: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  requestMeta: { flexDirection: "row", gap: 16, marginTop: 10 },
  requestMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  requestMetaText: { fontSize: 13, color: "#6B7280" },
  countdownWrap: {
    height: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 2,
    marginTop: 14,
    overflow: "hidden",
  },
  countdownBar: {
    height: 4,
    backgroundColor: "#F59E0B",
    borderRadius: 2,
  },
  countdownText: { fontSize: 12, color: "#9CA3AF", marginTop: 4, marginBottom: 14 },
  requestButtons: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    paddingVertical: 14,
    borderRadius: 14,
  },
  rejectText: { fontSize: 15, fontWeight: "600", color: "#DC2626" },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 14,
  },
  acceptText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
