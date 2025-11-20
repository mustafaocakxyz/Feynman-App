import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { XpFeedbackProvider } from '@/components/xp-feedback-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRouteProvider } from '@/components/protected-route';

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
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <XpFeedbackProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ThemeProvider>
        </XpFeedbackProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
