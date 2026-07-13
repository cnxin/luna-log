$ErrorActionPreference = 'Stop'
$xmlPath = Join-Path $env:USERPROFILE 'secure\luna-log-release-signing.credential.xml'
$keystorePath = Join-Path $env:USERPROFILE 'secure\luna-log-release.keystore'
if (-not (Test-Path -LiteralPath $xmlPath)) { throw "Missing credential file: $xmlPath" }
if (-not (Test-Path -LiteralPath $keystorePath)) { throw "Missing keystore: $keystorePath" }
$cred = Import-Clixml -Path $xmlPath
$pass = $cred.GetNetworkCredential().Password
if ([string]::IsNullOrEmpty($pass)) { throw 'Release password is empty' }
Write-Output ("user=" + $cred.UserName)
Write-Output ("pass_len=" + $pass.Length)
Write-Output ("keystore=" + $keystorePath)
