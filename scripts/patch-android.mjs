// Small changes to the generated Android project (android/), applied on every build.
// Usage: VERSION_CODE=12 VERSION_NAME=1.0.12 node scripts/patch-android.mjs
import fs from "node:fs";

function edit(file, fn) {
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after === before) throw new Error("Nothing changed in " + file + " — the Android template may have changed.");
  fs.writeFileSync(file, after);
  console.log("patched", file);
}

// 1. Background checker: its engine ships as a local library (from the plugin's own install steps).
edit("android/app/build.gradle", (s) => {
  if (s.includes("@capacitor/background-runner/android/src/main/libs")) return s + "\n";
  return s.replace(
    /flatDir\s*\{\s*dirs\s+([^\n]+)/,
    (m, rest) => `flatDir{\n        dirs ${rest}\n        dirs '../../node_modules/@capacitor/background-runner/android/src/main/libs', 'libs'`
  );
});

// 2. Version shown in Google Play (code must grow with every upload).
const code = parseInt(process.env.VERSION_CODE || "1", 10);
const name = process.env.VERSION_NAME || "1.0." + code;
edit("android/app/build.gradle", (s) =>
  s.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`)
);

// 3. Release signing with the upload key (passed in by the GitHub workflow, never stored in the code).
edit("android/app/build.gradle", (s) => {
  if (s.includes("signingConfigs {")) return s + "\n";
  const signing = `
    signingConfigs {
        release {
            storeFile file(System.getenv("CRITICAVG_KEYSTORE") ?: "missing.keystore")
            storePassword System.getenv("CRITICAVG_KEYSTORE_PASSWORD")
            keyAlias System.getenv("CRITICAVG_KEY_ALIAS")
            keyPassword System.getenv("CRITICAVG_KEY_PASSWORD")
        }
    }
    buildTypes {`;
  return s
    .replace(/\n\s*buildTypes\s*\{/, signing)
    .replace(/release\s*\{\s*minifyEnabled/, "release {\n            signingConfig signingConfigs.release\n            minifyEnabled");
});

// 4. Android 13+: permission to show the "now streaming" notifications.
edit("android/app/src/main/AndroidManifest.xml", (s) => {
  if (s.includes("android.permission.POST_NOTIFICATIONS")) return s + "\n";
  return s.replace(
    /<\/manifest>\s*$/,
    '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n</manifest>\n'
  );
});
