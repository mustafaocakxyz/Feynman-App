import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={async (ev) => {
        try {
          // Haptic feedback works on iOS, Android, and web (with browser support)
          // expo-haptics handles platform differences automatically
          if (Platform.OS === 'web') {
            // On web, use Web Vibration API (supported in Chrome, Firefox, Edge)
            // expo-haptics will handle this, but we can use selection feedback which is more web-friendly
            await Haptics.selectionAsync();
          } else {
            // On iOS and Android, use light impact feedback
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (error) {
          // Silently fail if haptics aren't available (e.g., Safari on web)
          // This ensures the app continues to work normally
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
