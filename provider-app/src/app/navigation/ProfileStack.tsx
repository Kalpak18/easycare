import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/profile/ProfileScreen';
import KycEntryScreen from '../screens/profile/KycEntryScreen';
import AccountStatusScreen from '../screens/profile/AccountStatusScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="KYC"
        component={KycEntryScreen}
        options={{ title: 'KYC' }}
      />
      <Stack.Screen
        name="AccountStatus"
        component={AccountStatusScreen}
        options={{ title: 'Account Status' }}
      />
    </Stack.Navigator>
  );
}
