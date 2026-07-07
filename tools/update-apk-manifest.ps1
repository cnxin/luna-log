param(
  [string]$Version = "1.0.5",
  [string]$ApkPath = "android\app\build\outputs\apk\release\app-release.apk"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot "update-manifest.json"
$resolvedApk = Join-Path $projectRoot $ApkPath

if (-not (Test-Path $resolvedApk)) {
  throw "APK not found: $resolvedApk"
}
if (-not (Test-Path $manifestPath)) {
  throw "Manifest not found: $manifestPath"
}

$apk = Get-Item $resolvedApk
$sha256 = (Get-FileHash -Algorithm SHA256 -Path $resolvedApk).Hash.ToLowerInvariant()
$apkName = "luna-log-v$Version-release.apk"

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$manifest.version = $Version
$manifest.apkName = $apkName
$manifest.apkSize = $apk.Length
$manifest.apkSha256 = $sha256
$manifest.downloadUrl = "https://github.com/cnxin/luna-log/releases/download/v$Version/$apkName"
$manifest.apkUrl = $manifest.downloadUrl
$manifest.mirrorApkUrl = "https://gitee.com/ysjugg/luna-log/raw/master/downloads/$apkName"
$manifest.releaseUrl = "https://github.com/cnxin/luna-log/releases/tag/v$Version"

$encoding = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($manifestPath, (($manifest | ConvertTo-Json -Depth 20) + "`n"), $encoding)

Write-Host "Updated update-manifest.json"
Write-Host "APK: $apkName"
Write-Host "Size: $($apk.Length)"
Write-Host "SHA256: $sha256"