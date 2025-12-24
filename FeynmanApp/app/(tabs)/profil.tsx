import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile, getAvatarSource, type AvatarId, VALID_AVATARS } from '@/lib/profile-storage';
import { getUnlockedAvatars } from '@/lib/avatar-unlocks';
import { useTheme } from '@/contexts/theme-context';

const AVATAR_DESCRIPTIONS: Record<AvatarId, string> = {
  '1': 'Kaydolduğunda açılır',
  '2': 'Kaydolduğunda açılır',
  '3': 'Kaydolduğunda açılır',
  '4': 'Açmak için 1000XP topla.',
  '5': 'Açmak için 3 gün seri yap.',
};

const AVATAR_LABELS: Record<AvatarId, string> = {
  '1': 'Avatar 1',
  '2': 'Avatar 2',
  '3': 'Avatar 3',
  '4': 'XP Kasıyorum',
  '5': 'İstikrarlı',
};

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const { theme } = useTheme();
  const [profileName, setProfileName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [unlockedAvatars, setUnlockedAvatars] = useState<AvatarId[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const colors = Colors[theme];

  // Load profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      const loadProfile = async () => {
        try {
          setIsLoadingProfile(true);
          const [profile, unlocked] = await Promise.all([
            getProfile(user.id),
            getUnlockedAvatars(user.id),
          ]);
          setProfileName(profile.name || '');
          setAvatarId(profile.avatarId);
          setUnlockedAvatars(unlocked);
        } catch (error) {
          console.error('Profile yüklenirken hata:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };

      loadProfile();
    }, [user?.id])
  );

  const handleAvatarSelect = async (selectedAvatarId: AvatarId) => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      await updateProfile(user.id, { avatarId: selectedAvatarId });
      setAvatarId(selectedAvatarId);
    } catch (error) {
      console.error('Avatar kaydedilirken hata:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const avatarSource = getAvatarSource(avatarId);
  const displayName = profileName || user?.user_metadata?.name || 'Kullanıcı';
  const displayInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Profil</Text>

        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : (
          <>
            {/* Section 1: Current Avatar + Username */}
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.avatarContainer}>
                {avatarSource ? (
                  <Image
                    source={avatarSource}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
              <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
                <Text style={styles.avatarText}>{displayInitial}</Text>
              </View>
                )}
                {isSaving && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </View>

              {/* Name */}
              <View style={styles.nameContainer}>
                <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
              </View>
            </View>

            {/* Section 2: Dark Mode Toggle - Temporarily hidden */}
            {/* <View style={[styles.settingsCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Karanlık Mod</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {theme === 'dark' ? 'Karanlık tema aktif' : 'Açık tema aktif'}
                  </Text>
                </View>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={() => toggleTheme()}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={theme === 'dark' ? '#ffffff' : '#f4f3f4'}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View> */}

            {/* Section 3: All Avatars Grid */}
            <View style={styles.avatarsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Avatarlar</Text>
              <View style={styles.avatarList}>
                {VALID_AVATARS.map((id) => {
                  const isUnlocked = unlockedAvatars.includes(id);
                  const isSelected = avatarId === id;
                  const source = getAvatarSource(id);
                  const description = AVATAR_DESCRIPTIONS[id];
                  const label = AVATAR_LABELS[id];

                  return (
                    <Pressable
                      key={id}
                      style={[
                        styles.listItem,
                        { backgroundColor: colors.cardBackground },
                        isUnlocked && isSelected && { borderColor: colors.tint },
                        !isUnlocked && styles.listItemLocked,
                      ]}
                      onPress={() => {
                        if (isUnlocked && !isSaving) {
                          handleAvatarSelect(id);
                        }
                      }}
                      disabled={!isUnlocked || isSaving}
                    >
                      <View style={styles.listAvatarWrapper}>
                        {source && (
                          <Image
                            source={source}
                            style={[
                              styles.listAvatarImage,
                              !isUnlocked && styles.listAvatarImageLocked,
                            ]}
                            contentFit="cover"
                          />
                        )}
                        {!isUnlocked && (
                          <View style={styles.listLockBadge}>
                            <Text style={styles.listLockText}>🔒</Text>
                          </View>
                        )}
                        {isUnlocked && isSelected && (
                          <View style={[styles.listCheckBadge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.listCheckText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.listTextContainer}>
                        <Text style={[styles.listTitle, { color: colors.text }]}>{label}</Text>
                        <Text style={[styles.listDescription, { color: colors.textSecondary }]}>{description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
            (loading || isLoadingProfile) && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={loading || isLoadingProfile}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 32,
    gap: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    gap: 16,
  },
  settingsCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editHint: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  nameEditContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.tint,
    paddingVertical: 4,
    minWidth: 200,
  },
  email: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  avatarsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarList: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  listItemLocked: {
    opacity: 0.75,
  },
  listAvatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  listAvatarImage: {
    width: '100%',
    height: '100%',
  },
  listAvatarImageLocked: {
    opacity: 0.45,
  },
  listLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  listLockText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  listCheckText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listTextContainer: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  listDescription: {
    fontSize: 14,
  },
  listStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  listStatusUnlocked: {
    color: '#16a34a',
  },
  listStatusLocked: {
    color: '#b91c1c',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

