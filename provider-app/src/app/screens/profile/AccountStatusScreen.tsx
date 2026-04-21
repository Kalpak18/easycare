import { View, Text } from 'react-native';
import { useAuthStore } from '../../../store/auth.store';

export default function AccountStatusScreen() {
  const { isVerified, kycStatus } = useAuthStore();

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>
        Account Status
      </Text>

      <Text style={{ marginTop: 8 }}>
        Verification: {isVerified ? 'Approved' : 'Pending'}
      </Text>

      <Text style={{ marginTop: 4 }}>
        KYC Status: {kycStatus}
      </Text>
    </View>
  );
}
