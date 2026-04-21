import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRequestById,
  confirmCompletion,
  leaveReview,
} from '../../../services/request.service';
import { ServiceRequest, PaymentMode } from '../../../types';
import { RequestStackParamList } from '../../navigation/types';
import { getSocket } from '../../../socket/socket';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<RequestStackParamList, 'RequestDetail'>;
  route: RouteProp<RequestStackParamList, 'RequestDetail'>;
};

const STEPS: ServiceRequest['status'][] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
  'COMPLETED',
];

const STEP_LABELS: Record<string, string> = {
  OPEN: 'Request placed',
  ASSIGNED: 'Provider assigned',
  IN_PROGRESS: 'Work started',
  AWAITING_CONFIRMATION: 'Work done',
  COMPLETED: 'Confirmed & paid',
};

// Human-friendly status banners shown below the progress bar
const STATUS_BANNER: Record<string, { icon: string; message: string; bg: string; color: string }> = {
  OPEN: {
    icon: 'search-outline',
    message: 'Looking for a provider near you…',
    bg: '#EFF6FF',
    color: '#1D4ED8',
  },
  ASSIGNED: {
    icon: 'navigate-outline',
    message: 'Provider is on the way to you!',
    bg: '#ECFDF5',
    color: '#065F46',
  },
  IN_PROGRESS: {
    icon: 'construct-outline',
    message: 'Work is in progress at your location.',
    bg: '#F5F3FF',
    color: '#5B21B6',
  },
  AWAITING_CONFIRMATION: {
    icon: 'checkmark-done-outline',
    message: 'Provider has marked the job done. Please confirm and pay.',
    bg: '#FFF7ED',
    color: '#9A3412',
  },
  COMPLETED: {
    icon: 'trophy-outline',
    message: 'Job completed successfully!',
    bg: '#ECFDF5',
    color: '#065F46',
  },
};

