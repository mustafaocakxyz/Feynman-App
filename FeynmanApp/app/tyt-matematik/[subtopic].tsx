import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { subtopicTitleBySlug } from './subtopics.data';

export default function TYTSubtopicScreen() {
  const router = useRouter();
  const { subtopic } = useLocalSearchParams<{ subtopic?: string }>();

  const title = subtopic ? subtopicTitleBySlug[subtopic] ?? 'Alt Konu' : 'Alt Konu';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navRow}>
          <Pressable style={styles.navButton} onPress={() => router.back()}>
            <Text style={styles.navButtonText}>{'<'} Geri</Text>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => router.push('/')}>
            <Text style={styles.navButtonText}>Ana Sayfa</Text>
          </Pressable>
        </View>

        <Text style={styles.headline}>{title}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bu alt konu yakında</Text>
          <Text style={styles.cardBody}>
            İçerik hazırlığı tamamlandığında burada ders anlatımı, sorular ve ödüller görünecek.
          </Text>
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
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
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
  navButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Montserrat_700Bold',
  },
  headline: {
    fontSize: 32,
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.light.text,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: Colors.light.icon,
    lineHeight: 20,
  },
});
