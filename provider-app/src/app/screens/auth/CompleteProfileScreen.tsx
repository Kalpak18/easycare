import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { AuthStackParamList } from '../../navigation/types';
import { completeProfile, completeProfileEmail } from '../../../services/auth.service';
import { publicApi } from '../../../services/api.public';
import { useAuthStore } from '../../../store/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'CompleteProfile'>;
type Category = { id: string; name: string };

export default function CompleteProfileScreen({ route }: Props) {
  const { contact, method } = route.params;
  const isEmailLogin = method === 'email';

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  // If email login → collect phone. If phone login → collect email (optional).
  const [extraContact, setExtraContact] = useState('');
  const [loading, setLoading] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    publicApi.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
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
        res = await completeProfileEmail({
          email: contact,
          name: name.trim(),
          phone: extraContact.trim(),
          categoryId,
        });
      } else {
        // contact = phone, extraContact = email (optional)
        res = await completeProfile({
          phone: contact,
          name: name.trim(),
          categoryId,
          email: extraContact.trim() || undefined,
        });
      }
      await setSession(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not create account. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Add details to start receiving jobs</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        {/* Missing contact field */}
        <Text style={styles.label}>
          {isEmailLogin ? 'Mobile Number *' : 'Email Address (optional)'}
        </Text>
        {isEmailLogin ? (
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.inputFlex}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={extraContact}
              onChangeText={setExtraContact}
            />
          </View>
        ) : (
          <TextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={extraContact}
            onChangeText={setExtraContact}
            style={styles.input}
          />
        )}

        <Text style={styles.label}>Service Category *</Text>
        <View style={styles.picker}>
          <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
            <Picker.Item label="Select Category" value="" />
            {categories.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.button, (!name || !categoryId) && styles.buttonDisabled]}
          disabled={!name || !categoryId || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Finish Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { color: '#6B7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', marginBottom: 16,
  },
  countryCode: {
    paddingHorizontal: 14, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: '#E5E7EB',
    justifyContent: 'center', backgroundColor: '#F3F4F6',
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  inputFlex: { flex: 1, paddingHorizontal: 14, fontSize: 15, color: '#111827' },
  picker: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff', marginBottom: 24 },
  button: {
    backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
