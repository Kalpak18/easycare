import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/types';
import { getCurrentLocation } from '../../../services/location.service';
import { getNearbyProviders, NearbyProvider } from '../../../services/providers.service';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'NearbyProviders'>;
  route: RouteProp<HomeStackParamList, 'NearbyProviders'>;
};

type SourceFilter = 'ALL' | 'COMPANY' | 'MARKETPLACE';

const TIER_COLOR: Record<string, string> = {
  GOLD: '#F59E0B',
  SILVER: '#9CA3AF',
  BRONZE: '#B45309',
};

const TIER_EMOJI: Record<string, string> = {
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
};

function openInMaps(lat: number, lng: number, label: string) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
  });
  if (url) {
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
    );
  }
}

export default function NearbyProvidersScreen({ navigation, route }: Props) {
  const { categoryId, categoryName } = route.params;
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [filter, setFilter] = useState<SourceFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const loc = await getCurrentLocation();
      const data = await getNearbyProviders(categoryId, loc.latitude, loc.longitude, 10);
      setProviders(data);
    } catch {
      Alert.alert('Error', 'Could not load nearby providers. Check your location settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(true); };

  const filtered = providers.filter((p) =>
    filter === 'ALL' ? true : p.source === filter
  );

  const handleBook = () => {
    navigation.navigate('CreateRequest', {
      categoryId,
      categoryName,
      preferredSource: filter === 'ALL' ? undefined : filter,
    });
  };

  const renderItem = ({ item, index }: { item: NearbyProvider; index: number }) => (
    <View style={styles.card}>
      {/* Rank badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>

      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.sourceTag, item.source === 'COMPANY' ? styles.sourceCompany : styles.sourceMarket]}>
              <Text style={styles.sourceTagText}>
                {item.source === 'COMPANY' ? '🏢 Company' : '👤 Independent'}
              </Text>
            </View>
            <Text style={[styles.tierText, { color: TIER_COLOR[item.tier] ?? COLORS.subtext }]}>
              {TIER_EMOJI[item.tier]} {item.tier}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="location-outline" size={14} color={COLORS.primary} />
          <Text style={styles.statText}>{item.distanceKm.toFixed(1)} km away</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
          <Text style={styles.statText}>{item.completedJobs} jobs</Text>
        </View>
      </View>

      {/* Open in Maps */}
      <TouchableOpacity
        style={styles.mapsBtn}
        onPress={() => openInMaps(item.latitude, item.longitude, item.name)}
        activeOpacity={0.75}
      >
        <Ionicons name="map-outline" size={15} color={COLORS.primary} />
        <Text style={styles.mapsBtnText}>View on Map</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Providers</Text>
          <Text style={styles.headerSub}>{categoryName}</Text>
        </View>
        <TouchableOpacity onPress={() => loadData()} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'COMPANY', 'MARKETPLACE'] as SourceFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f === 'COMPANY' ? '🏢 Company' : '👤 Independent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding providers near you…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.countText}>
              {filtered.length} provider{filtered.length !== 1 ? 's' : ''} online nearby
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>No providers online nearby</Text>
              <Text style={styles.emptySub}>
                You can still place a request — we'll notify providers in your area.
              </Text>
            </View>
          }
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {filter !== 'ALL' && (
          <Text style={styles.prefNote}>
            You'll be matched with a{' '}
            <Text style={{ fontWeight: '700' }}>
              {filter === 'COMPANY' ? 'Company Worker' : 'Independent Professional'}
            </Text>
          </Text>
        )}
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.85}>
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={styles.bookBtnText}>Book {categoryName} Service</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext, marginTop: 1 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFade },
  filterText: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext, fontWeight: '600' },
  filterTextActive: { color: COLORS.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext },

  list: { padding: SPACING.md, paddingBottom: 120, gap: SPACING.sm },

  countText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.subtext,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primaryFade,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankText: { fontSize: TYPOGRAPHY.xs, fontWeight: '700', color: COLORS.primary },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  cardInfo: { flex: 1, gap: 4 },
  providerName: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceCompany: { backgroundColor: '#DBEAFE' },
  sourceMarket: { backgroundColor: COLORS.primaryFade },
  sourceTagText: { fontSize: TYPOGRAPHY.xs, fontWeight: '700', color: COLORS.text },
  tierText: { fontSize: TYPOGRAPHY.xs, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statText: { fontSize: TYPOGRAPHY.xs, color: COLORS.text, fontWeight: '600' },
  statDivider: { width: 1, height: 16, backgroundColor: COLORS.border },

  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryFade,
  },
  mapsBtnText: { fontSize: TYPOGRAPHY.xs, fontWeight: '700', color: COLORS.primary },

  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 28, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext, textAlign: 'center', lineHeight: 20 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  prefNote: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext, textAlign: 'center' },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnText: { color: '#fff', fontSize: TYPOGRAPHY.body, fontWeight: '700' },
});
