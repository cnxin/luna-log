$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$xmlPath = Join-Path $env:USERPROFILE 'secure\luna-log-release-signing.credential.xml'
$keystorePath = Join-Path $env:USERPROFILE 'secure\luna-log-release.keystore'
if (-not (Test-Path -LiteralPath $xmlPath)) { throw "Missing credential file: $xmlPath" }
if (-not (Test-Path -LiteralPath $keystorePath)) { throw "Missing keystore: $keystorePath" }

$cred = Import-Clixml -Path $xmlPath
$pass = $cred.GetNetworkCredential().Password
if ([string]::IsNullOrEmpty($pass)) { throw 'Release password is empty' }

$env:LUNA_LOG_RELEASE_STORE_FILE = $keystorePath
$env:LUNA_LOG_RELEASE_STORE_PASSWORD = $pass
$env:LUNA_LOG_RELEASE_KEY_ALIAS = 'luna-log'
$env:LUNA_LOG_RELEASE_KEY_PASSWORD = $pass

Write-Host "Using keystore: $keystorePath"
Write-Host "Using alias: $($env:LUNA_LOG_RELEASE_KEY_ALIAS)"
Write-Host 'Starting assembleRelease...'

Push-Location (Join-Path $projectRoot 'android')
try {
  & .\gradlew.bat :app:assembleRelease --no-daemon
  if ($LASTEXITCODE -ne 0) { throw "assembleRelease failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
  Remove-Item Env:LUNA_LOG_RELEASE_STORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:LUNA_LOG_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
}

Write-Host 'assembleRelease finished'
