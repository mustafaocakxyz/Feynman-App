import { useEffect, useMemo, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export function useSoundEffects() {
  // Always call hooks (React rules), but only use on native
  // On web, these will be ignored and we'll use HTML5 Audio instead
  const positivePlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/positive.mp3'),
  );
  const negativePlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/negative.mp3'),
  );

  // Web audio refs
  const webPositiveRef = useRef<HTMLAudioElement | null>(null);
  const webNegativeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isWeb) return; // Native uses the hooks above

    // Load web audio
    let cancelled = false;

    const loadWebAudio = async () => {
      try {
        const [positiveAsset, negativeAsset] = await Asset.loadAsync([
          require('@/assets/sounds/positive.mp3'),
          require('@/assets/sounds/negative.mp3'),
        ]);
        if (cancelled) return;

        const positiveUri = positiveAsset.localUri ?? positiveAsset.uri;
        const negativeUri = negativeAsset.localUri ?? negativeAsset.uri;

        if (typeof window !== 'undefined') {
          const positive = new window.Audio(positiveUri);
          positive.preload = 'auto';
          const negative = new window.Audio(negativeUri);
          negative.preload = 'auto';
          webPositiveRef.current = positive;
          webNegativeRef.current = negative;
        }
      } catch (error) {
        console.warn('Ses efektleri yüklenemedi (web)', error);
      }
    };

    loadWebAudio();

    return () => {
      cancelled = true;
      if (webPositiveRef.current) {
        webPositiveRef.current.pause();
        webPositiveRef.current = null;
      }
      if (webNegativeRef.current) {
        webNegativeRef.current.pause();
        webNegativeRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      playPositive: async () => {
        if (isWeb) {
          const audio = webPositiveRef.current;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Pozitif ses çalınamadı (web)', error);
          }
          return;
        }

        // Native: use expo-audio player
        if (!positivePlayer) return;
        try {
          // Replay from beginning
          positivePlayer.pause();
          positivePlayer.seekTo(0);
          positivePlayer.play();
        } catch (error) {
          console.warn('Pozitif ses çalınamadı (native)', error);
        }
      },
      playNegative: async () => {
        if (isWeb) {
          const audio = webNegativeRef.current;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Negatif ses çalınamadı (web)', error);
          }
          return;
        }

        // Native: use expo-audio player
        if (!negativePlayer) return;
        try {
          // Replay from beginning
          negativePlayer.pause();
          negativePlayer.seekTo(0);
          negativePlayer.play();
        } catch (error) {
          console.warn('Negatif ses çalınamadı (native)', error);
        }
      },
    }),
    [positivePlayer, negativePlayer],
  );
}
