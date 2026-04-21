import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../../../services/user.service';
import { useAuthStore } from '../../../store/auth.store';
import { UserProfile } from '../../../types';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? '—'}</Text>
          <Text style={styles.phone}>{profile?.phone ?? '—'}</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.subtext} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profile?.name ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.subtext} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValue}>{profile?.phone ?? '—'}</Text>
            </View>
          </View>
          {profile?.email ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.subtext} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile.email}</Text>
                </View>
              </View>
            </>
          ) : null}
          {profile?.createdAt ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.subtext} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Member since</Text>
                  <Text style={styles.infoValue}>
                    {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* App info */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.subtext} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: '800',
    color: COLORS.primary,
  },
  name: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  phone: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.subtext,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.subtext,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.dangerFade,
    backgroundColor: COLORS.dangerFade,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
