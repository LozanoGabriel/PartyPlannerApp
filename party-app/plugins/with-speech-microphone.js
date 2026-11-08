const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withSpeechMicrophone(config) {
  return withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    const name = "android.permission.RECORD_AUDIO";
    const permissions = manifest["uses-permission"] || [];
    const remaining = permissions.filter(
      (permission) => permission.$["android:name"] !== name || permission.$["tools:node"] !== "remove"
    );
    if (!remaining.some((permission) => permission.$["android:name"] === name)) {
      remaining.push({ $: { "android:name": name } });
    }
    manifest["uses-permission"] = remaining;
    return result;
  });
};
