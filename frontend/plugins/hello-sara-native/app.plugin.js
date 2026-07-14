// Expo config plugin for the Hello Sara native Android module.
// Adds SYSTEM_ALERT_WINDOW + FOREGROUND_SERVICE permissions, registers the
// wake-word foreground service, and declares the overlay activity.
// After adding this plugin to app.json, run `expo prebuild --clean` and
// build a dev client (`eas build --profile development`) to get the native
// wake-word listener + always-on-top mic bubble on Android.

const { withAndroidManifest, withPlugins, AndroidConfig } = require('@expo/config-plugins');

function addPermissions(config) {
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
    'android.permission.RECORD_AUDIO',
    'android.permission.WAKE_LOCK',
    'android.permission.POST_NOTIFICATIONS',
  ]);
}

function addServiceAndActivity(config) {
  return withAndroidManifest(config, async (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    app.service = app.service || [];
    const already = app.service.find(
      (s) => s.$?.['android:name'] === '.WakeWordService',
    );
    if (!already) {
      app.service.push({
        $: {
          'android:name': '.WakeWordService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'microphone',
        },
      });
    }

    app.activity = app.activity || [];
    const overlay = app.activity.find(
      (a) => a.$?.['android:name'] === '.OverlayActivity',
    );
    if (!overlay) {
      app.activity.push({
        $: {
          'android:name': '.OverlayActivity',
          'android:exported': 'false',
          'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
        },
      });
    }

    return cfg;
  });
}

module.exports = function withHelloSaraNative(config) {
  return withPlugins(config, [addPermissions, addServiceAndActivity]);
};
