import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { getXpState } from '@/lib/xp-storage';
import { useAuth } from '@/contexts/auth-context';
import { Image } from 'expo-image';
import { getAvatarSource } from '@/lib/profile-storage';

const MAX_XP = 8000;
const VISIBLE_MAX_XP = 4000; // Maximum XP shown in the visible bar area

type Milestone = {
  xp: number;
  reward: string;
  rewardImage?: any;
};

const MILESTONES: Milestone[] = [
  {
    xp: 1000,
    reward: 'Avatar 4',
    rewardImage: getAvatarSource('4'),
  },
  {
    xp: 3000,
    reward: 'Yakında',
  },
  {
    xp: 5000,
    reward: 'Yakında',
  },
  {
    xp: 7000,
    reward: 'Yakında',
  },
];

export default function XPScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentXp, setCurrentXp] = useState(0);
  const fillAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let isActive = true;

      const loadXp = async () => {
        const xpState = await getXpState(user.id);
        if (!isActive) return;
        // Round to nearest 5 for smoother animation
        const roundedXp = Math.floor(xpState.total / 5) * 5;
        setCurrentXp(roundedXp);
        
        // Animate fill - use MAX_XP for full range
        const fillPercentage = Math.min(roundedXp / MAX_XP, 1);
        Animated.timing(fillAnim, {
          toValue: fillPercentage,
          duration: 800,
          useNativeDriver: false,
        }).start();

        // Scroll to last unlocked milestone position (centered) after a short delay
        setTimeout(() => {
          if (scrollViewRef.current && isActive) {
            const PROGRESS_BAR_HEIGHT = (MAX_XP / VISIBLE_MAX_XP) * 500;
            const CONTAINER_HEIGHT = 500;
            const maxScrollY = PROGRESS_BAR_HEIGHT - CONTAINER_HEIGHT;
            
            // Find last unlocked milestone
            const unlockedMilestones = MILESTONES.filter(m => roundedXp >= m.xp);
            let targetXp: number;
            
            if (unlockedMilestones.length > 0) {
              // Use last unlocked milestone's XP - 300
              const lastMilestone = unlockedMilestones[unlockedMilestones.length - 1];
              targetXp = Math.max(0, lastMilestone.xp - 300);
            } else {
              // Fallback to current XP - 300, with security check
              targetXp = Math.max(0, roundedXp - 300);
            }
            
            // Calculate scroll position to show target XP at the bottom of viewport
            const targetXpPositionFromBottom = (targetXp / MAX_XP) * PROGRESS_BAR_HEIGHT;
            const scrollY = maxScrollY - targetXpPositionFromBottom;
            
            // Ensure we don't scroll above the top or below the bottom
            const clampedScrollY = Math.max(0, Math.min(maxScrollY, scrollY));
            
            scrollViewRef.current.scrollTo({
              y: clampedScrollY,
              animated: true,
            });
          }
        }, 100);
      };

      loadXp();

      return () => {
        isActive = false;
      };
    }, [user?.id, fillAnim]),
  );

  // Calculate fill height based on animation value
  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Fixed container height representing VISIBLE_MAX_XP range
  const CONTAINER_HEIGHT = 500; // Fixed height for viewport
  
  // Full progress bar height representing MAX_XP range
  const PROGRESS_BAR_HEIGHT = (MAX_XP / VISIBLE_MAX_XP) * CONTAINER_HEIGHT;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navRow}>
          <Pressable style={styles.backButton} onPress={() => router.push('/(tabs)' as never)}>
            <Text style={styles.backButtonText}>{'<'} Geri</Text>
          </Pressable>
        </View>

        {/* Current XP Display */}
        <View style={styles.currentXpContainer}>
          <Text style={styles.currentXpValue}>⭐ {currentXp}</Text>
          <Text style={styles.currentXpLabel}>XP</Text>
        </View>

        {/* Scrollable Progress Bar Container */}
        <View style={[styles.progressContainer, { height: CONTAINER_HEIGHT }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.progressScrollView}
            contentContainerStyle={[styles.progressScrollContent, { height: PROGRESS_BAR_HEIGHT }]}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}>
            {/* Progress Track (background) - full height representing MAX_XP */}
            <View style={[styles.progressTrack, { height: PROGRESS_BAR_HEIGHT }]}>
              {/* Animated Fill */}
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    height: fillHeight,
                  },
                ]}
              />
            </View>

            {/* Milestone Nodes - positioned relative to full progress bar */}
            {MILESTONES.map((milestone, index) => {
              const isReached = currentXp >= milestone.xp;
              
              // Calculate position based on MAX_XP (full range)
              const milestonePositionPx = (milestone.xp / MAX_XP) * PROGRESS_BAR_HEIGHT;
              const milestoneStyle: { bottom: number } = {
                bottom: milestonePositionPx,
              };

              return (
                <View
                  key={milestone.xp}
                  style={[
                    styles.milestoneNode,
                    milestoneStyle,
                  ]}>
                  {/* Node Circle */}
                  <View style={[styles.nodeCircle, isReached && styles.nodeCircleReached]}>
                    {isReached && milestone.rewardImage && (
                      <Image
                        source={milestone.rewardImage}
                        style={styles.nodeImage}
                        contentFit="cover"
                      />
                    )}
                    {!isReached && <View style={styles.nodeDot} />}
                  </View>

                  {/* Milestone Info Card */}
                  <View style={[styles.milestoneCard, isReached && styles.milestoneCardReached]}>
                    <Text style={styles.milestoneXp}>{milestone.xp} XP</Text>
                    <Text style={styles.milestoneReward}>{milestone.reward}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
  headline: {
    fontSize: 32,
    color: '#0f172a',
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'center',
  },
  currentXpContainer: {
    alignItems: 'center',
    gap: 4,
  },
  currentXpValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  currentXpLabel: {
    fontSize: 18,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
  },
  progressContainer: {
    marginTop: 24,
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressScrollView: {
    width: '100%',
  },
  progressScrollContent: {
    position: 'relative',
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: '50%',
    marginLeft: -4,
    width: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  milestoneNode: {
    position: 'absolute',
    left: '50%',
    marginLeft: -32,
    alignItems: 'center',
    zIndex: 10,
  },
  nodeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  nodeCircleReached: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  nodeImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9ca3af',
  },
  milestoneCard: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  milestoneCardReached: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  milestoneXp: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Montserrat_700Bold',
  },
  milestoneReward: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Montserrat_700Bold',
    marginTop: 2,
  },
});
