import { useEffect, useMemo, useRef } from 'react';
import { Audio as ExpoAudio, AVPlaybackStatusSuccess } from 'expo-av';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

type NativeRefs = {
  positive: ExpoAudio.Sound | null;
  negative: ExpoAudio.Sound | null;
};

type WebRefs = {
  positive: HTMLAudioElement | null;
  negative: HTMLAudioElement | null;
};

export function useSoundEffects() {
  const nativeRefs = useRef<NativeRefs>({
    positive: null,
    negative: null,
  });
  const webRefs = useRef<WebRefs>({
    positive: null,
    negative: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (isWeb) {
          const [positiveAsset, negativeAsset] = await Asset.loadAsync([
            require('@/assets/sounds/positive.mp3'),
            require('@/assets/sounds/negative.mp3'),
          ]);
          if (cancelled) {
            return;
          }
          const positiveUri = positiveAsset.localUri ?? positiveAsset.uri;
          const negativeUri = negativeAsset.localUri ?? negativeAsset.uri;
          if (typeof window !== 'undefined') {
            const positive = new window.Audio(positiveUri);
            positive.preload = 'auto';
            const negative = new window.Audio(negativeUri);
            negative.preload = 'auto';
            webRefs.current.positive = positive;
            webRefs.current.negative = negative;
          }
        } else {
          await ExpoAudio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
          });

          const [positiveResult, negativeResult] = await Promise.all([
            ExpoAudio.Sound.createAsync(
              require('@/assets/sounds/positive.mp3'),
              {
                shouldPlay: false,
              },
            ),
            ExpoAudio.Sound.createAsync(
              require('@/assets/sounds/negative.mp3'),
              {
                shouldPlay: false,
              },
            ),
          ]);

          if (cancelled) {
            await positiveResult.sound.unloadAsync();
            await negativeResult.sound.unloadAsync();
            return;
          }

          nativeRefs.current.positive = positiveResult.sound;
          nativeRefs.current.negative = negativeResult.sound;
        }
      } catch (error) {
        console.warn('Ses efektleri yüklenemedi', error);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (isWeb) {
        if (webRefs.current.positive) {
          webRefs.current.positive.pause();
          webRefs.current.positive = null;
        }
        if (webRefs.current.negative) {
          webRefs.current.negative.pause();
          webRefs.current.negative = null;
        }
      } else {
        const unloadPromises: Promise<void>[] = [];
        if (nativeRefs.current.positive) {
          unloadPromises.push(
            nativeRefs.current.positive.unloadAsync().then(() => undefined),
          );
          nativeRefs.current.positive = null;
        }
        if (nativeRefs.current.negative) {
          unloadPromises.push(
            nativeRefs.current.negative.unloadAsync().then(() => undefined),
          );
          nativeRefs.current.negative = null;
        }
        if (unloadPromises.length) {
          Promise.all(unloadPromises).catch((error) =>
            console.warn('Ses efektleri kaldırılamadı', error),
          );
        }
      }
    };
  }, []);

  return useMemo(
    () => ({
      playPositive: async () => {
        if (isWeb) {
          const audio = webRefs.current.positive;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Pozitif ses çalınamadı (web)', error);
          }
          return;
        }
        const sound = nativeRefs.current.positive;
        if (!sound) return;
        try {
          const status = await sound.replayAsync();
          if (!(status as AVPlaybackStatusSuccess).isLoaded) {
            await sound.playAsync();
          }
        } catch (error) {
          console.warn('Pozitif ses çalınamadı (native)', error);
        }
      },
      playNegative: async () => {
        if (isWeb) {
          const audio = webRefs.current.negative;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Negatif ses çalınamadı (web)', error);
          }
          return;
        }
        const sound = nativeRefs.current.negative;
        if (!sound) return;
        try {
          const status = await sound.replayAsync();
          if (!(status as AVPlaybackStatusSuccess).isLoaded) {
            await sound.playAsync();
          }
        } catch (error) {
          console.warn('Negatif ses çalınamadı (native)', error);
        }
      },
    }),
    [],
  );
}



