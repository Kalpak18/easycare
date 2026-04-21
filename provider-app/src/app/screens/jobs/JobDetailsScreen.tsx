import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRequestDetails, startJob, completeJob } from '../../../services/request.service';
import { getSocket } from '../../../socket/socket';
import { COLORS } from '../../../theme/colors';

// JobDetails is mounted in ProviderNavigator (root stack) so route.params always has requestId
type Props = { route: { params: { requestId: string } }; navigation: any };

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Assigned to you',
  IN_PROGRESS: 'In progress',
  AWAITING_CONFIRMATION: 'Awaiting customer confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: '#3B82F6',
  IN_PROGRESS: '#8B5CF6',
  AWAITING_CONFIRMATION: '#F97316',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
};

export default function JobDetailsScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState('');

  const loadJob = useCallback(async () => {
    try {
      const res = await getRequestDetails(requestId);
      setJob(res.data);
    } catch {
      Alert.alert('Error', 'Could not load job details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadJob();

    // Refresh when customer confirms
    const socket = getSocket();
    if (socket) {
      socket.on('request_taken', loadJob);
      return () => { socket.off('request_taken', loadJob); };
    }
  }, [loadJob]);

  const handleStartJob = async () => {
    setActionLoading(true);
    try {
      await startJob(requestId);
      await loadJob();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not start job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    const amount = finalAmount.trim() ? parseFloat(finalAmount.trim()) : undefined;
    if (finalAmount.trim() && (isNaN(amount!) || amount! <= 0)) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    setActionLoading(true);
    try {
      await completeJob(requestId, amount);
      setShowCompleteModal(false);
      await loadJob();
      Alert.alert('Done!', 'Job marked complete. Waiting for customer confirmation.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not complete job.');
    } finally {
      setActionLoading(false);
    }
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

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <Text style={{ color: COLORS.subtext }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLOR[job.status] ?? COLORS.subtext;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABEL[job.status] ?? job.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Category + Description */}
        <View style={styles.card}>
          <Text style={styles.category}>{job.category?.name}</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Customer</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.subtext} />
            <Text style={styles.infoText}>{job.user?.name ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.subtext} />
            <Text style={styles.infoText}>{job.user?.phone ?? '—'}</Text>
          </View>
        </View>

        {/* Customer Location / Navigate */}
        {job.latitude != null && job.longitude != null && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Customer Location</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.subtext} />
              <Text style={styles.infoText}>
                {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.navigateBtn}
              activeOpacity={0.85}
              onPress={() => {
                const lat = job.latitude;
                const lng = job.longitude;
                const label = encodeURIComponent(job.user?.name ?? 'Customer');
                const url = Platform.select({
                  ios: `maps:0,0?q=${label}@${lat},${lng}`,
                  android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
                });
                if (url) Linking.openURL(url).catch(() =>
                  Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
                );
              }}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.navigateBtnText}>Navigate to Customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.subtext} />
            <Text style={styles.infoText}>Mode: {job.paymentMode}</Text>
          </View>
          {job.totalAmount > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.subtext} />
              <Text style={styles.infoText}>Amount: ₹{job.totalAmount}</Text>
            </View>
          )}
          {job.providerAmount > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
              <Text style={[styles.infoText, { color: COLORS.success }]}>
                Your earnings: ₹{job.providerAmount}
              </Text>
            </View>
          )}
        </View>

        {/* Awaiting confirmation info */}
        {job.status === 'AWAITING_CONFIRMATION' && (
          <View style={[styles.card, styles.awaitingCard]}>
            <Ionicons name="time-outline" size={20} color="#F97316" />
            <Text style={styles.awaitingText}>
              Waiting for the customer to confirm completion and pay.
            </Text>
          </View>
        )}

        {/* Completed */}
        {job.status === 'COMPLETED' && (
          <View style={[styles.card, styles.completedCard]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.completedText}>
              Job completed and payment settled!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      {job.status === 'ASSIGNED' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={handleStartJob}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Start Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {job.status === 'IN_PROGRESS' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              setFinalAmount(job.totalAmount > 0 ? String(job.totalAmount) : '');
              setShowCompleteModal(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Mark as Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Complete modal — enter final amount */}
      <Modal visible={showCompleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm Job Completion</Text>
            <Text style={styles.modalSubtitle}>
              Enter the final amount charged to the customer.
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor={COLORS.subtext}
                keyboardType="decimal-pad"
                value={finalAmount}
                onChangeText={setFinalAmount}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, actionLoading && { opacity: 0.7 }]}
                onPress={handleCompleteJob}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  category: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  description: { fontSize: 14, color: COLORS.subtext, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.subtext, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: COLORS.text },
  awaitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  awaitingText: { flex: 1, fontSize: 13, color: '#9A3412', lineHeight: 18 },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  completedText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalSubtitle: { fontSize: 13, color: COLORS.subtext },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F0F6FF',
  },
  rupeeSign: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: COLORS.text, paddingVertical: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#6366F1',
    paddingVertical: 11,
    borderRadius: 10,
  },
  navigateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
