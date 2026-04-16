import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/stores/dataStore';

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const hydrate = useUserStore((state) => state.hydrate);

  useEffect(() => {
    // Restore persisted auth on app start
    hydrate();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/phone');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoEmoji}>🍛</Text>
      </View>
      <Text style={styles.brand}>MessWala</Text>
      <Text style={styles.tagline}>Ghar jaisa khana, ghar tak</Text>
      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
        <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
        <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 52,
  },
  brand: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
