import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { sendOtp, sendOtpEmail } from '../../../services/auth.service';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
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
      if (isPhone) await sendOtp(value);
      else await sendOtpEmail(value);
      navigation.navigate('Otp', { contact: value, method });
    } catch {
      Alert.alert('Error', 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>🔧</Text>
          </View>
          <Text style={styles.title}>Provider Login</Text>
          <Text style={styles.subtitle}>Sign in to manage your jobs</Text>
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
        <Text style={styles.label}>{isPhone ? 'Mobile Number' : 'Email Address'}</Text>
        {isPhone ? (
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.inputFlex}
              placeholder="Enter your number"
              keyboardType="phone-pad"
              maxLength={10}
              value={contact}
              onChangeText={setContact}
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contact}
            onChangeText={setContact}
          />
        )}
        <Text style={styles.hint}>
          {isPhone ? "We'll send a 6-digit OTP to your number" : "We'll send a 6-digit OTP to your email"}
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12,
    padding: 4, marginBottom: 24,
  },
  toggleTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleTabActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  toggleTextActive: { color: '#2563EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', marginBottom: 8,
  },
  countryCode: {
    paddingHorizontal: 14, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: '#E5E7EB',
    justifyContent: 'center', backgroundColor: '#F3F4F6',
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  inputFlex: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: '#111827' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 24 },
  button: {
    backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
