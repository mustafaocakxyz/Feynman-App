import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

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

  const topics = topicSubtopicsEntries.map(([name, subtopics]) => ({
    name,
    subtopics,
  }));

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
        <View style={styles.navRow}>
          <Pressable style={[styles.backButton, { backgroundColor: colors.cardBackgroundSecondary }]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.text }]}>{'<'} Geri</Text>
          </Pressable>
          <Pressable style={[styles.homeButton, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]} onPress={() => router.push('/')}>
            <Text style={[styles.homeButtonText, { color: colors.primary }]}>Ana Sayfa</Text>
          </Pressable>
        </View>

        <Text style={[styles.headline, { color: colors.text }]}>AYT Matematik</Text>

        <Image
          source={require('@/assets/images/aytmath_logo.png')}
          style={[styles.visual, { backgroundColor: colors.cardBackground }]}
          resizeMode="contain"
        />

        <View style={styles.detailRow}>
          <View style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={styles.detailIcon}>📘</Text>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Konular</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>13</Text>
            </View>
          </View>
          <View style={[styles.detailCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={styles.detailIcon}>💡</Text>
            <View>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Desenler</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>130</Text>
            </View>
          </View>
        </View>
        <View style={styles.topicList}>
          {topics.map((topic) => {
            const isOpen = openTopic === topic.name;
            const totalSubtopics = topic.subtopics.length;
            const completedCount = topic.subtopics.filter((subtopic) =>
              completedSubtopics.includes(subtopic.slug),
            ).length;
            const topicTitle =
              totalSubtopics > 0
                ? `${topic.name} (${completedCount} / ${totalSubtopics} tamamlandı)`
                : topic.name;
            return (
              <View key={topic.name} style={[styles.topicCard, { backgroundColor: colors.cardBackground }, isOpen && styles.topicCardOpen]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.topicHeader,
                    pressed && { backgroundColor: colors.cardBackgroundSecondary },
                  ]}
                  onPress={() => toggleTopic(topic.name)}>
                  <Text style={[styles.topicTitle, { color: colors.text }]}>{topicTitle}</Text>
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
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  homeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  homeButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  visual: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  detailIcon: {
    fontSize: 30,
  },
  detailLabel: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'Montserrat_700Bold',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 26,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  topicTitle: {
    fontSize: 18,
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


