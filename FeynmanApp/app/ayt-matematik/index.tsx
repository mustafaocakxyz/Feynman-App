import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { trigSubtopics } from './subtopics';

export default function AYTMatematikScreen() {
  const router = useRouter();
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const topics = [
    'Trigonometri',
    'Logaritma & Diziler',
    'Limit & Süreklilik',
    'Türev',
    'İntegral',
  ];

  const toggleTopic = (topic: string) => {
    setOpenTopic((current) => (current === topic ? null : topic));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{'<'} Geri</Text>
        </Pressable>

        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.visual}
          resizeMode="contain"
        />

        <Text style={styles.headline}>AYT Matematik</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>📘</Text>
            <View>
              <Text style={styles.detailLabel}>Konular</Text>
              <Text style={styles.detailValue}>13</Text>
            </View>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>💡</Text>
            <View>
              <Text style={styles.detailLabel}>Desenler</Text>
              <Text style={styles.detailValue}>130</Text>
            </View>
          </View>
        </View>
        <View style={styles.topicList}>
          {topics.map((topic) => {
            const isOpen = openTopic === topic;
            return (
              <View key={topic} style={[styles.topicCard, isOpen && styles.topicCardOpen]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.topicHeader,
                    pressed && styles.topicHeaderPressed,
                  ]}
                  onPress={() => toggleTopic(topic)}>
                  <Text style={styles.topicTitle}>{topic}</Text>
                  <Text style={[styles.topicChevron, isOpen && styles.topicChevronOpen]}>⌄</Text>
                </Pressable>
                {isOpen && (
                  <View style={styles.topicBody}>
                    {topic === 'Trigonometri'
                      ? trigSubtopics.map((subtopic) => (
                          <Pressable
                            key={subtopic.slug}
                            style={({ pressed }) => [
                              styles.subtopicItem,
                              pressed && styles.subtopicItemPressed,
                            ]}
                            onPress={() => router.push(`/ayt-matematik/${subtopic.slug}`)}>
                            <Text style={styles.subtopicText}>{subtopic.title}</Text>
                            <Text style={styles.subtopicArrow}>›</Text>
                          </Pressable>
                        ))
                      : null}
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
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
    backgroundColor: '#ffffff',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  visual: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  headline: {
    fontSize: 32,
    color: '#0f172a',
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
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  detailValue: {
    marginTop: 4,
    fontSize: 26,
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  topicList: {
    gap: 16,
  },
  topicCard: {
    borderRadius: 20,
    backgroundColor: '#f9fafb',
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
  topicHeaderPressed: {
    backgroundColor: '#eef2ff',
  },
  topicTitle: {
    fontSize: 18,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  topicChevron: {
    fontSize: 24,
    color: '#9ca3af',
    transform: [{ rotate: '0deg' }],
  },
  topicChevronOpen: {
    color: '#2563eb',
    transform: [{ rotate: '180deg' }],
  },
  topicBody: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  subtopicItemPressed: {
    backgroundColor: '#eff6ff',
  },
  subtopicText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  subtopicArrow: {
    fontSize: 24,
    color: '#2563eb',
  },
});


