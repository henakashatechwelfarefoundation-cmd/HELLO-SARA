import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeviceApi } from '@/src/api/client';
import { AuroraBackground } from '@/src/components/AuroraBackground';
import { SettingsHeader } from '@/src/components/SettingsHeader';
import { useTheme } from '@/src/theme/ThemeContext';

/**
 * Device Control (Phase 4).
 *
 * Expo Go cannot execute low-level Android controls (flashlight, wifi, alarms).
 * The commands are logged to /api/device/commands so voice-triggered intents
 * are auditable; a future native module will consume them and execute.
 *
 * The two actions that DO work today are:
 *   - "Call"     -> `tel:` intent via Linking
 *   - "SMS"      -> `sms:` intent via Linking
 *   - "Email"    -> `mailto:` intent via Linking
 * Everything else logs the intent and shows a "Requires native build" tag.
 */

interface Action {
  key: string;
  icon: any;
  label: string;
  category: 'communication' | 'device' | 'alarm';
  execute?: () => void | Promise<void>;
  requiresNative?: boolean;
}

export default function DeviceControlScreen() {
  const { palette, spacing, fontSize, fontWeight, radius } = useTheme();
  const [busy, setBusy] = useState<string | null>(null);

  const log = async (action: string, status: string, payload: object = {}) => {
    try { await DeviceApi.logCommand({ action, payload, status }); } catch {}
  };

  const openLink = async (url: string, action: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        await log(action, 'executed', { url });
      } else {
        await log(action, 'unsupported', { url });
        Alert.alert('Not supported', 'Your device cannot open this link.');
      }
    } catch {
      await log(action, 'failed', { url });
    }
  };

  const stub = async (action: string, label: string) => {
    setBusy(action);
    await log(action, 'unsupported');
    setTimeout(() => setBusy(null), 400);
    Alert.alert(
      'Requires native build',
      `"${label}" needs a development build to execute on your device. The intent has been logged.`,
    );
  };

  const ACTIONS: Action[] = [
    { key: 'call', icon: 'call', label: 'Call someone', category: 'communication', execute: () => openLink('tel:', 'call') },
    { key: 'sms', icon: 'chatbubble', label: 'Send SMS', category: 'communication', execute: () => openLink('sms:', 'sms') },
    { key: 'email', icon: 'mail', label: 'Send email', category: 'communication', execute: () => openLink('mailto:', 'email') },
    { key: 'flashlight_on', icon: 'flashlight', label: 'Flashlight on', category: 'device', requiresNative: true },
    { key: 'flashlight_off', icon: 'flashlight-outline' as any, label: 'Flashlight off', category: 'device', requiresNative: true },
    { key: 'volume_up', icon: 'volume-high', label: 'Volume up', category: 'device', requiresNative: true },
    { key: 'volume_down', icon: 'volume-low', label: 'Volume down', category: 'device', requiresNative: true },
    { key: 'volume_mute', icon: 'volume-mute', label: 'Mute', category: 'device', requiresNative: true },
    { key: 'wifi_toggle', icon: 'wifi', label: 'Toggle Wi-Fi', category: 'device', requiresNative: true },
    { key: 'bluetooth_toggle', icon: 'bluetooth', label: 'Toggle Bluetooth', category: 'device', requiresNative: true },
    { key: 'brightness_up', icon: 'sunny', label: 'Brightness up', category: 'device', requiresNative: true },
    { key: 'brightness_down', icon: 'moon', label: 'Brightness down', category: 'device', requiresNative: true },
    { key: 'alarm_set', icon: 'alarm', label: 'Set alarm', category: 'alarm', requiresNative: true },
    { key: 'timer_set', icon: 'timer', label: 'Set timer', category: 'alarm', requiresNative: true },
    { key: 'dnd_toggle', icon: 'moon-outline', label: 'Do Not Disturb', category: 'device', requiresNative: true },
    { key: 'lock_screen', icon: 'lock-closed', label: 'Lock screen', category: 'device', requiresNative: true },
  ];

  const grouped: Record<string, Action[]> = { communication: [], device: [], alarm: [] };
  for (const a of ACTIONS) grouped[a.category].push(a);
  const groupTitles: Record<string, string> = {
    communication: 'Communication',
    device: 'Device Controls',
    alarm: 'Alarms & Timers',
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }} testID="device-screen">
      <AuroraBackground />
      <SettingsHeader title="Device Control" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: 100 }}>
        <Text style={{ color: palette.onSurfaceSecondary, fontSize: fontSize.base, lineHeight: 20 }}>
          Trigger phone controls by tap or by voice (once wake-word is enabled). Some actions require a native build — those log the intent so Sara knows what you tried.
        </Text>

        {Object.entries(grouped).map(([cat, list]) => (
          <View key={cat} style={{ gap: spacing.sm }}>
            <Text style={{
              color: palette.onSurfaceSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
              letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: spacing.sm,
            }}>
              {groupTitles[cat]}
            </Text>
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
            }}>
              {list.map((a) => (
                <Pressable
                  key={a.key}
                  onPress={() => (a.execute ? a.execute() : stub(a.key, a.label))}
                  disabled={busy === a.key}
                  testID={`device-action-${a.key}`}
                  style={{
                    width: '47%', padding: spacing.lg, borderRadius: radius.md,
                    backgroundColor: palette.surfaceSecondary,
                    borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border,
                    gap: spacing.sm,
                    opacity: busy === a.key ? 0.6 : 1,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: palette.brandTertiary + '40',
                  }}>
                    <Ionicons name={a.icon} size={20} color={palette.brand} />
                  </View>
                  <Text style={{ color: palette.onSurface, fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
                    {a.label}
                  </Text>
                  {a.requiresNative ? (
                    <Text style={{
                      color: palette.onSurfaceTertiary, fontSize: 10, fontWeight: fontWeight.medium,
                      backgroundColor: palette.surfaceTertiary,
                      alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                    }}>
                      Needs native build
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
