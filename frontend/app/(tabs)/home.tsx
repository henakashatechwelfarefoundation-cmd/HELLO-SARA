import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/src/components/AuroraBackground';
import { MicButton } from '@/src/components/MicButton';
import { SaraOrb } from '@/src/components/SaraOrb';
import { useAuth } from '@/src/auth/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';

export default function HomeScreen() {
  const { palette, spacing, fontSize, fontWeight } = useTheme();
  const { user } = useAuth();
  const [listening, setListening] = useState(false);

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }} testID="home-screen">
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header(spacing)}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.onSurfaceSecondary, fontSize: fontSize.base }}>
              {greeting}, {user?.name?.split(' ')[0] || 'friend'}
            </Text>
            <Text style={{ color: palette.onSurface, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: 4 }}>
              Hello, I&apos;m Sara
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            testID="home-settings-button"
            style={{
              width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
              backgroundColor: palette.surfaceSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border,
            }}
          >
            <Ionicons name="settings-outline" size={20} color={palette.onSurface} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: spacing.xl }} />

          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <SaraOrb size={240} active={listening} />
          </View>

          <View style={{ alignItems: 'center', paddingHorizontal: spacing.xl }}>
            <Text style={{
              color: palette.onSurface, fontSize: fontSize.xl, fontWeight: fontWeight.semibold, textAlign: 'center',
            }}>
              How can I help you today?
            </Text>
            <Text style={{
              color: palette.onSurfaceSecondary, fontSize: fontSize.base, textAlign: 'center', marginTop: spacing.sm,
              maxWidth: 320, lineHeight: 22,
            }}>
              {listening ? 'Listening…' : 'Tap the microphone to start a conversation.'}
            </Text>
          </View>

          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <MicButton
              active={listening}
              onPress={() => setListening((v) => !v)}
              testID="home-mic-button"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = {
  header: (sp: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: sp.xl,
    paddingTop: sp.md,
    paddingBottom: sp.sm,
  }),
};
