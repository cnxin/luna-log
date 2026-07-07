param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$project = (Resolve-Path $ProjectRoot).Path
$resRoot = Join-Path $project "android\app\src\main\res"
$legacySource = Join-Path $project "assets\app-icons\icon-1024.png"
$foregroundSource = Join-Path $project "assets\app-icons\adaptive-icon-foreground.png"
$backgroundSource = Join-Path $project "assets\app-icons\adaptive-icon-background.png"

foreach ($path in @($resRoot, $legacySource, $foregroundSource, $backgroundSource)) {
  if (-not (Test-Path $path)) {
    throw "Missing required path: $path"
  }
}

function Save-ResizedPng([string]$Source, [string]$Destination, [int]$Size) {
  $src = [System.Drawing.Image]::FromFile($Source)
  try {
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($src, 0, 0, $Size, $Size)
      } finally {
        $g.Dispose()
      }
      $bmp.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $src.Dispose()
  }
}

$sizes = @{
  "mipmap-mdpi" = @{ legacy = 48; adaptive = 108 }
  "mipmap-hdpi" = @{ legacy = 72; adaptive = 162 }
  "mipmap-xhdpi" = @{ legacy = 96; adaptive = 216 }
  "mipmap-xxhdpi" = @{ legacy = 144; adaptive = 324 }
  "mipmap-xxxhdpi" = @{ legacy = 192; adaptive = 432 }
}

foreach ($density in $sizes.Keys) {
  $dir = Join-Path $resRoot $density
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }

  Get-ChildItem -LiteralPath $dir -Filter "ic_launcher*.webp" | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Force
  }

  Save-ResizedPng $legacySource (Join-Path $dir "ic_launcher.png") $sizes[$density].legacy
  Save-ResizedPng $legacySource (Join-Path $dir "ic_launcher_round.png") $sizes[$density].legacy
  Save-ResizedPng $backgroundSource (Join-Path $dir "ic_launcher_background.png") $sizes[$density].adaptive
  Save-ResizedPng $foregroundSource (Join-Path $dir "ic_launcher_foreground.png") $sizes[$density].adaptive
  Save-ResizedPng $foregroundSource (Join-Path $dir "ic_launcher_monochrome.png") $sizes[$density].adaptive
}

Write-Host "Android launcher icons synced from assets/app-icons."
