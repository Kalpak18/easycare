import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import NearbyProvidersScreen from '../screens/map/NearbyProvidersScreen';
import CreateRequestScreen from '../screens/request/CreateRequestScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="NearbyProviders" component={NearbyProvidersScreen} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
    </Stack.Navigator>
  );
}
