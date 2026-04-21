import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';
import { registerProvider } from '../../../services/auth.service';
import { fetchCategories } from '../../../services/category.service';
import { useAuthStore } from '../../../store/auth.store';
import { Picker } from '@react-native-picker/picker';

type Category = {
  id: string;
  name: string;
};

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() =>
        Alert.alert('Error', 'Failed to load categories'),
      );
  }, []);

  const onRegister = async () => {
    if (!name || !phone || !categoryId) {
      Alert.alert('Validation', 'All fields are required');
      return;
    }

    try {
      setLoading(true);

      const res = await registerProvider({
        name,
        phone,
        categoryId,
      });

      const { accessToken, refreshToken } = res.data;

      if (!accessToken || !refreshToken) {
        Alert.alert(
          'Error',
          'Invalid auth response from server',
        );
        return;
      }

      await useAuthStore.getState().setSession({
        accessToken,
        refreshToken,
        role: 'PROVIDER',
        isVerified: false,
      });
    } catch (err: any) {
      Alert.alert(
        'Registration failed',
        err?.response?.data?.message ||
          'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid = name && phone && categoryId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Create Provider Account
        </Text>

        <Text style={styles.subtitle}>
          Join the platform and start receiving jobs
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>

        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Phone Number</Text>

        <TextInput
          placeholder="Enter phone number"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          style={styles.input}
        />

        <Text style={styles.label}>
          Select Service Category
        </Text>

        <View style={styles.picker}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(value) =>
              setCategoryId(value)
            }
          >
            <Picker.Item
              label="Select category"
              value=""
            />
            {categories.map((c) => (
              <Picker.Item
                key={c.id}
                label={c.name}
                value={c.id}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            !isValid && { opacity: 0.5 },
          ]}
          disabled={!isValid || loading}
          onPress={onRegister}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Register
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  subtitle: {
    color: '#6B7280',
    marginTop: 6,
  },

  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    elevation: 3,
  },

  label: {
    marginBottom: 6,
    color: '#374151',
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  picker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});