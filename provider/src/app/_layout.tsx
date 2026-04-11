import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { getToken } from '../utils/api';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (token) {
        setIsAuthenticated(true);
        registerForPushNotificationsAsync(); // Register device on startup if logged in
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null; // or a loading spinner
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
