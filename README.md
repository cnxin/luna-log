# Luna Log

Luna Log is a local-first mobile app demo for private intimacy, menstrual cycle, and body-state tracking. It is built with Expo SDK 57 and React Native, with a phone-shaped web preview for fast UI iteration plus Android/iOS targets for app builds.

## Current Scope

- Home timeline for recent intimacy, period, and symptom records.
- LifeLog-inspired calendar layout with selected-date status cards.
- Menstrual cycle tracking with period, fertile window, ovulation, and prediction markers.
- Separate partnered sex and solo sex add buttons.
- Aphrodite-inspired intimacy forms with duration, protection, positions, mood, orgasm, toys, notes, and timer support.
- Weekly, monthly, and yearly statistics with partnered/solo split colors and time distribution.
- Three visual themes: classic, mint, and blue.
- About screen opened from the top-right icon, including version info, update checking, release notes, download links, and source diagnostics.
- Local-first storage through AsyncStorage.

## Project

- Repository: `https://github.com/cnxin/luna-log`
- App name: `Luna Log`
- Expo slug: `luna-log`
- Current version: `1.0.0`

## Development

```bash
npm install
npm run web:preview
```

The web preview runs on `http://127.0.0.1:8090` by default.

Other useful commands:

```bash
npm run web
npm run android
npm run ios
npx tsc --noEmit
```

## Android APK Build

This project can build a local Android APK through the generated native Android project:

```bash
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```

The release APK is generated at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

For local debug installation, use:

```bash
cd android
.\gradlew.bat assembleDebug
```

The debug APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Update Manifest

The app checks `update-manifest.json` from GitHub raw first, then jsDelivr as a fallback:

```text
https://raw.githubusercontent.com/cnxin/luna-log/master/update-manifest.json
https://cdn.jsdelivr.net/gh/cnxin/luna-log@master/update-manifest.json
```

When publishing a new build, update these files together:

- `package.json`
- `app.json`
- `APP_VERSION` in `App.tsx`
- `update-manifest.json`

The update center is intentionally lightweight. It does not use native OTA installation yet; it compares manifest versions and opens the release/download URL.

## Notes

This is a demo app and keeps data on-device. It is not a medical diagnosis tool and should not be used as the only source for health decisions.
