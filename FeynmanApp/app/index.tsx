import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const { user, initialized } = useAuth();

  // Show loading while checking auth state
  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  // Redirect based on auth state
  if (user) {
    // User is authenticated - redirect to tabs (the initialRouteName "index" will be shown)
    return <Redirect href="/(tabs)" />;
  } else {
    // User is not authenticated - redirect to auth welcome
    return <Redirect href="/(auth)/welcome" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
