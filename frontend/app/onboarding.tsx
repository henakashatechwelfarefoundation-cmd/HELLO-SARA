import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions, FlatList, StyleSheet, Text, View, ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/src/components/AuroraBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAuth } from '@/src/auth/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  { key: 'voice', icon: 'mic-circle', title: 'Voice Assistant', body: 'Natural conversations with a hands-free wake word — coming in Phase 2.' },
  { key: 'memory', icon: 'sparkles', title: 'Personal Memory', body: 'Sara remembers what matters to you — always on your terms.' },
  { key: 'productivity', icon: 'calendar', title: 'Calendar & Reminders', body: 'Plan your day, capture ideas, and never miss a beat.' },
  { key: 'phone', icon: 'call', title: 'Phone Control', body: 'Call, message, and control your device with your voice.' },
  { key: 'learning', icon: 'bulb', title: 'Learns With You', body: 'Adapts to your routines and preferences over time.' },
  { key: 'privacy', icon: 'lock-closed', title: 'Privacy First', body: 'You control every permission. Nothing is accessed without your consent.' },
];

export default function OnboardingScreen() {
  const { palette, spacing, fontSize, fontWeight } = useTheme();
  const { markOnboardingDone } = useAuth();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setIndex(viewableItems[0].index);
    }
  }).current;

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await markOnboardingDone();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: palette.onSurface, fontSize: fontSize.lg, fontWeight: fontWeight.semibold }}>
            Meet Sara
          </Text>
          <Text
            onPress={finish}
            style={{ color: palette.onSurfaceSecondary, fontSize: fontSize.base, fontWeight: fontWeight.medium }}
            testID="onboarding-skip"
          >
            Skip
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={{ width, paddingHorizontal: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
              <GlassCard style={{ width: '100%', maxWidth: 420 }} padding={spacing.xl}>
                <View style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg }}>
                  <View style={{
                    width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: palette.brandTertiary + '55',
                  }}>
                    <Ionicons name={item.icon} size={48} color={palette.brand} />
                  </View>
                  <Text style={{ color: palette.onSurface, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, textAlign: 'center' }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: palette.onSurfaceSecondary, fontSize: fontSize.lg, textAlign: 'center', lineHeight: 24 }}>
                    {item.body}
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}
        />

        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === index ? 24 : 8, height: 8, borderRadius: 4,
                  backgroundColor: i === index ? palette.brand : palette.surfaceTertiary,
                }}
              />
            ))}
          </View>
          <PrimaryButton
            label={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            onPress={next}
            testID="onboarding-next-button"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({});
