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
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { getCompletedSubtopics } from '@/lib/completion-storage';
import { getStreakState } from '@/lib/streak-storage';
import { getXpState } from '@/lib/xp-storage';
import { getProfile, getAvatarSource, type AvatarId } from '@/lib/profile-storage';
import { topicSubtopicsEntries as aytSubtopicsEntries } from '@/app/ayt-matematik/subtopics.data';
import { topicSubtopicsEntries as tytSubtopicsEntries } from '@/app/tyt-matematik/subtopics.data';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const modules = useMemo(
    () => [
      {
        id: 'ayt',
        name: 'AYT Matematik',
        totalTopics: aytSubtopicsEntries.length,
        totalSubtopics: aytSubtopicsEntries.reduce((acc, [, list]) => acc + list.length, 0),
        visual: require('@/assets/images/aytmath_logo.png'),
      },
      {
        id: 'tyt',
        name: 'TYT Matematik',
        totalTopics: tytSubtopicsEntries.length,
        totalSubtopics: tytSubtopicsEntries.reduce((acc, [, list]) => acc + list.length, 0),
        visual: require('@/assets/images/partial-react-logo.png'),
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
  
  // Calculate responsive image height (max 280px, but adapts to smaller screens)
  const availableHeight = screenHeight - insets.top - insets.bottom - 200; // Reserve space for header, metrics, padding, button
  const imageHeight = Math.min(280, Math.max(180, availableHeight * 0.35));
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

  const handleContinue = (moduleId: string) => {
    if (moduleId === 'ayt') {
      router.push('/ayt-matematik' as never);
    }
    if (moduleId === 'tyt') {
      router.push('/tyt-matematik' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <Animated.View style={[styles.header, makeAnimatedStyle(headerAnim)]}>
          {(() => {
            const avatarSource = userAvatarId ? getAvatarSource(userAvatarId) : null;
            const displayName = userName || user?.user_metadata?.name || 'Kullanıcı';
            const displayInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
            
            return (
              <>
                <Pressable onPress={() => router.push('/profil' as never)}>
                  {avatarSource ? (
                    <ExpoImage
                      source={avatarSource}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>{displayInitial}</Text>
                    </View>
                  )}
                </Pressable>
                <Text style={styles.welcomeText}>
                  Hoş geldin <Text style={styles.nameText}>{displayName}</Text>
                </Text>
              </>
            );
          })()}
        </Animated.View>

        <Animated.View style={[styles.metricsRow, makeAnimatedStyle(metricsAnim)]}>
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              pressed && styles.metricCardPressed,
            ]}
            onPress={() => router.push('/(tabs)/streak' as never)}>
            <Text style={styles.metricIcon}>🔥</Text>
            <View>
              <Text style={styles.metricLabel}>Gün Serisi</Text>
              <Text style={styles.metricValue}>{streak}</Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              pressed && styles.metricCardPressed,
            ]}
            onPress={() => router.push('/(tabs)/xp' as never)}>
            <Text style={styles.metricIcon}>⭐️</Text>
            <View>
              <Text style={styles.metricLabel}>XP</Text>
              <Text style={styles.metricValue}>{xp}</Text>
            </View>
          </Pressable>
        </Animated.View>

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
              const completedDesenCount = completedSubtopics.filter((slug) =>
                subtopicEntries.some(([, list]) => list.some((s) => s.slug === slug)),
              ).length;
              const progressRatio =
                totalSubtopics > 0 ? completedDesenCount / totalSubtopics : 0;

              const completedTopics = subtopicEntries.filter(([, list]) =>
                list.every((subtopic) => completedSubtopics.includes(subtopic.slug)),
              ).length;
              return (
                <View style={[styles.moduleCard, { width: screenWidth - 48 }]}>
                  <Text style={styles.moduleName}>{item.name}</Text>
                  <Text style={styles.episodeLabel}>Tamamlanan Konu</Text>
                  <Text style={styles.episodeValue}>
                    {completedTopics} / {item.totalTopics}
                  </Text>
        <Image
                    source={item.visual}
                    style={[styles.visual, { height: imageHeight }]}
                    resizeMode="contain"
        />
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressRatio * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {completedDesenCount} / {totalSubtopics} desen tamamlandı
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.ctaButton,
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
              style={[styles.paginationDot, index === activeIndex && styles.paginationDotActive]}
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
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
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
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    marginTop: 16,
    width: '100%',
    maxHeight: 280,
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
    marginTop: 16,
    marginBottom: 8,
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
});
