# Hello Sara — Native Android Module (Wake-word + System Overlay)

This folder is an Expo **config plugin** scaffold. It doesn't run in Expo Go —
after adding it you must build a native dev/prod client.

## What it adds
- Permissions: `SYSTEM_ALERT_WINDOW`, `FOREGROUND_SERVICE(_MICROPHONE)`,
  `RECORD_AUDIO`, `WAKE_LOCK`, `POST_NOTIFICATIONS`.
- Foreground `WakeWordService` — keeps the mic hot for a wake-word ("Hey Sara").
- `OverlayActivity` — always-on-top mic bubble that follows the user across
  other apps and deep-links back into `/chat?autostart=1` on tap.

## How to enable
1. Add the plugin to `app.json`:
   ```json
   "plugins": [
     "expo-router",
     ["expo-splash-screen", {...}],
     ["expo-speech-recognition", {...}],
     "./plugins/hello-sara-native/app.plugin.js"
   ]
   ```
2. Prebuild + build:
   ```bash
   npx expo prebuild --clean
   # then via EAS
   eas build --profile development --platform android
   ```
3. On first launch of the dev build, the app will prompt the user for
   "Display over other apps" permission (opens Android Settings).
4. Drop a Porcupine `.ppn` model (or Vosk model) into `android/app/src/main/assets/`
   and wire it inside `WakeWordService.kt` at the marked TODO — no more code
   changes needed on the JS side; the service will broadcast
   `com.hellosara.WAKE` and `AuthContext`/`FloatingAssistant` can subscribe
   via a native event listener (add later via `expo-modules-core`).

## Why not shipped inside Expo Go?
Expo Go is a shared client — it cannot host custom native code. Every part of
this feature (foreground mic, TYPE_APPLICATION_OVERLAY window, Kotlin service)
requires the real APK from your Expo account. Everything else in Hello Sara
already works in Expo Go.
