import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile, getAvatarSource, type AvatarId, VALID_AVATARS } from '@/lib/profile-storage';
import { getUnlockedAvatars } from '@/lib/avatar-unlocks';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [unlockedAvatars, setUnlockedAvatars] = useState<AvatarId[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profil</Text>

        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : (
          <>
            {/* Section 1: Current Avatar + Username */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                {avatarSource ? (
                  <Image
                    source={avatarSource}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatar}>
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
                <Text style={styles.name}>{displayName}</Text>
              </View>
            </View>

            {/* Section 2: All Avatars Grid */}
            <View style={styles.avatarsSection}>
              <Text style={styles.sectionTitle}>Avatarlar</Text>
              <View style={styles.avatarGrid}>
                {VALID_AVATARS.map((id) => {
                  const isUnlocked = unlockedAvatars.includes(id);
                  const isSelected = avatarId === id;
                  const source = getAvatarSource(id);

                  return (
                    <Pressable
                      key={id}
                      style={[
                        styles.gridAvatarContainer,
                        isSelected && styles.gridAvatarContainerSelected,
                        !isUnlocked && styles.gridAvatarContainerLocked,
                      ]}
                      onPress={() => {
                        if (isUnlocked && !isSaving) {
                          handleAvatarSelect(id);
                        }
                      }}
                      disabled={!isUnlocked || isSaving}
                    >
                      {source && (
                        <Image
                          source={source}
                          style={[
                            styles.gridAvatarImage,
                            !isUnlocked && styles.gridAvatarImageLocked,
                          ]}
                          contentFit="cover"
                        />
                      )}
                      {isSelected && isUnlocked && (
                        <View style={styles.gridCheckmark}>
                          <Text style={styles.gridCheckmarkText}>✓</Text>
                        </View>
                      )}
                      {!isUnlocked && (
                        <View style={styles.gridLockOverlay}>
                          <Text style={styles.gridLockIcon}>🔒</Text>
                        </View>
                      )}
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
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
    backgroundColor: Colors.light.background,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  gridAvatarContainer: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  gridAvatarContainerSelected: {
    borderColor: Colors.light.tint,
  },
  gridAvatarContainerLocked: {
    opacity: 0.6,
  },
  gridAvatarImage: {
    width: '100%',
    height: '100%',
  },
  gridAvatarImageLocked: {
    opacity: 0.5,
  },
  gridCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridCheckmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
  },
  gridLockIcon: {
    fontSize: 24,
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

