import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { XpFeedbackProvider } from '@/components/xp-feedback-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRouteProvider } from '@/components/protected-route';
import { SyncProvider } from '@/components/SyncProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useImagePreloader } from '@/hooks/use-image-preloader';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';

function RootLayoutNav() {
  return (
    <ProtectedRouteProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ayt-matematik/index" options={{ headerShown: false }} />
        <Stack.Screen name="ayt-matematik/[subtopic]" options={{ headerShown: false }} />
        <Stack.Screen name="tyt-matematik/index" options={{ headerShown: false }} />
        <Stack.Screen name="tyt-matematik/[subtopic]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </ProtectedRouteProvider>
  );
}

function RootLayoutContent() {
  const { theme } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  
  // Preload critical images (only on web)
  const imagesLoaded = useImagePreloader();
  
  console.log('[RootLayout] Fonts loaded:', fontsLoaded, fontError);
  console.log('[RootLayout] Images preloaded:', imagesLoaded);
  console.log('[RootLayout] Theme:', theme);

  if (!fontsLoaded) {
    console.log('[RootLayout] Waiting for fonts...');
    return null;
  }

  console.log('[RootLayout] All initializations complete, rendering app');

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  console.log('[RootLayout] Starting app initialization...');
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <XpFeedbackProvider>
                <RootLayoutContent />
              </XpFeedbackProvider>
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
