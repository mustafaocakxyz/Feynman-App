import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * Preload critical images for instant display on web
 * Only runs on web platform for performance
 */
export function useImagePreloader() {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Only preload on web
    if (Platform.OS !== 'web') {
      setImagesLoaded(true);
      return;
    }

    const preloadImages = async () => {
      try {
        // List of all critical images to preload
        const imageAssets = [
          // Avatar images
          require('@/assets/images/avatars/avatar1.png'),
          require('@/assets/images/avatars/avatar2.png'),
          require('@/assets/images/avatars/avatar3.png'),
          require('@/assets/images/avatars/avatar4.png'),
          require('@/assets/images/avatars/avatar5.png'),
          // Subject logos
          require('@/assets/images/aytmath_logo.png'),
          require('@/assets/images/tytmath_logo.png'),
          // Quiz and completion images
          require('@/assets/images/quiz.png'),
          require('@/assets/images/7.png'),
          // Welcome image
          require('@/assets/images/greet.png'),
        ];

        // Convert require() results to Asset objects and download them
        const assets = imageAssets.map((source) => Asset.fromModule(source));
        await Promise.all(assets.map((asset) => asset.downloadAsync()));

        setImagesLoaded(true);
        console.log('[ImagePreloader] All critical images preloaded');
      } catch (error) {
        console.error('[ImagePreloader] Error preloading images:', error);
        // Still set loaded to true to not block app rendering
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  return imagesLoaded;
}
