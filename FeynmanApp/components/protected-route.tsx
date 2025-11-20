import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/theme';

export function useProtectedRoute() {
  const { user, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inTabsGroup = firstSegment === '(tabs)';

    if (!user) {
      // User is not signed in
      if (!inAuthGroup) {
        // Not on auth screen, redirect to welcome
        router.replace('/(auth)/welcome' as never);
      }
    } else {
      // User is signed in
      if (inAuthGroup || (!inTabsGroup && segments.length <= 1)) {
        // On auth screen or root/non-tabs route, redirect to tabs (which shows default tab)
        router.replace('/(tabs)' as never);
      }
    }
  }, [user, initialized, segments, router]);
}

export function ProtectedRouteProvider({ children }: { children: React.ReactNode }) {
  const { initialized } = useAuth();
  useProtectedRoute();

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

