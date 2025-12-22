import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { getCompletedSubtopics } from '@/lib/completion-storage';
import { getStreakState } from '@/lib/streak-storage';
import { getXpState } from '@/lib/xp-storage';
import { getProfile, getAvatarSource, type AvatarId } from '@/lib/profile-storage';
import { topicSubtopicsEntries as aytSubtopicsEntries } from '@/app/ayt-matematik/subtopics.data';
import { topicSubtopicsEntries as tytSubtopicsEntries } from '@/app/tyt-matematik/subtopics.data';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const modules = useMemo(
    () => [
      {
        id: 'tyt',
        name: 'TYT Matematik',
        totalTopics: tytSubtopicsEntries.length,
        totalSubtopics: tytSubtopicsEntries.reduce((acc, [, list]) => acc + list.length, 0),
        visual: require('@/assets/images/tytmath_logo.png'),
      },
      {
        id: 'ayt',
        name: 'AYT Matematik',
        totalTopics: aytSubtopicsEntries.length,
        totalSubtopics: aytSubtopicsEntries.reduce((acc, [, list]) => acc + list.length, 0),
        visual: require('@/assets/images/aytmath_logo.png'),
      },
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const [completedSubtopics, setCompletedSubtopics] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [userName, setUserName] = useState('');
  const [userAvatarId, setUserAvatarId] = useState<AvatarId | null>(null);
  
  // Calculate responsive image height (max 252px, but adapts to smaller screens) - reduced by 10%
  const availableHeight = screenHeight - insets.top - insets.bottom - 200; // Reserve space for header, metrics, padding, button
  const imageHeight = Math.min(252, Math.max(162, availableHeight * 0.315));
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isActive = true;
      const load = async () => {
        const [completed, streakState, xpState, profile] = await Promise.all([
          getCompletedSubtopics(user.id),
          getStreakState(user.id),
          getXpState(user.id),
          getProfile(user.id),
        ]);
        if (!isActive) return;
        setCompletedSubtopics(completed);
        setStreak(streakState.count);
        setXp(xpState.total);
        setUserName(profile.name || user.user_metadata?.name || '');
        setUserAvatarId(profile.avatarId);
      };
      load();
      return () => {
        isActive = false;
      };
    }, [user?.id, user?.user_metadata?.name]),
  );
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

  const triggerHaptic = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics aren't available
    }
  }, []);

  const handleContinue = async (moduleId: string) => {
    await triggerHaptic();
    if (moduleId === 'ayt') {
      router.push('/ayt-matematik' as never);
    }
    if (moduleId === 'tyt') {
      router.push('/tyt-matematik' as never);
    }
  };

  const handleStreakPress = async () => {
    await triggerHaptic();
    router.push('/(tabs)/streak' as never);
  };

  const handleXpPress = async () => {
    await triggerHaptic();
    router.push('/(tabs)/xp' as never);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <Animated.View style={[styles.topRow, makeAnimatedStyle(headerAnim)]}>
          {(() => {
            const avatarSource = userAvatarId ? getAvatarSource(userAvatarId) : null;
            const displayName = userName || user?.user_metadata?.name || 'Kullanıcı';
            const displayInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
            
            return (
              <>
                <Pressable onPress={() => router.push('/(tabs)/profil' as never)}>
                  {avatarSource ? (
                    <ExpoImage
                      source={avatarSource}
                      style={styles.topAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.topAvatarPlaceholder, { backgroundColor: colors.tint }]}>
                      <Text style={styles.topAvatarPlaceholderText}>{displayInitial}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.topMetricCard,
                    { backgroundColor: colors.cardBackgroundSecondary },
                    pressed && styles.metricCardPressed,
                  ]}
                  onPress={handleStreakPress}>
                  <Text style={styles.metricIcon}>🔥</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{streak}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.topMetricCard,
                    { backgroundColor: colors.cardBackgroundSecondary },
                    pressed && styles.metricCardPressed,
                  ]}
                  onPress={handleXpPress}>
                  <Text style={styles.metricIcon}>⭐️</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{xp}</Text>
                </Pressable>
              </>
            );
          })()}
        </Animated.View>

                <Pressable
                  style={({ pressed }) => [
                    styles.quizButton,
                    { backgroundColor: colors.primary },
                    pressed && styles.quizButtonPressed,
                  ]}
                  onPress={() => router.push('/(tabs)/quiz' as never)}>
                  <Text style={styles.quizButtonEmoji}>❓</Text>
                  <Text style={styles.quizButtonText}>Kendini test et!</Text>
                  <Text style={styles.quizButtonArrow}>›</Text>
                </Pressable>

        <Animated.View style={[makeAnimatedStyle(modulesAnim), styles.flatListContainer]}>
          <FlatList
            data={modules}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            style={styles.flatList}
            renderItem={({ item }) => {
              const subtopicEntries =
                item.id === 'ayt' ? aytSubtopicsEntries : tytSubtopicsEntries;
              const totalSubtopics = item.totalSubtopics;
              const completedModulCount = completedSubtopics.filter((slug) =>
                subtopicEntries.some(([, list]) => list.some((s) => s.slug === slug)),
              ).length;
              const progressRatio =
                totalSubtopics > 0 ? completedModulCount / totalSubtopics : 0;

              const completedTopics = subtopicEntries.filter(([, list]) =>
                list.every((subtopic) => completedSubtopics.includes(subtopic.slug)),
              ).length;
              return (
                <View style={[styles.moduleCard, { width: screenWidth - 48, backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.moduleName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.episodeLabel, { color: colors.textSecondary }]}>Tamamlanan Konu</Text>
                  <Text style={[styles.episodeValue, { color: colors.text }]}>
                    {completedTopics} / {item.totalTopics}
                  </Text>
        <Image
                    source={item.visual}
                    style={[styles.visual, { height: imageHeight }]}
                    resizeMode="contain"
        />
                  <View style={[styles.progressBarTrack, { backgroundColor: colors.progressBarBackground }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressRatio * 100}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                    {completedModulCount} / {totalSubtopics} modül tamamlandı
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.ctaButton,
                      { backgroundColor: colors.primary },
                      pressed && styles.ctaButtonPressed,
                    ]}
                    onPress={() => handleContinue(item.id)}
                    disabled={false}>
                    <Text
                      style={[
                        styles.ctaText,
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
              style={[
                styles.paginationDot,
                { backgroundColor: index === activeIndex ? colors.primary : colors.border },
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  topAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  topAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  topMetricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
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
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  metricCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  metricIcon: {
    fontSize: 28,
    fontFamily: 'Montserrat_700Bold',
  },
  metricLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Montserrat_700Bold',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat_700Bold',
  },
  quizButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  quizButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  quizButtonEmoji: {
    fontSize: 24,
  },
  quizButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
    marginLeft: 12,
  },
  quizButtonArrow: {
    fontSize: 24,
    color: '#ffffff',
  },
  flatListContainer: {
    marginVertical: 8,
  },
  flatList: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingVertical: 24,
    gap: 24,
    alignItems: 'center',
  },
  moduleCard: {
    borderRadius: 24,
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
    fontFamily: 'Montserrat_700Bold',
  },
  episodeLabel: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  episodeValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
  },
  visual: {
    marginTop: 16,
    width: '100%',
    maxHeight: 252,
  },
  progressBarTrack: {
    marginTop: 24,
    height: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  ctaButton: {
    marginTop: 24,
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
    marginTop: 16,
    marginBottom: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 18,
  },
});
