import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RequestStackParamList } from './types';
import MyRequestsScreen from '../screens/request/MyRequestsScreen';
import RequestDetailScreen from '../screens/request/RequestDetailScreen';

const Stack = createNativeStackNavigator<RequestStackParamList>();

export default function RequestStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyRequestsList" component={MyRequestsScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
    </Stack.Navigator>
  );
}
