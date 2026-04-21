import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';

import { useAuthStore } from '../../store/auth.store';
import AuthNavigator from './AuthNavigator';
import ProviderNavigator from './ProviderNavigator';
import SplashLoader from '../../components/SplashLoader';
import { connectSocket, disconnectSocket } from '../../socket/socket';
// Register auth interceptors (token attach + refresh) on the shared API instance
import '../../services/api.auth';

export default function RootNavigator() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthLoaded = useAuthStore((s) => s.isAuthLoaded);
  const loadAuth = useAuthStore((s) => s.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  // Connect socket with the live access token when logged in
  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
  }, [accessToken]);

  if (!isAuthLoaded) {
  return <SplashLoader />;
}

  return (
    <NavigationContainer>
      {accessToken ? <ProviderNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}