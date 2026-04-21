import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { publicApi } from '../../../services/api.public';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export default function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return;

    try {
      setLoading(true);
      await publicApi.post('/auth/provider/send-otp', { phone });

      navigation.navigate('Otp', { phone });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 24 }}>
        Welcome
      </Text>

      <TextInput
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={sendOtp}
        style={{
          backgroundColor: '#000',
          padding: 16,
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
