import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export function useSoundEffects() {
  const [audioError, setAudioError] = useState(false);
  
  // Always call hooks (React rules), but only use on native
  // On web, these will be ignored and we'll use HTML5 Audio instead
  // Wrap in try-catch-safe way: hooks must be called, but we handle errors in usage
  const positivePlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/positive.mp3'),
  );
  const negativePlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/negative.mp3'),
  );
  const correctPlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/correct.mp3'),
  );
  const completionPlayer = useAudioPlayer(
    isWeb ? null : require('@/assets/sounds/completion.mp3'),
  );

  // Web audio refs
  const webPositiveRef = useRef<HTMLAudioElement | null>(null);
  const webNegativeRef = useRef<HTMLAudioElement | null>(null);
  const webCorrectRef = useRef<HTMLAudioElement | null>(null);
  const webCompletionRef = useRef<HTMLAudioElement | null>(null);

  // Verify players are valid (not just truthy, but actually usable)
  const isPlayerReady = (player: ReturnType<typeof useAudioPlayer> | null) => {
    if (!player) return false;
    // Check if player has required methods (expo-audio specific)
    return typeof player.play === 'function' && 
           typeof player.pause === 'function' &&
           typeof player.seekTo === 'function';
  };

  useEffect(() => {
    if (!isWeb) return; // Native uses the hooks above

    // Load web audio
    let cancelled = false;

    const loadWebAudio = async () => {
      try {
        const [positiveAsset, negativeAsset, correctAsset, completionAsset] = await Asset.loadAsync([
          require('@/assets/sounds/positive.mp3'),
          require('@/assets/sounds/negative.mp3'),
          require('@/assets/sounds/correct.mp3'),
          require('@/assets/sounds/completion.mp3'),
        ]);
        if (cancelled) return;

        const positiveUri = positiveAsset.localUri ?? positiveAsset.uri;
        const negativeUri = negativeAsset.localUri ?? negativeAsset.uri;
        const correctUri = correctAsset.localUri ?? correctAsset.uri;
        const completionUri = completionAsset.localUri ?? completionAsset.uri;

        if (typeof window !== 'undefined') {
          const positive = new window.Audio(positiveUri);
          positive.preload = 'auto';
          const negative = new window.Audio(negativeUri);
          negative.preload = 'auto';
          const correct = new window.Audio(correctUri);
          correct.preload = 'auto';
          const completion = new window.Audio(completionUri);
          completion.preload = 'auto';
          webPositiveRef.current = positive;
          webNegativeRef.current = negative;
          webCorrectRef.current = correct;
          webCompletionRef.current = completion;
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
      if (webCorrectRef.current) {
        webCorrectRef.current.pause();
        webCorrectRef.current = null;
      }
      if (webCompletionRef.current) {
        webCompletionRef.current.pause();
        webCompletionRef.current = null;
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
        if (audioError || !isPlayerReady(positivePlayer)) {
          console.warn('Audio player not ready (positive)');
          return;
        }
        try {
          // Replay from beginning
          if (positivePlayer) {
            positivePlayer.pause();
            positivePlayer.seekTo(0);
            positivePlayer.play();
          }
        } catch (error) {
          console.warn('Pozitif ses çalınamadı (native)', error);
          setAudioError(true);
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
        if (audioError || !isPlayerReady(negativePlayer)) {
          console.warn('Audio player not ready (negative)');
          return;
        }
        try {
          // Replay from beginning
          if (negativePlayer) {
            negativePlayer.pause();
            negativePlayer.seekTo(0);
            negativePlayer.play();
          }
        } catch (error) {
          console.warn('Negatif ses çalınamadı (native)', error);
          setAudioError(true);
        }
      },
      playCorrect: async () => {
        if (isWeb) {
          const audio = webCorrectRef.current;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Correct ses çalınamadı (web)', error);
          }
          return;
        }

        // Native: use expo-audio player
        if (audioError || !isPlayerReady(correctPlayer)) {
          console.warn('Audio player not ready (correct)');
          return;
        }
        try {
          // Replay from beginning
          if (correctPlayer) {
            correctPlayer.pause();
            correctPlayer.seekTo(0);
            correctPlayer.play();
          }
        } catch (error) {
          console.warn('Correct ses çalınamadı (native)', error);
          setAudioError(true);
        }
      },
      playCompletion: async () => {
        if (isWeb) {
          const audio = webCompletionRef.current;
          if (!audio) return;
          try {
            audio.currentTime = 0;
            await audio.play();
          } catch (error) {
            console.warn('Completion ses çalınamadı (web)', error);
          }
          return;
        }

        // Native: use expo-audio player
        if (audioError || !isPlayerReady(completionPlayer)) {
          console.warn('Audio player not ready (completion)');
          return;
        }
        try {
          // Replay from beginning
          if (completionPlayer) {
            completionPlayer.pause();
            completionPlayer.seekTo(0);
            completionPlayer.play();
          }
        } catch (error) {
          console.warn('Completion ses çalınamadı (native)', error);
          setAudioError(true);
        }
      },
    }),
    [positivePlayer, negativePlayer, correctPlayer, completionPlayer, audioError],
  );
}