function getStepIndex(status: ServiceRequest['status']): number {
  const idx = STEPS.indexOf(status as any);
  return idx >= 0 ? idx : 0;
}

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

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch {
      Alert.alert('Error', 'Could not load request details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();

    // Real-time updates via socket — no polling needed
    const socket = getSocket();
    if (socket) {
      const refresh = () => loadRequest();
      socket.on('PROVIDER_ASSIGNED', refresh);
      socket.on('JOB_STARTED', refresh);
      socket.on('JOB_COMPLETED', refresh);
      socket.on('request_updated', refresh);
      return () => {
        socket.off('PROVIDER_ASSIGNED', refresh);
        socket.off('JOB_STARTED', refresh);
        socket.off('JOB_COMPLETED', refresh);
        socket.off('request_updated', refresh);
      };
    }
  }, []);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmCompletion(requestId, paymentMode);
      setRequest(updated);
      setShowConfirmModal(false);
      Alert.alert('Payment Confirmed 🎉', 'Thank you! Would you like to rate the provider?', [
        { text: 'Skip', style: 'cancel' },
        { text: 'Rate Now', onPress: () => setShowReviewModal(true) },
      ]);
    } catch {
      Alert.alert('Error', 'Could not confirm. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReview = async () => {
    setSubmittingReview(true);
    try {
      await leaveReview(requestId, reviewRating, reviewComment);
      await loadRequest();
      setShowReviewModal(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED'].includes(request.status);
  const currentStep = getStepIndex(request.status);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{request.category.name}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}
        >
          <Text style={[styles.statusBadgeText, { color: getStatusColor(request.status) }]}>
            {request.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress timeline */}
        {!isTerminal || request.status === 'COMPLETED' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progress</Text>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const isLast = i === STEPS.length - 1;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        done ? styles.stepDotDone : styles.stepDotPending,
                        i === currentStep && styles.stepDotCurrent,
                      ]}
                    >
                      {done && i < currentStep && (
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[styles.stepLine, done && i < currentStep ? styles.stepLineDone : null]} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      i === currentStep && styles.stepLabelCurrent,
                      i < currentStep && styles.stepLabelDone,
                    ]}
                  >
                    {STEP_LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={[
              styles.terminalBanner,
              { backgroundColor: getStatusColor(request.status) + '15' },
            ]}
          >
            <Ionicons
              name={
                request.status === 'CANCELLED'
                  ? 'close-circle'
                  : request.status === 'EXPIRED'
                  ? 'time'
                  : 'alert-circle'
              }
              size={20}
              color={getStatusColor(request.status)}
            />
            <Text style={[styles.terminalText, { color: getStatusColor(request.status) }]}>
              This request was {request.status.toLowerCase()}
            </Text>
          </View>
        )}

        {/* Live status banner */}
        {STATUS_BANNER[request.status] && (
          <View style={[styles.statusBanner, { backgroundColor: STATUS_BANNER[request.status].bg }]}>
            <Ionicons
              name={STATUS_BANNER[request.status].icon as any}
              size={20}
              color={STATUS_BANNER[request.status].color}
            />
            <Text style={[styles.statusBannerText, { color: STATUS_BANNER[request.status].color }]}>
              {STATUS_BANNER[request.status].message}
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>{request.description}</Text>
        </View>

        {/* Images */}
        {request.images.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attached Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imageRow}>
                {request.images.map((img) => (
                  <Image key={img.id} source={{ uri: img.url }} style={styles.imageThumb} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Provider info */}
        {request.provider && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Provider</Text>
            <View style={styles.providerRow}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerAvatarText}>
                  {request.provider.name[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{request.provider.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.ratingText}>{request.provider.rating.toFixed(1)}</Text>
                  <Text style={styles.tierBadge}>{request.provider.tier}</Text>
                </View>
              </View>
              <Ionicons name="call-outline" size={22} color={COLORS.primary} />
            </View>
          </View>
        )}

        {/* Payment info */}
        {request.payment && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentValue}>₹{request.payment.amount}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Platform Fee</Text>
              <Text style={styles.paymentValue}>₹{request.payment.platformFee}</Text>
            </View>
            <View style={[styles.paymentRow, styles.paymentTotal]}>
              <Text style={styles.paymentTotalLabel}>Mode</Text>
              <Text style={styles.paymentTotalValue}>{request.payment.mode}</Text>
            </View>
          </View>
        )}

        {/* Review */}
        {request.review && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <View style={styles.reviewRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= request.review!.rating ? 'star' : 'star-outline'}
                  size={20}
                  color="#F59E0B"
                />
              ))}
            </View>
            {request.review.comment ? (
              <Text style={styles.reviewComment}>{request.review.comment}</Text>
            ) : null}
          </View>
        )}

        {/* Confirm action */}
        {request.status === 'AWAITING_CONFIRMATION' && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => setShowConfirmModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            <Text style={styles.confirmBtnText}>Confirm & Pay</Text>
          </TouchableOpacity>
        )}

        {/* Leave review */}
        {request.status === 'COMPLETED' && !request.review && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => setShowReviewModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="star" size={18} color={COLORS.primary} />
            <Text style={styles.reviewBtnText}>Leave a Review</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm & Pay</Text>
            <Text style={styles.modalSubtitle}>
              Confirm that the work is completed and make payment.
            </Text>
            <Text style={styles.modalLabel}>Payment Mode</Text>
            <View style={styles.modeRow}>
              {(['CASH', 'UPI'] as PaymentMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, paymentMode === m && styles.modeBtnSelected]}
                  onPress={() => setPaymentMode(m)}
                >
                  <Text style={[styles.modeBtnText, paymentMode === m && styles.modeBtnTextSelected]}>
                    {m === 'CASH' ? '💵 Cash' : '📱 UPI'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, confirming && { opacity: 0.7 }]}
                onPress={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmModalBtnText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                  <Ionicons
                    name={s <= reviewRating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor={COLORS.placeholder}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalBtn, submittingReview && { opacity: 0.7 }]}
                onPress={handleReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmModalBtnText}>Submit Review</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.subtitle,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: TYPOGRAPHY.xs, fontWeight: '700' },
  scroll: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.small,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  statusBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    lineHeight: 20,
  },
  terminalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
  },
  terminalText: { fontSize: TYPOGRAPHY.body, fontWeight: '600', textTransform: 'capitalize' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    minHeight: 36,
  },
  stepLeft: { alignItems: 'center', width: 20 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepDotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepDotPending: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  stepDotCurrent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepLine: { width: 2, flex: 1, backgroundColor: COLORS.border, minHeight: 16 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepLabel: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext, paddingTop: 2, flex: 1 },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: '600' },
  stepLabelDone: { color: COLORS.text },
  descText: { fontSize: TYPOGRAPHY.body, color: COLORS.text, lineHeight: 22 },
  imageRow: { flexDirection: 'row', gap: SPACING.sm },
  imageThumb: { width: 80, height: 80, borderRadius: 10 },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: { fontSize: TYPOGRAPHY.subtitle, fontWeight: '700', color: COLORS.primary },
  providerInfo: { flex: 1 },
  providerName: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: TYPOGRAPHY.small, color: COLORS.text, fontWeight: '600' },
  tierBadge: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.subtext,
    backgroundColor: COLORS.divider,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  paymentLabel: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext },
  paymentValue: { fontSize: TYPOGRAPHY.small, color: COLORS.text, fontWeight: '600' },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  paymentTotalLabel: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  paymentTotalValue: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.primary },
  reviewRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext, lineHeight: 18 },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 14,
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
  confirmBtnText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700' },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFade,
  },
  reviewBtnText: { color: COLORS.primary, fontSize: TYPOGRAPHY.body, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: TYPOGRAPHY.h3, fontWeight: '700', color: COLORS.text },
  modalSubtitle: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext },
  modalLabel: { fontSize: TYPOGRAPHY.small, fontWeight: '600', color: COLORS.text },
  modeRow: { flexDirection: 'row', gap: SPACING.sm },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFade },
  modeBtnText: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: COLORS.subtext },
  modeBtnTextSelected: { color: COLORS.primary },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: COLORS.subtext },
  confirmModalBtn: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmModalBtnText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.small,
    color: COLORS.text,
    minHeight: 80,
  },
});
