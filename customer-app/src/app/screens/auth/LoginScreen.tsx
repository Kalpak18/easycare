import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { sendOtp, sendOtpEmail } from '../../../services/auth.service';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

type Method = 'phone' | 'email';

export default function LoginScreen({ navigation }: Props) {
  const [method, setMethod] = useState<Method>('phone');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhone = method === 'phone';

  const validate = () => {
    if (isPhone) return contact.trim().length === 10;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  };

  const handleSend = async () => {
    if (!validate()) {
      Alert.alert(
        'Invalid input',
        isPhone ? 'Enter a valid 10-digit mobile number.' : 'Enter a valid email address.',
      );
      return;
    }
    setLoading(true);
    try {
      const value = contact.trim();
      if (isPhone) {
        await sendOtp(value);
      } else {
        await sendOtpEmail(value);
      }
      navigation.navigate('Otp', { contact: value, method });
    } catch {
      Alert.alert('Error', 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.iconBadge}><Text style={styles.iconText}>🏠</Text></View>
            <Text style={styles.title}>Welcome to EasyCare</Text>
            <Text style={styles.subtitle}>Book trusted home services at your doorstep</Text>
          </View>

          {/* Method toggle */}
          <View style={styles.toggleRow}>
            {(['phone', 'email'] as Method[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleTab, method === m && styles.toggleTabActive]}
                onPress={() => { setMethod(m); setContact(''); }}
              >
                <Text style={[styles.toggleText, method === m && styles.toggleTextActive]}>
                  {m === 'phone' ? '📱 Mobile' : '✉️ Email'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input */}
          <View style={styles.form}>
            <Text style={styles.label}>{isPhone ? 'Mobile Number' : 'Email Address'}</Text>
            {isPhone ? (
              <View style={styles.inputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your number"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={contact}
                  onChangeText={setContact}
                />
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.inputStandalone]}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={contact}
                onChangeText={setContact}
              />
            )}
            <Text style={styles.hint}>
              {isPhone
                ? "We'll send a 6-digit OTP to your number"
                : "We'll send a 6-digit OTP to your email"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Get OTP →</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: TYPOGRAPHY.h2, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { fontSize: TYPOGRAPHY.body, color: COLORS.subtext, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.divider, borderRadius: 12, padding: 4, marginBottom: SPACING.lg },
  toggleTab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: 10, alignItems: 'center' },
  toggleTabActive: { backgroundColor: COLORS.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  toggleText: { fontSize: TYPOGRAPHY.small, fontWeight: '600', color: COLORS.subtext },
  toggleTextActive: { color: COLORS.primary },
  form: { marginBottom: SPACING.lg },
  label: { fontSize: TYPOGRAPHY.small, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  inputRow: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, backgroundColor: COLORS.card, overflow: 'hidden', marginBottom: SPACING.sm,
  },
  countryCode: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderRightWidth: 1, borderRightColor: COLORS.border,
    justifyContent: 'center', backgroundColor: COLORS.divider,
  },
  countryCodeText: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: COLORS.text },
  input: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: TYPOGRAPHY.body, color: COLORS.text },
  inputStandalone: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.card, marginBottom: SPACING.sm,
  },
  hint: { fontSize: TYPOGRAPHY.xs, color: COLORS.placeholder },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 12, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700', letterSpacing: 0.3 },
});
