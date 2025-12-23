import { Tabs } from 'expo-router';
import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {

  const tabBackground = '#10142b';
  const sceneBackground = '#0b102d';

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#bfdbfe',
        tabBarStyle: {
          backgroundColor: tabBackground,
          borderTopWidth: 2,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          height: 76,
          paddingTop: 8,
          paddingBottom: 14,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopColor: 'rgba(255,255,255,0.2)',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)', 'transparent']}
              locations={[0, 0.4, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ height: 6, width: '100%' }}
            />
            <View style={{ flex: 1, backgroundColor: tabBackground }} />
          </View>
        ),
        tabBarShowLabel: false,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/3d_home.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/3d_quiz.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/3d_person.png')}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="xp"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
