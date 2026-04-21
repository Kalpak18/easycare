import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { completeProfile, completeProfileEmail } from '../../../services/auth.service';
import { useAuthStore } from '../../../store/auth.store';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'CompleteProfile'>;
  route: RouteProp<AuthStackParamList, 'CompleteProfile'>;
};

export default function CompleteProfileScreen({ route }: Props) {
  const { contact, method } = route.params;
  const [name, setName] = useState('');
  // If logged in via email → collect phone. If via phone → collect email (optional).
  const [extraContact, setExtraContact] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuthStore();

  const isEmailLogin = method === 'email';
  const extraLabel = isEmailLogin ? 'Mobile Number *' : 'Email Address (optional)';
  const extraPlaceholder = isEmailLogin ? '10-digit mobile number' : 'you@example.com';

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Invalid name', 'Please enter your full name.');
      return;
    }
    if (isEmailLogin && extraContact.trim().length !== 10) {
      Alert.alert('Phone required', 'Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEmailLogin) {
        // contact = email, extraContact = phone
        res = await completeProfileEmail(contact, name.trim(), extraContact.trim());
      } else {
        // contact = phone, extraContact = email (optional)
        res = await completeProfile(contact, name.trim(), extraContact.trim() || undefined);
      }
      await setSession({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not create account. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconBadge}><Text style={styles.iconText}>👋</Text></View>
            <Text style={styles.title}>Almost there!</Text>
            <Text style={styles.subtitle}>
              {isEmailLogin
                ? 'Enter your name and phone number to get started'
                : 'Enter your name to get started'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={styles.label}>{extraLabel}</Text>
            {isEmailLogin ? (
              <View style={styles.inputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.inputFlex}
                  placeholder={extraPlaceholder}
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={extraContact}
                  onChangeText={setExtraContact}
                />
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder={extraPlaceholder}
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={extraContact}
                onChangeText={setExtraContact}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Get Started →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', paddingVertical: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  iconBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.primaryFade, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: TYPOGRAPHY.h2, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: TYPOGRAPHY.body, color: COLORS.subtext, textAlign: 'center' },
  form: { marginBottom: SPACING.lg },
  label: { fontSize: TYPOGRAPHY.small, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.card, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md, fontSize: TYPOGRAPHY.body, color: COLORS.text, marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, backgroundColor: COLORS.card, overflow: 'hidden', marginBottom: SPACING.md,
  },
  countryCode: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderRightWidth: 1, borderRightColor: COLORS.border,
    justifyContent: 'center', backgroundColor: COLORS.divider,
  },
  countryCodeText: { fontSize: TYPOGRAPHY.body, fontWeight: '600', color: COLORS.text },
  inputFlex: { flex: 1, paddingHorizontal: SPACING.md, fontSize: TYPOGRAPHY.body, color: COLORS.text },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 12, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: TYPOGRAPHY.body, fontWeight: '700' },
});
