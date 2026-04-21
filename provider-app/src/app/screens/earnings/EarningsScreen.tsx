import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../services/api';
import { COLORS } from '../../../theme/colors';

interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  blocked: boolean;
  transactions: WalletTransaction[];
}

const REASON_LABEL: Record<string, string> = {
  JOB_PAYMENT: 'Job payment',
  COMMISSION: 'Platform commission',
  PENALTY: 'Penalty deduction',
  WITHDRAWAL: 'Withdrawal',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EarningsScreen() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      // Get provider ID from dashboard, then wallet
      const walletRes = await api.get('/wallet/me');
      setWallet(walletRes.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWallet();
  };

  const handleWithdraw = () => {
    if (!wallet || wallet.balance <= 0) {
      Alert.alert('Insufficient balance', 'You have no balance to withdraw.');
      return;
    }
    if (wallet.blocked) {
      Alert.alert('Wallet blocked', 'Your wallet is currently blocked. Contact support.');
      return;
    }

    Alert.alert(
      'Request Withdrawal',
      `Withdraw ₹${wallet.balance.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await api.post('/providers/wallet/withdraw', { amount: wallet.balance });
              Alert.alert('Success', 'Withdrawal request submitted. You will be paid within 24 hours.');
              loadWallet();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message ?? 'Could not process withdrawal.');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ],
    );
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

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.type === 'CREDIT';
    return (
      <View style={styles.txRow}>
        <View
          style={[
            styles.txIcon,
            { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' },
          ]}
        >
          <Ionicons
            name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={20}
            color={isCredit ? COLORS.success : COLORS.danger}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txReason}>
            {REASON_LABEL[item.reason] ?? item.reason}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: isCredit ? COLORS.success : COLORS.danger },
          ]}
        >
          {isCredit ? '+' : '-'}₹{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={wallet?.transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Wallet card */}
            <LinearGradient
              colors={['#0066FF', '#0044CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletBalance}>
                ₹{(wallet?.balance ?? 0).toFixed(2)}
              </Text>
              {wallet?.blocked && (
                <View style={styles.blockedBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                  <Text style={styles.blockedText}>Wallet blocked</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  (wallet?.blocked || !wallet?.balance) && styles.withdrawBtnDisabled,
                ]}
                onPress={handleWithdraw}
                disabled={withdrawing || wallet?.blocked || !wallet?.balance}
                activeOpacity={0.85}
              >
                {withdrawing ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.withdrawBtnText}>Withdraw</Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Transactions header */}
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </>
        }
        renderItem={renderTransaction}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Complete jobs to start earning
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 32 },
  walletCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletBalance: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  blockedText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  withdrawBtnDisabled: { opacity: 0.5 },
  withdrawBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txReason: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 68 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
});
