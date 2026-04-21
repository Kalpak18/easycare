import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/auth.store';
import { connectSocket, disconnectSocket } from '../../socket/socket';
import SplashLoader from '../../components/SplashLoader';
import AuthNavigator from './AuthNavigator';
import CustomerTabs from './CustomerTabs';
// Register auth interceptors (token attach + refresh) on the shared API instance
import '../../services/api.auth';

export default function RootNavigator() {
  const { accessToken, isAuthLoaded, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [accessToken]);

  if (!isAuthLoaded) {
    return <SplashLoader />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {accessToken ? <CustomerTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
