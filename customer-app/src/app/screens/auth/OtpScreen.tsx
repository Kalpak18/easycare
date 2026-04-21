import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { verifyOtp, verifyOtpEmail, sendOtp, sendOtpEmail } from '../../../services/auth.service';
import { useAuthStore } from '../../../store/auth.store';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
  route: RouteProp<AuthStackParamList, 'Otp'>;
};

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }: Props) {
  const { contact, method } = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);
  const { setSession } = useAuthStore();

  useEffect(() => {
    if (resendTimer === 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: NativeSyntheticEvent<{ key: string }>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const res = method === 'phone'
        ? await verifyOtp(contact, code)
        : await verifyOtpEmail(contact, code);

      const data = res.data;
      if (data.requiresProfile) {
        navigation.navigate('CompleteProfile', { contact, method });
      } else {
        await setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (method === 'phone') await sendOtp(contact);
      else await sendOtpEmail(contact);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(30);
      inputs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    }
  };

  const maskedContact = method === 'phone'
    ? `+91 ${'*'.repeat(6)}${contact.slice(-4)}`
    : contact.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.inner}>
          <Text style={styles.title}>Verify your {method === 'phone' ? 'number' : 'email'}</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to{'\n'}
            <Text style={styles.contactHighlight}>{maskedContact}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => { inputs.current[index] = el; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(val) => handleChange(val.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  back: { marginTop: SPACING.md, marginBottom: SPACING.lg },
  backText: { fontSize: TYPOGRAPHY.body, color: COLORS.primary, fontWeight: '600' },
  inner: { flex: 1, paddingTop: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.h2, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.body, color: COLORS.subtext, lineHeight: 22, marginBottom: SPACING.xl },
  contactHighlight: { color: COLORS.text, fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  otpBox: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    textAlign: 'center', fontSize: TYPOGRAPHY.h3, fontWeight: '700', color: COLORS.text,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryFade },
  resendRow: { alignItems: 'center', marginBottom: SPACING.xl },
  resendTimer: { fontSize: TYPOGRAPHY.small, color: COLORS.placeholder },
  resendLink: { fontSize: TYPOGRAPHY.small, color: COLORS.primary, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 12, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700' },
});
