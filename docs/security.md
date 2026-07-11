# Security and Data Protection

## Native data storage

On Android and iOS, application state is stored as an AES-256-GCM encrypted envelope. A fresh 96-bit nonce is generated for every write, and the authentication tag plus stable additional authenticated data protect the ciphertext from undetected modification.

The 256-bit data key is generated with `expo-crypto` and stored separately in `expo-secure-store`:

- Android: encrypted SharedPreferences backed by Android Keystore.
- iOS: Keychain item with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` accessibility.

`AsyncStorage` holds ciphertext only. The previous `luna-log-app-v5` plaintext value is read once for migration and is removed only after the encrypted value has been successfully written. If an encrypted value cannot be decrypted or validated, the application stops automatic writes and offers an explicit raw-data export or discard action.

## Access protection

The two non-sensitive protection flags are stored separately so an enabled app lock can be shown before v6 health records are decrypted. App Lock uses the system authentication flow and accepts either enrolled biometrics or sufficiently secure device credentials. The app re-locks when it leaves the foreground.

Screen capture protection is enabled by default. On Android it blocks screenshots, screen recording, and recent-task thumbnails while the option is enabled.

The encryption key does not use SecureStore's `requireAuthentication` option. That option makes keys permanently inaccessible after biometric enrollment changes; the application lock instead gates access to the user interface and decrypted state. This does not protect data on a rooted or compromised device, or from malicious code executing inside the app process.

## Important boundaries

- JSON exports are intentionally plaintext so the user can restore data. Treat every export as sensitive and store or share it only through trusted channels.
- The browser preview uses browser storage because the Web platform has no Android Keystore or iOS Keychain equivalent. Do not use the Web preview for real sensitive records.
- Android automatic backup is disabled. This prevents ciphertext from being restored without its Keystore key.
- No in-app APK downloader or installer remains. Updates are checked through the official GitHub Release API and opened in the official release page.

## Release checks

1. Create and protect a release keystore as described in `docs/release-signing.md`.
2. Build a release APK and inspect it with `apksigner verify --print-certs`.
3. On a physical Android device, verify app lock cancellation, biometric/device-credential fallback, foreground re-lock, screenshots, recording, and the recent-task thumbnail.
4. Export a backup before testing migration from the old debug-signed APK. A package signed with a new release key cannot update the existing debug-signed installation.
