# Luna Log v1.0.11

## Security

- Encrypt Android and iOS application state with AES-256-GCM. Encryption keys are stored separately in the system secure store.
- Gate v6 record decryption behind the app lock and preserve local app-lock/screen-capture settings when importing a backup.
- Enable Android screenshot, recording, and recent-task thumbnail protection by default.
- Remove the in-app APK downloader and installer. Update checks now open the official GitHub Release page.

## Data Safety

- Migrate the legacy plaintext data only after ciphertext is written successfully.
- Preserve corrupt local values for explicit recovery export instead of overwriting them automatically.

## Release

- Android `versionCode`: 12
- Signed with the Luna Log release certificate.
- APK SHA-256: `92794F81CABBB67AE4FD6E95649394A1E496761CFEE453D3355CF80BE5FF6561`
