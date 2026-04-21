import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useProviderStore } from '../../../store/provider.store';
import { COLORS } from '../../../theme/colors';

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  ASSIGNED:              { label: 'Assigned',    bg: '#DBEAFE', color: '#1D4ED8', icon: 'time-outline' },
  IN_PROGRESS:           { label: 'In Progress', bg: '#EDE9FE', color: '#7C3AED', icon: 'play-circle-outline' },
  AWAITING_CONFIRMATION: { label: 'Awaiting',    bg: '#FEF3C7', color: '#D97706', icon: 'hourglass-outline' },
  COMPLETED:             { label: 'Completed',   bg: '#DCFCE7', color: '#16A34A', icon: 'checkmark-circle-outline' },
  CANCELLED:             { label: 'Cancelled',   bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

export default function JobsScreen() {
  const navigation = useNavigation<any>();
  const { dashboard, loading, fetchDashboard } = useProviderStore();

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      const poll = setInterval(() => fetchDashboard(), 20_000);
      return () => clearInterval(poll);
    }, [])
  );

  const jobs = dashboard?.activeJobs ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <Text style={styles.headerSub}>
          {jobs.length} active {jobs.length === 1 ? 'job' : 'jobs'}
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchDashboard}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        renderItem={({ item, index }: any) => {
          const meta = STATUS_META[item.status] ?? STATUS_META.ASSIGNED;
          return (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('JobDetails', { requestId: item.id })}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="hammer-outline" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardCategory}>{item.category?.name ?? 'Service'}</Text>
                    <Text style={styles.cardCustomer}>
                      {item.user?.name ?? 'Customer'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  <View style={styles.cardMeta}>
                    <Ionicons name="cash-outline" size={14} color={COLORS.subtext} />
                    <Text style={styles.cardMetaText}>₹{item.totalAmount}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Ionicons name="card-outline" size={14} color={COLORS.subtext} />
                    <Text style={styles.cardMetaText}>{item.paymentMode}</Text>
                  </View>
                  <View style={styles.chevronWrap}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.subtext} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No active jobs</Text>
            <Text style={styles.emptySub}>
              Go online on the Home tab to start receiving job requests
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },

  list: { padding: 16, paddingBottom: 24, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardCategory: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardCustomer: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 14 },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 13, color: COLORS.subtext },
  chevronWrap: { marginLeft: 'auto' },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.subtext, textAlign: 'center', lineHeight: 22 },
});
