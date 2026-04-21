import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, NativeSyntheticEvent,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { verifyOtp, verifyOtpEmail, sendOtp, sendOtpEmail } from '../../../services/auth.service';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }: Props) {
  const { contact, method } = route.params;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);
  const setSession = useAuthStore((s) => s.setSession);

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
        navigation.replace('CompleteProfile', { contact, method });
      } else {
        await setSession(data);
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        Sent to <Text style={styles.contact}>{maskedContact}</Text>
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
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingTop: 60 },
  back: { marginBottom: 32 },
  backText: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 40, lineHeight: 22 },
  contact: { color: '#111827', fontWeight: '600' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', backgroundColor: '#fff',
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#111827',
  },
  otpBoxFilled: { borderColor: '#2563EB', backgroundColor: '#DBEAFE' },
  resendRow: { alignItems: 'center', marginBottom: 32 },
  resendTimer: { fontSize: 13, color: '#9CA3AF' },
  resendLink: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  button: {
    backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
