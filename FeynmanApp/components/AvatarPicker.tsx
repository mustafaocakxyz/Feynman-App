import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { AvatarId, VALID_AVATARS, getAvatarSource } from '@/lib/profile-storage';

type AvatarPickerProps = {
  visible: boolean;
  selectedAvatarId: AvatarId | null;
  unlockedAvatars: AvatarId[];
  onSelect: (avatarId: AvatarId) => void;
  onClose: () => void;
};

export function AvatarPicker({ visible, selectedAvatarId, unlockedAvatars, onSelect, onClose }: AvatarPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Avatar Seç</Text>
          
          <View style={styles.avatarGrid}>
            {VALID_AVATARS.map((avatarId) => {
              const isSelected = selectedAvatarId === avatarId;
              const isUnlocked = unlockedAvatars.includes(avatarId);
              const source = getAvatarSource(avatarId);
              
              return (
                <Pressable
                  key={avatarId}
                  style={[
                    styles.avatarContainer,
                    isSelected && styles.avatarContainerSelected,
                    !isUnlocked && styles.avatarContainerLocked,
                  ]}
                  onPress={() => {
                    if (isUnlocked) {
                      onSelect(avatarId);
                      onClose();
                    }
                  }}
                  disabled={!isUnlocked}
                >
                  {source && (
                    <Image
                      source={source}
                      style={[
                        styles.avatarImage,
                        !isUnlocked && styles.avatarImageLocked,
                      ]}
                      contentFit="cover"
                    />
                  )}
                  {isSelected && isUnlocked && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                  {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarContainerSelected: {
    borderColor: Colors.light.tint,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarImageLocked: {
    opacity: 0.5,
  },
  avatarContainerLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 40,
  },
  lockIcon: {
    fontSize: 24,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.icon + '20',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
});

