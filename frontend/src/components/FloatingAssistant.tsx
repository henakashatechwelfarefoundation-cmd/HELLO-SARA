import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ChatApi } from '@/src/api/client';
import { useTheme } from '@/src/theme/ThemeContext';
import { executeIntent, parseIntent } from '@/src/voice/commandRouter';
import { useTorch } from '@/src/voice/useTorch';
import {
  isRecognitionSupported, speak, startRecognition, stopSpeaking,
} from '@/src/voice/voice';

/**
 * Floating assistant — persistent in-app mic that lives above every screen.
 * Tap once to listen, tap again to stop. Executes device commands directly
 * or falls back to /chat when the intent is conversational.
 *
 * True "display over other apps" (system overlay across Android) needs the
 * SYSTEM_ALERT_WINDOW permission and a native service — that's queued for a
 * dev-build iteration. In-app the assistant works everywhere.
 */
const HIDDEN_ON: string[] = ['/', '/auth', '/onboarding'];

export const FloatingAssistant: React.FC = () => {
  const { palette, radius, fontSize } = useTheme();
  const { controller: torch, PortalNode } = useTorch();
  const pathname = usePathname();
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const scale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.6, transform: [{ scale: 1 + glow.value * 0.35 }] }));

  useEffect(() => {
    glow.value = withTiming(listening ? 1 : 0, { duration: 400 });
  }, [listening, glow]);

  const handleChat = useCallback(async (text: string) => {
    setStatus('Thinking…');
    try {
      const res = await ChatApi.send([{ role: 'user', content: text }]);
      setStatus(res.reply.slice(0, 120));
      speak(res.reply);
    } catch (e: any) {
      setStatus(e?.detail || 'Could not reach your AI provider.');
    } finally {
      setTimeout(() => setStatus(null), 4000);
    }
  }, []);

  const run = useCallback(async (transcript: string) => {
    const intent = parseIntent(transcript);
    setStatus(`"${transcript}"`);
    const res = await executeIntent(intent, { torch, onChat: handleChat });
    if (res.intent.type !== 'chat') {
      setStatus(res.message);
      setTimeout(() => setStatus(null), 3500);
    }
  }, [torch, handleChat]);

  const stopListening = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setListening(false);
    setPartial('');
  }, []);

  const startListening = useCallback(async () => {
    if (listening) return stopListening();
    setStatus(null);
    if (!isRecognitionSupported()) {
      setStatus('Voice needs a native build. Opening Chat instead…');
      router.push({ pathname: '/chat', params: { autostart: '0' } });
      setTimeout(() => setStatus(null), 3500);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setListening(true);
    const stop = await startRecognition({
      onPartial: (t) => setPartial(t),
      onFinal: (t) => { setPartial(''); setListening(false); run(t); },
      onError: (m) => { setStatus(m); setListening(false); setPartial(''); },
      onStateChange: (s) => { if (s === 'idle') setListening(false); },
    }, { interim: true, lang: 'en-US' });
    stopRef.current = stop;
  }, [listening, stopListening, run]);

  const onPressIn = () => { scale.value = withSpring(0.9); };
  const onPressOut = () => { scale.value = withSpring(1); };

  // Hide on splash/auth/onboarding screens.
  if (HIDDEN_ON.includes(pathname || '')) return null;

  return (
    <>
      <PortalNode />
      <View pointerEvents="box-none" style={styles.container}>
        {status || partial ? (
          <View style={[styles.bubble, { backgroundColor: palette.surfaceSecondary, borderColor: palette.border }]}>
            <Text style={{ color: palette.onSurface, fontSize: fontSize.sm }} numberOfLines={3}>
              {partial ? `“${partial}”` : status}
            </Text>
          </View>
        ) : null}
        <Animated.View style={[styles.glow, glowStyle, { backgroundColor: palette.brand, borderRadius: radius.pill }]} />
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={startListening}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            testID="floating-assistant-button"
            style={{
              width: 60, height: 60, borderRadius: 30, overflow: 'hidden',
              shadowColor: palette.brand, shadowOpacity: 0.6, shadowRadius: 18, elevation: 12,
            }}
          >
            <LinearGradient
              colors={[palette.brand, palette.brandSecondary]}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={listening ? 'stop' : 'mic'} size={26} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: Platform.select({ ios: 100, android: 90, default: 90 }),
    zIndex: 999,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubble: {
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  glow: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 52,
    height: 52,
    opacity: 0.4,
  },
});
