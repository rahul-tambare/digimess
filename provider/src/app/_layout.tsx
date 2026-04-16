// ==========================================
// Root Layout — Auth guard + navigation
// ==========================================

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="order-detail" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="earnings" options={{ headerShown: false }} />
    </Stack>
  );
}
