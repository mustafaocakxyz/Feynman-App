import { Tabs } from 'expo-router';
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

type TabIconProps = {
  source: any;
  focused: boolean;
};

function TabIcon({ source, focused }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Image
        source={source}
        style={[
          styles.icon,
          {
            transform: [{ scale: focused ? 1.12 : 1.0 }],
            opacity: focused ? 1.0 : 0.65,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

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
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/3d_home.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/3d_quiz.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/3d_person.png')} focused={focused} />
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    width: 34,
    height: 34,
  },
});
