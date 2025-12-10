import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { getStreakState } from '@/lib/streak-storage';
import { useAuth } from '@/contexts/auth-context';

const TIME_ZONE = 'Europe/Istanbul';
const DAY_NAMES = ['Pzt', 'Salı', 'Çar', 'Per', 'Cum', 'Cmt', 'Pzr'];

function getTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+03:00`);
}

function diffInDays(from: string, to: string): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const a = toDate(from);
  const b = toDate(to);
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function getDayOfWeek(date: Date): number {
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Adjust for Turkey timezone
  const day = date.getDay();
  // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
  return day === 0 ? 6 : day - 1;
}

export default function StreakScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isActive = true;

      const loadStreak = async () => {
        const streakState = await getStreakState(user.id);
        if (!isActive) return;
        setStreakCount(streakState.count);
        setLastActivityDate(streakState.lastActivityDate);
      };

      loadStreak();

      return () => {
        isActive = false;
      };
    }, [user?.id]),
  );

  // Calculate which days in the last 7 days have streak
  const weekDays = useMemo(() => {
    const today = new Date();
    const days: Array<{ date: Date; dateString: string; dayName: string; hasStreak: boolean }> = [];

    // Generate last 7 days (today + 6 days before)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = getDateString(date);
      const dayOfWeek = getDayOfWeek(date);
      const dayName = DAY_NAMES[dayOfWeek];

      // Check if this day has streak
      let hasStreak = false;
      if (lastActivityDate && streakCount > 0) {
        // Calculate how many days between dateString and lastActivityDate
        // diffInDays returns: (lastActivityDate - dateString) in days
        // If dateString is before lastActivityDate, result is positive
        // If dateString equals lastActivityDate, result is 0
        const daysDiff = diffInDays(dateString, lastActivityDate);
        // Day has streak if it's within the streak window:
        // lastActivityDate (0 days), lastActivityDate-1 (1 day), ..., lastActivityDate-(streakCount-1)
        // So daysDiff should be >= 0 and < streakCount
        if (daysDiff >= 0 && daysDiff < streakCount) {
          hasStreak = true;
        }
      }

      days.push({ date, dateString, dayName, hasStreak });
    }

    return days;
  }, [streakCount, lastActivityDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navRow}>
          <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)' as never)}>
            <Text style={styles.backButtonText}>{'<'} Geri</Text>
          </Pressable>
        </View>

        {/* Big fire emoji */}
        <View style={styles.fireContainer}>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>

        {/* Current streak count */}
        <Text style={styles.streakCount}>{streakCount}</Text>

        {/* "gün serisi!" text */}
        <Text style={styles.streakLabel}>gün serisi!</Text>

        {/* Horizontal day labels */}
        <View style={styles.daysContainer}>
          {weekDays.map((day, index) => (
            <View key={day.dateString} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{day.dayName}</Text>
            </View>
          ))}
        </View>

        {/* Horizontal circles with fire emojis */}
        <View style={styles.circlesContainer}>
          {weekDays.map((day, index) => (
            <View key={day.dateString} style={styles.circleItem}>
              <View style={[styles.circle, day.hasStreak && styles.circleActive]}>
                {day.hasStreak && <Text style={styles.fireIcon}>🔥</Text>}
              </View>
            </View>
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
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'center',
  },
  navRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
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
  fireContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  fireEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  streakCount: {
    fontSize: 72,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  streakLabel: {
    fontSize: 24,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  circleItem: {
    flex: 1,
    alignItems: 'center',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  fireIcon: {
    fontSize: 24,
  },
});
