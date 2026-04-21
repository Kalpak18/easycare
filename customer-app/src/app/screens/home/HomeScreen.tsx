import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategories } from '../../../services/category.service';
import { getProfile } from '../../../services/user.service';
import { useRequestStore } from '../../../store/request.store';
import { ServiceCategory } from '../../../types';
import { HomeStackParamList, CustomerTabParamList } from '../../navigation/types';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: CompositeNavigationProp<
    NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
    BottomTabNavigationProp<CustomerTabParamList>
  >;
};

const CATEGORY_ICONS: Record<string, string> = {
  default: '🔧',
  Plumbing: '🚿',
  Electrical: '⚡',
  Cleaning: '🧹',
  Carpentry: '🪚',
  Painting: '🎨',
  AC: '❄️',
  Pest: '🐛',
  Appliance: '🔌',
};

function getCategoryIcon(name: string): string {
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return CATEGORY_ICONS[key];
  }
  return CATEGORY_ICONS.default;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    OPEN: COLORS.statusOpen,
    ASSIGNED: COLORS.statusAssigned,
    IN_PROGRESS: COLORS.statusInProgress,
    AWAITING_CONFIRMATION: COLORS.statusAwaiting,
    COMPLETED: COLORS.statusCompleted,
    CANCELLED: COLORS.statusCancelled,
    EXPIRED: COLORS.statusExpired,
  };
  return map[status] ?? COLORS.subtext;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Looking for provider',
    ASSIGNED: 'Provider assigned',
    IN_PROGRESS: 'Work in progress',
    AWAITING_CONFIRMATION: 'Awaiting your confirmation',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return map[status] ?? status;
}

export default function HomeScreen({ navigation }: Props) {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { activeRequests, fetchRequests } = useRequestStore();
  const activeRequest = activeRequests[0] ?? null;

  const loadData = useCallback(async () => {
    try {
      const [profileRes, categoriesRes] = await Promise.all([
        getProfile(),
        getCategories(),
      ]);
      setUserName(profileRes.name);
      setCategories(categoriesRes);
      await fetchRequests();
    } catch {
      // fail silently on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const poll = setInterval(() => fetchRequests(), 30_000);
      return () => clearInterval(poll);
    }, [])
  );

  // Re-fetch when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchRequests();
    });
    return () => sub.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCategoryPress = (cat: ServiceCategory) => {
    navigation.navigate('NearbyProviders', {
      categoryId: cat.id,
      categoryName: cat.name,
    });
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
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View>
                <Text style={styles.greeting}>
                  Hello, {userName ? userName.split(' ')[0] : 'there'} 👋
                </Text>
                <Text style={styles.headerSub}>What service do you need today?</Text>
              </View>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarText}>
                  {userName ? userName[0].toUpperCase() : 'U'}
                </Text>
              </View>
            </LinearGradient>

            {/* Active request banner */}
            {activeRequest && (
              <TouchableOpacity
                style={styles.activeBanner}
                onPress={() =>
                  navigation.navigate('MyRequests', {
                    screen: 'RequestDetail',
                    params: { requestId: activeRequest.id },
                  } as any)
                }
                activeOpacity={0.85}
              >
                <View style={styles.activeBannerLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(activeRequest.status) },
                    ]}
                  />
                  <View>
                    <Text style={styles.activeBannerTitle}>
                      {activeRequest.category.name}
                    </Text>
                    <Text style={styles.activeBannerStatus}>
                      {getStatusLabel(activeRequest.status)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            )}

            {/* Section title */}
            <Text style={styles.sectionTitle}>Our Services</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryEmoji}>{getCategoryIcon(item.name)}</Text>
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.categoryDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No services available yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: TYPOGRAPHY.small,
    color: 'rgba(255,255,255,0.8)',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: COLORS.white,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeBannerTitle: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeBannerStatus: {
    fontSize: TYPOGRAPHY.small,
    color: COLORS.subtext,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryCard: {
    flex: 1,
    margin: SPACING.xs,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginLeft: SPACING.md,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.small,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.subtext,
  },
});
