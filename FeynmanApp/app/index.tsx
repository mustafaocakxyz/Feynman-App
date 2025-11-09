import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  const modules = useMemo(
    () => [
      {
        id: 'ayt',
        name: 'AYT Matematik',
        currentEpisode: 0,
        totalEpisodes: 5,
        visual: require('@/assets/images/aytmath_logo.png'),
      },
      {
        id: 'tyt',
        name: 'TYT Matematik',
        currentEpisode: 0,
        totalEpisodes: 5,
        visual: require('@/assets/images/partial-react-logo.png'),
      },
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const metricsAnim = useRef(new Animated.Value(0)).current;
  const modulesAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(metricsAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modulesAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, metricsAnim, modulesAnim]);

  const makeAnimatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [32, 0],
        }),
      },
    ],
  });

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setActiveIndex(index);
  };

  const handleContinue = (moduleId: string) => {
    if (moduleId === 'ayt') {
      router.push('/ayt-matematik');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.header, makeAnimatedStyle(headerAnim)]}>
          <Image
            source={{ uri: 'https://yt3.googleusercontent.com/SxKRbmKHt7O-JmUe9fQ0ekb7RuB6RyYroxryvH_brt04ZkjNjGkqi3dUjFa3u3VteEf5yfXVkF0=s160-c-k-c0x00ffffff-no-rj' }}
            style={styles.avatar}
          />
          <Text style={styles.welcomeText}>
            Hoş geldin <Text style={styles.nameText}>Mustafa</Text>
          </Text>
        </Animated.View>

        <Animated.View style={[styles.metricsRow, makeAnimatedStyle(metricsAnim)]}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🔥</Text>
            <View>
              <Text style={styles.metricLabel}>Gün Serisi</Text>
              <Text style={styles.metricValue}>7</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⭐️</Text>
            <View>
              <Text style={styles.metricLabel}>XP</Text>
              <Text style={styles.metricValue}>150</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={makeAnimatedStyle(modulesAnim)}>
          <FlatList
            data={modules}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            renderItem={({ item }) => {
              const itemProgress = item.currentEpisode / item.totalEpisodes;
              return (
                <View style={[styles.moduleCard, { width: screenWidth - 48 }]}> 
                  <Text style={styles.moduleName}>{item.name}</Text>
                  <Text style={styles.episodeLabel}>İlerlenen Bölüm</Text>
                  <Text style={styles.episodeValue}>{item.currentEpisode}</Text>
                  <Image source={item.visual} style={styles.visual} resizeMode="contain" />
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${itemProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {item.currentEpisode} / {item.totalEpisodes}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.ctaButton,
                      item.id !== 'ayt' && styles.ctaButtonDisabled,
                      pressed && item.id === 'ayt' && styles.ctaButtonPressed,
                    ]}
                    onPress={() => handleContinue(item.id)}
                    disabled={item.id !== 'ayt'}>
                    <Text
                      style={[
                        styles.ctaText,
                        item.id !== 'ayt' && styles.ctaTextDisabled,
                      ]}>
                      Devam Et
                    </Text>
                  </Pressable>
                </View>
              );
            }}
            contentContainerStyle={styles.carouselContent}
          />
        </Animated.View>

        <View style={styles.paginationRow}>
          {modules.map((module, index) => (
            <View
              key={module.id}
              style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]}
            />
          ))}
        </View>

        <View style={styles.bottomNav}>
          <Text style={[styles.bottomNavItem, styles.bottomNavItemActive]}>Ana Sayfa</Text>
          <Text style={styles.bottomNavItem}>Dersler</Text>
          <Text style={styles.bottomNavItem}>Profil</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Montserrat_700Bold',
  },
  nameText: {
    color: '#1d4ed8',
    fontFamily: 'Montserrat_700Bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  metricIcon: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
  },
  metricLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  carouselContent: {
    paddingVertical: 32,
    gap: 24,
  },
  moduleCard: {
    borderRadius: 24,
    backgroundColor: '#f5f7fb',
    padding: 24,
    marginRight: 24,
    alignSelf: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  moduleName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  episodeLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  episodeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  visual: {
    marginTop: 24,
    width: '100%',
    height: 350,
  },
  progressBarTrack: {
    marginTop: 24,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Montserrat_700Bold',
  },
  ctaButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0.1,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_700Bold',
  },
  ctaTextDisabled: {
    color: '#e0f2fe',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  paginationDotActive: {
    backgroundColor: '#2563eb',
    width: 18,
  },
  bottomNav: {
    marginTop: 'auto',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomNavItem: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  bottomNavItemActive: {
    color: '#2563eb',
    fontWeight: '600',
    fontFamily: 'Montserrat_700Bold',
  },
});

