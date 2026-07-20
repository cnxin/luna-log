# Android Release Signing

Do not distribute APKs signed with the Android debug certificate.

Create a release keystore outside the repository. The helper leaves password entry to `keytool` and never writes secrets to a file:

```powershell
.\tools\create-release-keystore.ps1
```

Pass a different external path only when needed:

```powershell
.\tools\create-release-keystore.ps1 -KeystorePath 'C:\secure\luna-log-release.keystore' -Alias 'luna-log'
```

Set these values in CI secrets or a local untracked Gradle properties file before running a release build:

```text
LUNA_LOG_RELEASE_STORE_FILE=/absolute/path/to/luna-log-release.keystore
LUNA_LOG_RELEASE_STORE_PASSWORD=...
LUNA_LOG_RELEASE_KEY_ALIAS=luna-log
LUNA_LOG_RELEASE_KEY_PASSWORD=...
```

The existing 1.0.10 APK is debug-signed. Before publishing a package signed with a new key, prepare an Android signing-key migration or communicate that existing sideload users must reinstall. Never commit the keystore or passwords.

Verify every release artifact before upload:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\apksigner.bat" verify --print-certs .\app-release.apk
```

## GitHub Actions

`.github/workflows/verify.yml` runs type checks and logic tests for every pull request and push to `master`.

`.github/workflows/release-android.yml` is manual-only. Before dispatching it for an existing `vMAJOR.MINOR.PATCH` tag, configure these repository secrets:

```text
LUNA_LOG_RELEASE_STORE_BASE64
LUNA_LOG_RELEASE_STORE_PASSWORD
LUNA_LOG_RELEASE_KEY_ALIAS
LUNA_LOG_RELEASE_KEY_PASSWORD
```

Create the base64 keystore value without a trailing newline:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\secure\luna-log-release.keystore'))
```

The workflow verifies the tag against `package.json`, `App.tsx`, and `app.json`, signs and verifies the APK, uploads an Actions artifact with its SHA-256 file, then creates or updates the matching GitHub Release.
