import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../../../store/auth.store';

const POLL_INTERVAL_MS = 30_000;

export default function WaitingForAdminApprovalScreen() {
  const navigation = useNavigation<any>();
  const kycStatus = useAuthStore((s) => s.kycStatus);
  const refreshKycStatus = useAuthStore((s) => s.refreshKycStatus);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Pulse animation for the waiting icon
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.6 + 0.4 * pulse.value,
  }));

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  // Navigate to MainTabs when approved
  useEffect(() => {
    if (kycStatus === 'APPROVED') {
      intervalRef.current && clearInterval(intervalRef.current);
      navigation.getParent()?.navigate('MainTabs');
    }
  }, [kycStatus]);

  // If rejected, stop polling — provider needs to fix docs
  useEffect(() => {
    if (kycStatus === 'REJECTED') {
      intervalRef.current && clearInterval(intervalRef.current);
    }
  }, [kycStatus]);

  const doRefresh = async () => {
    setChecking(true);
    await refreshKycStatus();
    setLastChecked(new Date());
    setChecking(false);
  };

  // Poll every 30 seconds
  useEffect(() => {
    doRefresh();
    intervalRef.current = setInterval(doRefresh, POLL_INTERVAL_MS);
    return () => { intervalRef.current && clearInterval(intervalRef.current); };
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ── REJECTED STATE ──────────────────────────────────────────────────────────
  if (kycStatus === 'REJECTED') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Animated.View entering={FadeInDown.duration(500)} style={[styles.iconOuter]}>
            <View style={[styles.iconInner, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle-outline" size={44} color="#DC2626" />
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={[styles.title, { color: '#DC2626' }]}>
            Documents Rejected
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.subtitle}>
            One or more of your documents were rejected by our team.{'\n'}
            Please re-upload the rejected documents and resubmit.
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.stepsCard}>
            <Step icon="checkmark-circle" color="#16A34A" text="Documents submitted" done />
            <View style={styles.stepLine} />
            <Step icon="close-circle" color="#DC2626" text="Documents rejected by admin" active />
            <View style={styles.stepLine} />
            <Step icon="refresh-outline" color="#D1D5DB" text="Re-upload & resubmit required" done={false} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.btnWrap}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: '#DC2626', backgroundColor: '#FEF2F2' }]}
              onPress={() => navigation.navigate('KycStatus')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#DC2626" />
              <Text style={[styles.btnText, { color: '#DC2626' }]}>Fix & Re-upload Documents</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── WAITING STATE ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Animated icon */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.iconOuter}>
          <Animated.View style={[styles.iconPulse, pulseStyle]} />
          <View style={styles.iconInner}>
            <Ionicons name="shield-half-outline" size={44} color="#6366F1" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={styles.title}>
          Verification in Progress
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.subtitle}>
          Your documents are under review by our team.{'\n'}
          This usually takes <Text style={styles.highlight}>24–48 hours</Text>.
        </Animated.Text>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.stepsCard}>
          <Step icon="checkmark-circle" color="#16A34A" text="Documents submitted" done />
          <View style={styles.stepLine} />
          <Step icon="time-outline" color="#6366F1" text="Admin review in progress" active />
          <View style={styles.stepLine} />
          <Step icon="rocket-outline" color="#D1D5DB" text="Account activated" done={false} />
        </Animated.View>

        {/* Last checked */}
        {lastChecked && (
          <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.lastChecked}>
            Last checked at {formatTime(lastChecked)} · auto-refreshes every 30s
          </Animated.Text>
        )}

        {/* Manual check button */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.btnWrap}>
          <TouchableOpacity
            style={[styles.btn, checking && styles.btnDisabled]}
            onPress={doRefresh}
            disabled={checking}
            activeOpacity={0.8}
          >
            <Ionicons
              name={checking ? 'sync' : 'refresh-outline'}
              size={16}
              color="#6366F1"
            />
            <Text style={styles.btnText}>
              {checking ? 'Checking…' : 'Check Now'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info note */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
          <Text style={styles.infoText}>
            You'll be automatically redirected to your dashboard once approved.
          </Text>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

function Step({
  icon,
  color,
  text,
  done,
  active,
}: {
  icon: string;
  color: string;
  text: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <View style={stepStyles.row}>
      <View style={[stepStyles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[stepStyles.text, active && stepStyles.activeText, !done && !active && stepStyles.dimText]}>
        {text}
      </Text>
      {done && <Ionicons name="checkmark" size={14} color="#16A34A" />}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151' },
  activeText: { color: '#6366F1', fontWeight: '700' },
  dimText: { color: '#9CA3AF' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },

  // Icon
  iconOuter: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPulse: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#6366F1',
    opacity: 0.12,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  highlight: { color: '#6366F1', fontWeight: '700' },

  stepsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stepLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 48,
  },

  lastChecked: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  btnWrap: { width: '100%' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
});
