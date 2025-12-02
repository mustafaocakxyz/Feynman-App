import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { XpFeedbackProvider } from '@/components/xp-feedback-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRouteProvider } from '@/components/protected-route';
import { SyncProvider } from '@/components/SyncProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function RootLayoutNav() {
  return (
    <ProtectedRouteProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ayt-matematik/index" options={{ headerShown: false }} />
        <Stack.Screen name="ayt-matematik/[subtopic]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </ProtectedRouteProvider>
  );
}

export default function RootLayout() {
  console.log('[RootLayout] Starting app initialization...');
  
  // Hooks must be called unconditionally at the top level
  const colorScheme = useColorScheme();
  console.log('[RootLayout] Color scheme loaded');
  
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_700Bold,
  });
  
  console.log('[RootLayout] Fonts loaded:', fontsLoaded, fontError);

  if (!fontsLoaded) {
    console.log('[RootLayout] Waiting for fonts...');
    return null;
  }

  console.log('[RootLayout] All initializations complete, rendering app');

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <SyncProvider>
            <XpFeedbackProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </ThemeProvider>
            </XpFeedbackProvider>
          </SyncProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
