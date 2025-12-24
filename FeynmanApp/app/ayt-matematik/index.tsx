import { useFocusEffect } from '@react-navigation/native';
import { Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { topicSubtopicsEntries } from './subtopics.data';
import { getCompletedSubtopics } from '@/lib/completion-storage';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function AYTMatematikScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme as 'light' | 'dark'];
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [completedSubtopics, setCompletedSubtopics] = useState<string[]>([]);

  const topics = useMemo(
    () =>
      topicSubtopicsEntries.map(([name, subtopics]) => ({
        name,
        subtopics,
      })),
    [],
  );

  const totalTopics = topics.length;
  const totalSubtopics = topics.reduce((acc, topic) => acc + topic.subtopics.length, 0);

  const toggleTopic = (topic: string) => {
    setOpenTopic((current) => (current === topic ? null : topic));
  };

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isActive = true;

      const loadCompleted = async () => {
        const stored = await getCompletedSubtopics(user.id);
        if (!isActive) return;
        setCompletedSubtopics(stored);
      };

      loadCompleted();

      return () => {
        isActive = false;
      };
    }, [user?.id]),
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 24), backgroundColor: colors.background }]}>
        <Pressable 
          style={[styles.backArrowButton, { backgroundColor: colors.cardBackgroundSecondary }]} 
          onPress={async () => {
            try {
              if (Platform.OS === 'web') {
                await Haptics.selectionAsync();
              } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch (error) {
              // Silently fail if haptics aren't available
            }
            router.push('/');
          }}>
          <Text style={[styles.backArrowText, { color: colors.text }]}>←</Text>
        </Pressable>

        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headlineContainer}>
              <Text style={[styles.headlinePrefix, { color: colors.text }]}>AYT</Text>
              <Text style={[styles.headlineSuffix, { color: colors.text }]}>Matematik</Text>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📘</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>{totalTopics}</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Konu</Text>
              </View>
            </View>
          </View>
          <Image
            source={require('@/assets/images/aytmath_logo.png')}
            style={styles.visual}
            resizeMode="contain"
          />
        </View>
        <View style={styles.topicList}>
          {topics.map((topic) => {
            const isOpen = openTopic === topic.name;
            const totalSubtopics = topic.subtopics.length;
            const completedCount = topic.subtopics.filter((subtopic) =>
              completedSubtopics.includes(subtopic.slug),
            ).length;
            const progressRatio = totalSubtopics > 0 ? completedCount / totalSubtopics : 0;
            const progressGradient: [string, string, string] = ['#264bbf', '#3b82f6', '#60a5fa'];
            return (
              <View key={topic.name} style={[styles.topicCard, { backgroundColor: colors.cardBackground }, isOpen && styles.topicCardOpen]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.topicHeader,
                    pressed && { backgroundColor: colors.cardBackgroundSecondary },
                  ]}
                  onPress={() => toggleTopic(topic.name)}>
                  <View style={styles.topicHeaderContent}>
                    <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.name}</Text>
                    <View style={[styles.topicProgressBarTrack, { backgroundColor: colors.progressBarBackground }]}>
                      <LinearGradient
                        colors={progressGradient}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={[
                          styles.topicProgressBarFill,
                          { width: `${progressRatio * 100}%` },
                        ]}
                      />
                    </View>
                    {totalSubtopics > 0 && (
                      <Text style={[styles.topicCompletionText, { color: colors.textSecondary }]}>
                        {completedCount} / {totalSubtopics} tamamlandı
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.topicChevron, { color: colors.textMuted }, isOpen && { color: colors.primary }]}>⌄</Text>
                </Pressable>
                {isOpen && (
                  <View style={[styles.topicBody, { borderTopColor: colors.border }]}>
                    {topic.subtopics.length > 0 ? (
                      topic.subtopics.map((subtopic) => (
                        <Pressable
                          key={subtopic.slug}
                          style={({ pressed }) => [
                            styles.subtopicItem,
                            { backgroundColor: colors.background },
                            pressed && { backgroundColor: colors.cardBackgroundSecondary },
                            completedSubtopics.includes(subtopic.slug) && {
                              backgroundColor: colors.successBackground,
                              borderColor: colors.success,
                            },
                          ]}
                          onPress={() => router.push(`/ayt-matematik/${subtopic.slug}`)}>
                          <Text style={[styles.subtopicText, { color: colors.text }]}>{subtopic.title}</Text>
                          <Text style={[styles.subtopicArrow, { color: colors.primary }]}>›</Text>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={[styles.emptySubtopicText, { color: colors.textSecondary }]}>
                        Bu konu için öğeler yakında eklenecek.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },
  backArrowButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backArrowText: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    borderRadius: 24,
    gap: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 12,
    minWidth: 0,
    flexShrink: 1,
  },
  visual: {
    width: 110,
    height: 110,
    flexShrink: 0,
  },
  headlineContainer: {
    gap: 0,
  },
  headlinePrefix: {
    fontSize: 26,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'left',
    lineHeight: 32,
  },
  headlineSuffix: {
    fontSize: 26,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'left',
    lineHeight: 32,
  },
  infoColumn: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: 'bold',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  topicList: {
    gap: 16,
  },
  topicCard: {
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  topicCardOpen: {
    shadowOpacity: 0.2,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  topicHeaderContent: {
    flex: 1,
    gap: 8,
  },
  topicTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  topicProgressBarTrack: {
    height: 8,
    width: '75%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  topicProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  topicCompletionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
  topicChevron: {
    fontSize: 24,
    transform: [{ rotate: '0deg' }],
  },
  topicBody: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  subtopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  subtopicText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  subtopicArrow: {
    fontSize: 24,
  },
  emptySubtopicText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
  },
});


