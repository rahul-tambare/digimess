import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserStore } from '@/stores/dataStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useUserStore(state => state.hydrate);
  const hasHydrated = useUserStore(state => state.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hasHydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/phone" />
        <Stack.Screen name="onboarding/otp" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="onboarding/location" />
        <Stack.Screen name="mess/[id]" />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="rating" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="wallet-topup" options={{ presentation: 'modal' }} />
        <Stack.Screen name="subscriptions" />
        <Stack.Screen name="subscription-plans" />
        <Stack.Screen name="order-success" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="manage-addresses" />
        <Stack.Screen name="favourites" />
        <Stack.Screen name="payment-methods" />
        <Stack.Screen name="notifications-settings" />
        <Stack.Screen name="dietary-preferences" />
        <Stack.Screen name="app-settings" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
