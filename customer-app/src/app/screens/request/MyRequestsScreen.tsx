import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRequestStore } from '../../../store/request.store';
import { ServiceRequest } from '../../../types';
import { RequestStackParamList } from '../../navigation/types';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<RequestStackParamList, 'MyRequestsList'>;
};

type Tab = 'active' | 'past';

function getStatusColor(status: ServiceRequest['status']): string {
  const map: Record<string, string> = {
    OPEN: COLORS.statusOpen,
    ASSIGNED: COLORS.statusAssigned,
    IN_PROGRESS: COLORS.statusInProgress,
    AWAITING_CONFIRMATION: COLORS.statusAwaiting,
    COMPLETED: COLORS.statusCompleted,
    CANCELLED: COLORS.statusCancelled,
    EXPIRED: COLORS.statusExpired,
    DISPUTED: COLORS.danger,
  };
  return map[status] ?? COLORS.subtext;
}

function getStatusLabel(status: ServiceRequest['status']): string {
  const map: Record<string, string> = {
    OPEN: 'Finding provider',
    ASSIGNED: 'Provider assigned',
    IN_PROGRESS: 'In progress',
    AWAITING_CONFIRMATION: 'Confirm completion',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
    DISPUTED: 'Disputed',
  };
  return map[status] ?? status;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyRequestsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [refreshing, setRefreshing] = useState(false);

  const { activeRequests, pastRequests, loading, fetchRequests } = useRequestStore();

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      const poll = setInterval(() => fetchRequests(), 30_000);
      return () => clearInterval(poll);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const filtered = tab === 'active' ? activeRequests : pastRequests;

  const renderItem = ({ item }: { item: ServiceRequest }) => {
    const needsAction = item.status === 'AWAITING_CONFIRMATION';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardCategory}>{item.category.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.subtext} />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.provider && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={13} color={COLORS.subtext} />
              <Text style={styles.metaText}>{item.provider.name}</Text>
            </View>
          )}
        </View>

        {needsAction && (
          <View style={styles.actionBanner}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
            <Text style={styles.actionText}>Tap to confirm & pay</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['active', 'past'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Active' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{tab === 'active' ? '📋' : '🗂️'}</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'No active requests' : 'No past requests'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tab === 'active'
                ? 'Book a service from the Home tab'
                : 'Your completed requests will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  tab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: COLORS.primaryFade,
  },
  tabText: {
    fontSize: TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  list: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: SPACING.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  cardLeft: { flex: 1 },
  cardCategory: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.small,
    color: COLORS.subtext,
    lineHeight: 18,
  },
  statusChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.subtext,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryFade,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: {
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.small,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
});
