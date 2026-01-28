const { withMainApplication, withAndroidManifest, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withLiveKitInit = (config) => {
  return withMainApplication(config, async (config) => {
    const importStatement = "import com.livekit.reactnative.LiveKitReactNative";
    const initStatement = "LiveKitReactNative.setup(this)";

    if (!config.modResults.contents.includes(importStatement)) {
      // Add import
      config.modResults.contents = config.modResults.contents.replace(
        /package\s+[\w.]+/,
        (match) => `${match}\n\n${importStatement}`
      );
    }

    if (!config.modResults.contents.includes(initStatement)) {
      // Add init in onCreate
      if (config.modResults.language === 'java') {
        const onCreatePattern = /super\.onCreate\(\);/;
        if (config.modResults.contents.includes('super.onCreate();')) {
             config.modResults.contents = config.modResults.contents.replace(
                onCreatePattern,
                `super.onCreate();\n    ${initStatement};`
            );
        }
      } else {
        // Kotlin
        const onCreatePattern = /super\.onCreate\(\)/;
         if (config.modResults.contents.includes('super.onCreate()')) {
             config.modResults.contents = config.modResults.contents.replace(
                onCreatePattern,
                `super.onCreate()\n    ${initStatement}`
            );
        }
      }
    }
    return config;
  });
};

const withLiveKitPermissions = (config) => {
    return withAndroidManifest(config, async (config) => {
        const permissions = [
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.MODIFY_AUDIO_SETTINGS",
            "android.permission.BLUETOOTH_CONNECT" // Needed for Android 12+
        ];

        permissions.forEach(permission => {
            AndroidConfig.Permissions.addPermission(config.modResults, permission);
        });

        return config;
    });
};

const withLiveKit = (config) => {
   return withPlugins(config, [
       withLiveKitInit,
       withLiveKitPermissions
   ]);
};

module.exports = withLiveKit;
