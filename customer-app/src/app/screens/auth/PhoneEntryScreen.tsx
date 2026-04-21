import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { sendOtp } from '../../../services/auth.service';
import COLORS from '../../../theme/colors';
import SPACING from '../../../theme/spacing';
import TYPOGRAPHY from '../../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneEntry'>;
};

export default function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(trimmed);
      navigation.navigate('Otp', { phone: trimmed });
    } catch {
      Alert.alert('Error', 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>🏠</Text>
            </View>
            <Text style={styles.title}>Welcome to EasyCare</Text>
            <Text style={styles.subtitle}>
              Book trusted home services at your doorstep
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number</Text>
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
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <Text style={styles.hint}>We'll send a 6-digit OTP to verify your number</Text>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryFade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  countryCode: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
    backgroundColor: COLORS.divider,
  },
  countryCodeText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    color: COLORS.text,
  },
  hint: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.placeholder,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
