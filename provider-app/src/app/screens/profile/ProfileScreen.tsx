import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../services/api';
import { COLORS } from '../../../theme/colors';

const KYC_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  APPROVED:    { label: 'Verified',     color: '#16A34A', bg: '#DCFCE7', icon: 'shield-checkmark' },
  PENDING:     { label: 'Under Review', color: '#D97706', bg: '#FEF3C7', icon: 'time' },
  REJECTED:    { label: 'Rejected',     color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle' },
  NOT_STARTED: { label: 'Not Started',  color: '#6B7280', bg: '#F3F4F6', icon: 'alert-circle' },
};

type ProfileData = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  kycStatus: string;
  category: { id: string; name: string };
  wallet: { balance: number; blocked: boolean };
};

function MenuRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#DC2626' : '#6366F1'} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#DC2626' }]}>{label}</Text>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { kycStatus, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/providers/me');
      setProfile(res.data);
    } catch {
      // silently use auth store kycStatus as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  const status = kycStatus ?? profile?.kycStatus ?? 'NOT_STARTED';
  const kycMeta = KYC_META[status] ?? KYC_META.NOT_STARTED;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── HEADER ─────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'P'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? '—'}</Text>
          <Text style={styles.category}>{profile?.category?.name ?? 'Service Provider'}</Text>

          {/* KYC badge */}
          <View style={[styles.kycBadge, { backgroundColor: kycMeta.bg }]}>
            <Ionicons name={kycMeta.icon as any} size={13} color={kycMeta.color} />
            <Text style={[styles.kycBadgeText, { color: kycMeta.color }]}>{kycMeta.label}</Text>
          </View>
        </View>

        {/* ── STATS ROW ──────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) ?? '—'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.completedJobs ?? 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{profile?.wallet?.balance ?? 0}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
        </View>

        {/* ── ACCOUNT ────────────────────── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <MenuRow icon="person-outline"  label="Name"     value={profile?.name ?? '—'} />
          <View style={styles.cardDivider} />
          <MenuRow icon="call-outline"    label="Phone"    value={profile?.phone ?? '—'} />
          {profile?.email && (
            <>
              <View style={styles.cardDivider} />
              <MenuRow icon="mail-outline" label="Email" value={profile.email} />
            </>
          )}
          <View style={styles.cardDivider} />
          <MenuRow icon="construct-outline" label="Category" value={profile?.category?.name ?? '—'} />
        </View>

        {/* ── KYC ────────────────────────── */}
        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.card}>
          <MenuRow
            icon="shield-outline"
            label="KYC Documents"
            onPress={() => navigation.navigate('KycFlow')}
          />
          {status !== 'APPROVED' && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.kycInfoRow}>
                <Ionicons name={kycMeta.icon as any} size={14} color={kycMeta.color} />
                <Text style={[styles.kycInfoText, { color: kycMeta.color }]}>
                  {status === 'NOT_STARTED' && 'Upload documents to start receiving jobs'}
                  {status === 'PENDING' && 'Your documents are being reviewed (24–48 hrs)'}
                  {status === 'REJECTED' && 'Some documents were rejected. Please re-upload.'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── SUPPORT ────────────────────── */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <MenuRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <View style={styles.cardDivider} />
          <MenuRow icon="document-text-outline" label="Terms & Conditions" onPress={() => {}} />
        </View>

        {/* ── DANGER ZONE ────────────────── */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <MenuRow icon="log-out-outline" label="Log out" onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>EasyCare Provider v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },
  scroll: { paddingBottom: 40 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  category: { fontSize: 14, color: COLORS.subtext, marginBottom: 12 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  kycBadgeText: { fontSize: 12, fontWeight: '700' },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },

  /* Sections */
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  menuValue: { fontSize: 13, color: COLORS.subtext, maxWidth: 160, textAlign: 'right' },

  kycInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  kycInfoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 28,
  },
});
