import { ReactNode, createContext, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

type XpToast = {
  amount: number;
  id: number;
  onAdvance?: () => void;
  showAdvance?: boolean;
};

type XpContextValue = {
  showXp: (amount: number, options?: { onAdvance?: () => void; showAdvance?: boolean }) => void;
};

const XpFeedbackContext = createContext<XpContextValue | undefined>(undefined);

export function XpFeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<XpToast | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();
  const colors = Colors[theme as 'light' | 'dark'];

  const hideToast = (id: number) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    });
  };

  const showXp = (amount: number, options?: { onAdvance?: () => void; showAdvance?: boolean }) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const nextId = Date.now();
    setToast({
      amount: Math.round(amount),
      id: nextId,
      onAdvance: options?.onAdvance,
      showAdvance: options?.showAdvance ?? false,
    });
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    
    // Only auto-hide if there's no advance button
    if (!options?.showAdvance) {
      timeoutRef.current = setTimeout(() => {
        hideToast(nextId);
      }, 3000);
    }
  };

  const handleAdvance = async () => {
    try {
      // Light haptic feedback for navigation/advance button
      if (Platform.OS === 'web') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics aren't available
    }
    if (toast?.onAdvance) {
      toast.onAdvance();
    }
    if (toast) {
      hideToast(toast.id);
    }
  };

  const value = useMemo(() => ({ showXp }), []);

  // Calculate approximate content height based on whether button is shown
  // ~180px with button (text + spacing + button + padding), ~100px without
  const insetsValue = insets.bottom || 16;
  const estimatedContentHeight = toast?.showAdvance ? 180 : 100;
  const toastHeight = estimatedContentHeight + insetsValue + 32; // +32 for paddingTop
  
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [toastHeight, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <XpFeedbackContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: colors.cardBackground,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 32,
              transform: [{ translateY }],
              opacity,
              shadowColor: theme === 'dark' ? '#000000' : '#0f172a',
            },
          ]}>
          <Text style={[styles.toastText, { color: colors.text }]}>⭐ {toast.amount} XP Kazandınız!</Text>
          {toast.showAdvance && toast.onAdvance && (
            <Pressable
              style={[
                styles.advanceButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: theme === 'dark' ? '#000000' : '#1d4ed8',
                },
              ]}
              onPress={handleAdvance}>
              <Text style={styles.advanceButtonText}>İlerle</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </XpFeedbackContext.Provider>
  );
}

export function useXpFeedback() {
  const ctx = useContext(XpFeedbackContext);
  if (!ctx) {
    throw new Error('useXpFeedback must be used within XpFeedbackProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 20,
  },
  toastText: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  advanceButton: {
    marginTop: 8,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  advanceButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
});


