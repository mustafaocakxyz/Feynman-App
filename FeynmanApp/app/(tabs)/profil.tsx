import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { getProfile, updateProfile, getAvatarSource, type AvatarId } from '@/lib/profile-storage';
import { AvatarPicker } from '@/components/AvatarPicker';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const [profileName, setProfileName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
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
          const profile = await getProfile(user.id);
          setProfileName(profile.name || '');
          setAvatarId(profile.avatarId);
        } catch (error) {
          console.error('Profile yüklenirken hata:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      };

      loadProfile();
    }, [user?.id])
  );

  const handleSaveName = async () => {
    if (!user?.id || !profileName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(user.id, { name: profileName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('İsim kaydedilirken hata:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
      <View style={styles.content}>
        <Text style={styles.title}>Profil</Text>

        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : (
          <View style={styles.profileCard}>
            {/* Avatar */}
            <Pressable
              style={styles.avatarContainer}
              onPress={() => setShowAvatarPicker(true)}
              disabled={isSaving}
            >
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
            </Pressable>

            {/* Name */}
            <View style={styles.nameContainer}>
              {isEditingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="İsminizi girin"
                    autoFocus
                    onSubmitEditing={handleSaveName}
                    onBlur={handleSaveName}
                    editable={!isSaving}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => setIsEditingName(true)}
                  disabled={isSaving}
                >
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.editHint}>Düzenlemek için dokunun</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.email}>{user?.email}</Text>
          </View>
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
      </View>

      <AvatarPicker
        visible={showAvatarPicker}
        selectedAvatarId={avatarId}
        onSelect={handleAvatarSelect}
        onClose={() => setShowAvatarPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
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
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 32,
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

