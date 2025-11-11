import { ReactNode, createContext, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type XpContextValue = {
  showXp: (amount: number) => void;
};

const XpFeedbackContext = createContext<XpContextValue | undefined>(undefined);

export function XpFeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ amount: number; id: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const hideToast = (id: number) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    });
  };

  const showXp = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const nextId = Date.now();
    setToast({ amount: Math.round(amount), id: nextId });
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    timeoutRef.current = setTimeout(() => {
      hideToast(nextId);
    }, 3000);
  };

  const value = useMemo(() => ({ showXp }), []);

  const screenHeight = Dimensions.get('window').height;
  const toastHeight = screenHeight * 0.3;
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
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
              opacity,
              height: toastHeight,
            },
          ]}>
          <Text style={styles.toastText}>{toast.amount} XP Kazandınız!</Text>
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
    backgroundColor: '#15803d',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#065f46',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 20,
  },
  toastText: {
    color: '#f0fdf4',
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
});


