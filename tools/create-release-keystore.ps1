[CmdletBinding()]
param(
  [string]$KeystorePath = (Join-Path $env:USERPROFILE 'secure\luna-log-release.keystore'),
  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$Alias = 'luna-log',
  [ValidateRange(1, 36500)]
  [int]$ValidityDays = 9125
)

$keytool = Get-Command keytool -ErrorAction Stop
$target = [System.IO.Path]::GetFullPath($KeystorePath)
$directory = Split-Path -Parent $target

if (Test-Path -LiteralPath $target) {
  throw "Keystore already exists: $target"
}

if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

Write-Host "Creating release keystore at: $target"
Write-Host 'keytool will prompt for passwords and certificate identity. Do not enter passwords into project files.'

& $keytool.Source -genkeypair -v -keystore $target -alias $Alias -keyalg RSA -keysize 4096 -validity $ValidityDays
if ($LASTEXITCODE -ne 0) {
  throw 'keytool did not create the release keystore.'
}

Write-Host 'Keystore created. Verify its certificate fingerprint before configuring the release build:'
& $keytool.Source -list -v -keystore $target -alias $Alias
