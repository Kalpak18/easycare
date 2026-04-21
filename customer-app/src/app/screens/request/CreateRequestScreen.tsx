import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { HomeStackParamList } from '../../navigation/types';
import { createRequest, uploadRequestImage } from '../../../services/request.service';
import { getCurrentLocation, Coords } from '../../../services/location.service';
import { getServiceFields } from '../../../config/serviceFields';
import { useRequestStore } from '../../../store/request.store';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';
import { PaymentMode } from '../../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'CreateRequest'>;
  route: RouteProp<HomeStackParamList, 'CreateRequest'>;
};

// ─── Scheduling helpers ────────────────────────────────────────────────────

// lazy-require DateTimePicker — not available on web
const DateTimePicker: any =
  Platform.OS !== 'web'
    ? require('@react-native-community/datetimepicker').default
    : null;

function buildDays() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return {
      date: d,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      sub:   d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });
}

function mergeDateAndTime(day: Date, time: Date): Date {
  const d = new Date(day);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── Component ────────────────────────────────────────────────────────────

export default function CreateRequestScreen({ navigation, route }: Props) {
  const { categoryId, categoryName, preferredSource } = route.params;
  const fetchRequests = useRequestStore((s) => s.fetchRequests);

  // Core
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<Coords | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Service-specific metadata
  const serviceConfig = getServiceFields(categoryName);
  const [serviceMetadata, setServiceMetadata] = useState<Record<string, string>>({});

  // Scheduling
  const days = buildDays();
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0].date);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(10, 0, 0, 0); return d;
  });

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      if (coords.address) setManualAddress(coords.address);
    } catch {
      Alert.alert('Location', 'Could not get your location. Please enter it manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit reached', 'You can attach up to 3 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImages((prev) => [...prev, compressed.uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setMeta = (key: string, value: string) => {
    setServiceMetadata((prev) => ({ ...prev, [key]: value }));
  };


  // ── Submission ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description required', 'Please describe what you need done.');
      return;
    }
    if (!location) {
      Alert.alert('Location required', 'Please allow location access or enter your address.');
      return;
    }
    if (isScheduled) {
      const merged = mergeDateAndTime(selectedDay, selectedTime);
      if (merged.getTime() < Date.now() + 60 * 60 * 1000) {
        Alert.alert('Too soon', 'Please schedule at least 1 hour from now.');
        return;
      }
    }
    if (serviceConfig) {
      for (const field of serviceConfig.fields) {
        if (field.required && !serviceMetadata[field.key]) {
          Alert.alert('Required', `Please select ${field.label}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const uri of images) {
        const url = await uploadRequestImage(uri);
        imageUrls.push(url);
      }

      await createRequest({
        categoryId,
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        imageUrls,
        paymentMode,
        preferredSource,
        scheduledAt: isScheduled
          ? mergeDateAndTime(selectedDay, selectedTime).toISOString()
          : undefined,
        serviceMetadata: Object.keys(serviceMetadata).length > 0 ? serviceMetadata : undefined,
      });

      // Refresh store so My Requests shows the new entry immediately
      await fetchRequests();

      const merged = isScheduled ? mergeDateAndTime(selectedDay, selectedTime) : null;
      const timeStr = merged
        ? `${days.find(d => d.date.getTime() === selectedDay.getTime())?.label ?? ''}, ${merged.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${fmtTime(merged)}`
        : '';

      Alert.alert(
        isScheduled ? 'Booking Scheduled! 🗓' : 'Request Submitted! 🚀',
        isScheduled
          ? `Your service is booked for ${timeStr}. We'll confirm a provider soon.`
          : "We're finding the nearest provider for you. You'll be notified once assigned.",
        [{
          text: 'Track Request',
          onPress: () => {
            // Navigate to MyRequests tab (pop the HomeStack back to root first)
            navigation.popToTop();
            (navigation.getParent() as any)?.navigate('MyRequests');
          },
        }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not submit your request. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Service-specific fields ── */}
          {serviceConfig?.fields.map((field) => (
            <View key={field.key} style={styles.section}>
              <Text style={styles.label}>
                {field.label}{field.required ? ' *' : ''}
              </Text>
              {field.type === 'chips' && field.options && (
                <View style={styles.chipsRow}>
                  {field.options.map((opt) => {
                    const selected = serviceMetadata[field.key] === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setMeta(field.key, opt.value)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          {/* ── When do you need it? ── */}
          <View style={styles.section}>
            <Text style={styles.label}>When do you need it?</Text>

            {/* ASAP / Schedule toggle */}
            <View style={styles.scheduleToggleRow}>
              <TouchableOpacity
                style={[styles.scheduleTab, !isScheduled && styles.scheduleTabActive]}
                onPress={() => setIsScheduled(false)}
              >
                <Ionicons name="flash" size={16} color={!isScheduled ? COLORS.white : COLORS.subtext} />
                <Text style={[styles.scheduleTabText, !isScheduled && styles.scheduleTabTextActive]}>ASAP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleTab, isScheduled && styles.scheduleTabActive]}
                onPress={() => setIsScheduled(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={isScheduled ? COLORS.white : COLORS.subtext} />
                <Text style={[styles.scheduleTabText, isScheduled && styles.scheduleTabTextActive]}>Schedule</Text>
              </TouchableOpacity>
            </View>

            {isScheduled && (
              <View style={styles.scheduleBox}>

                {/* Date pills — horizontal scroll, 7 days */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPillRow}>
                  {days.map((d) => {
                    const active = d.date.getTime() === selectedDay.getTime();
                    return (
                      <TouchableOpacity
                        key={d.date.toISOString()}
                        style={[styles.dayPill, active && styles.dayPillActive]}
                        onPress={() => setSelectedDay(d.date)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.dayPillLabel, active && styles.dayPillTextActive]}>{d.label}</Text>
                        <Text style={[styles.dayPillSub, active && styles.dayPillTextActive]}>{d.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Time picker — native spinner, exactly like setting an alarm */}
                <View style={styles.timePickerWrap}>
                  <Text style={styles.timePickerLabel}>Set Time</Text>
                  {DateTimePicker ? (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={(_: any, d?: Date) => { if (d) setSelectedTime(d); }}
                      style={styles.timePicker}
                      textColor={COLORS.text}
                    />
                  ) : (
                    // web fallback — plain text showing selected time
                    <Text style={styles.webTimeFallback}>{fmtTime(selectedTime)}</Text>
                  )}
                </View>

                {/* Confirmation chip */}
                <View style={styles.scheduleSummary}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.scheduleSummaryText}>
                    {days.find(d => d.date.getTime() === selectedDay.getTime())?.label ?? ''}{' · '}{fmtTime(selectedTime)}
                  </Text>
                </View>

              </View>
            )}
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Describe the problem *</Text>
            <TextInput
              style={styles.textArea}
              placeholder={
                serviceConfig?.descriptionTemplate ??
                'Describe the issue in detail — what is broken, where it is, and any other relevant information...'
              }
              placeholderTextColor={COLORS.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ── Photos ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Attach Photos (optional)</Text>
            <View style={styles.imageRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(i)}>
                    <Ionicons name="close" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={24} color={COLORS.subtext} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Location ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Service Location *</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Ionicons
                  name={location ? 'location' : 'location-outline'}
                  size={20}
                  color={location ? COLORS.primary : COLORS.subtext}
                />
                {locationLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
                ) : (
                  <Text style={[styles.locationText, !location && styles.locationPlaceholder]}>
                    {location ? 'Location detected' : 'Detecting location...'}
                  </Text>
                )}
                <TouchableOpacity onPress={fetchLocation} style={styles.refreshLocation}>
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter or confirm your address"
                placeholderTextColor={COLORS.placeholder}
                value={manualAddress}
                onChangeText={setManualAddress}
                multiline
              />
            </View>
          </View>

          {/* ── Provider preference (from map screen) ── */}
          {preferredSource && (
            <View style={styles.section}>
              <Text style={styles.label}>Provider Preference</Text>
              <View style={[
                styles.prefBadge,
                preferredSource === 'COMPANY' ? styles.prefBadgeCompany : styles.prefBadgeMarket,
              ]}>
                <Text style={styles.prefBadgeText}>
                  {preferredSource === 'COMPANY' ? '🏢 Company Worker' : '👤 Independent Professional'}
                </Text>
                <Text style={styles.prefBadgeSub}>
                  {preferredSource === 'COMPANY'
                    ? 'Trained & background-verified staff'
                    : 'Vetted freelance professional'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Payment mode ── */}
          <View style={styles.section}>
            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.paymentRow}>
              {(['CASH', 'UPI'] as PaymentMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.paymentOption, paymentMode === mode && styles.paymentOptionSelected]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text style={styles.paymentIcon}>{mode === 'CASH' ? '💵' : '📱'}</Text>
                  <Text style={[styles.paymentLabel, paymentMode === mode && styles.paymentLabelSelected]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name={isScheduled ? 'calendar' : 'send'} size={18} color={COLORS.white} />
                <Text style={styles.submitText}>
                  {isScheduled ? 'Schedule Booking' : 'Submit Request'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: TYPOGRAPHY.subtitle, fontWeight: '700', color: COLORS.text },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  section: { marginBottom: SPACING.lg },
  label: {
    fontSize: TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFade },
  chipText: { fontSize: TYPOGRAPHY.small, color: COLORS.subtext, fontWeight: '500' },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },

  // Schedule
  scheduleToggleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  scheduleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  scheduleTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  scheduleTabText: { fontSize: TYPOGRAPHY.small, fontWeight: '700', color: COLORS.subtext },
  scheduleTabTextActive: { color: COLORS.white },

  scheduleBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },

  // Day pills — horizontal scroll
  dayPillRow: { flexDirection: 'row', gap: SPACING.xs, paddingVertical: 2 },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 2,
  },
  dayPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  dayPillLabel: { fontSize: TYPOGRAPHY.small, fontWeight: '700', color: COLORS.text },
  dayPillSub: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext },
  dayPillTextActive: { color: COLORS.white },

  // Time picker — alarm-style spinner
  timePickerWrap: { alignItems: 'center', gap: 4 },
  timePickerLabel: { fontSize: TYPOGRAPHY.small, fontWeight: '700', color: COLORS.text, alignSelf: 'flex-start' },
  timePicker: { width: '100%', height: 120 },
  webTimeFallback: { fontSize: TYPOGRAPHY.subtitle, fontWeight: '700', color: COLORS.primary, paddingVertical: SPACING.md },

  // Confirmation chip
  scheduleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scheduleSummaryText: { fontSize: TYPOGRAPHY.small, color: '#166534', fontWeight: '600', flex: 1 },

  // Text area
  textArea: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 100,
  },

  // Images
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  imageContainer: { position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden' },
  imageThumb: { width: '100%', height: '100%' },
  removeImage: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 2,
  },
  addImageBtn: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext },

  // Location
  locationCard: {
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, padding: SPACING.md, gap: SPACING.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  locationText: { flex: 1, fontSize: TYPOGRAPHY.small, color: COLORS.text, fontWeight: '500' },
  locationPlaceholder: { color: COLORS.placeholder },
  refreshLocation: { padding: 4 },
  addressInput: {
    fontSize: TYPOGRAPHY.small, color: COLORS.text,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm,
  },

  // Provider preference badge
  prefBadge: { borderRadius: 12, padding: SPACING.md, borderWidth: 1.5 },
  prefBadgeCompany: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  prefBadgeMarket: { backgroundColor: COLORS.primaryFade, borderColor: COLORS.primaryLight },
  prefBadgeText: { fontSize: TYPOGRAPHY.body, fontWeight: '700', color: COLORS.text },
  prefBadgeSub: { fontSize: TYPOGRAPHY.xs, color: COLORS.subtext, marginTop: 2 },

  // Payment
  paymentRow: { flexDirection: 'row', gap: SPACING.sm },
  paymentOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, paddingVertical: SPACING.md,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  paymentOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFade },
  paymentIcon: { fontSize: 18 },
  paymentLabel: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: COLORS.subtext },
  paymentLabelSelected: { color: COLORS.primary },

  // Footer
  footer: { padding: SPACING.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700' },

});
