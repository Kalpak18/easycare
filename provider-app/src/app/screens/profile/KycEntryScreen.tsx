import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/auth.store';

export default function KycEntryScreen() {
  const navigation = useNavigation<any>();
  const { kycStatus } = useAuthStore();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>
        KYC & Verification
      </Text>

      <Text style={{ marginTop: 8 }}>
        Status: {kycStatus}
      </Text>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => navigation.navigate('KycFlow')}
      >
        <Text style={{ color: '#007bff', fontWeight: '600' }}>
          View / Upload Documents
        </Text>
      </TouchableOpacity>
    </View>
  );
}
