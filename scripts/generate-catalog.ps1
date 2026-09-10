param(
  [string]$SourceRoot = 'D:\ARTE PARA CANECA',
  [string]$ProjectRoot = 'C:\Users\alexs\Documents\site\agenda-motos-app'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outputRoot = Join-Path $ProjectRoot 'dist\assets\catalogo'
$manifestPath = Join-Path $ProjectRoot 'dist\catalogo.json'
$logPath = Join-Path $ProjectRoot 'catalogo-falhas.txt'
New-Item -ItemType Directory -Force $outputRoot | Out-Null

$files = Get-ChildItem -LiteralPath $SourceRoot -File -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|webp)$' -and $_.FullName -match 'MOCKUP' } |
  Sort-Object FullName

$items = [System.Collections.Generic.List[object]]::new()
$failures = [System.Collections.Generic.List[string]]::new()
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  [long]78
)

for ($index = 0; $index -lt $files.Count; $index++) {
  $file = $files[$index]
  $number = $index + 1
  $filename = '{0:D5}.jpg' -f $number
  $destination = Join-Path $outputRoot $filename

  try {
    $sourceImage = [System.Drawing.Image]::FromFile($file.FullName)
    $targetWidth = [Math]::Min(720, $sourceImage.Width)
    $targetHeight = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $targetWidth / $sourceImage.Width))
    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, $targetWidth, $targetHeight)
    $bitmap.Save($destination, $jpegEncoder, $encoderParameters)
    $graphics.Dispose()
    $bitmap.Dispose()
    $sourceImage.Dispose()

    $relative = $file.FullName.Substring($SourceRoot.TrimEnd('\').Length).TrimStart('\')
    $parts = $relative.Split('\')
    $mockupIndex = -1
    for ($partIndex = 0; $partIndex -lt $parts.Count; $partIndex++) {
      if ($parts[$partIndex] -match 'MOCKUP') { $mockupIndex = $partIndex; break }
    }
    $collection = if ($mockupIndex -gt 0) { $parts[$mockupIndex - 1] } else { $parts[0] }
    $title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) -replace '[_-]+', ' '

    $items.Add([ordered]@{
      id = $number
      titulo = $title.Trim()
      colecao = $collection.Trim()
      src = "assets/catalogo/$filename"
    })
  } catch {
    $failures.Add("$($file.FullName) | $($_.Exception.Message)")
  }

  if ($number % 100 -eq 0) {
    Write-Output "processadas=$number total=$($files.Count) validas=$($items.Count) falhas=$($failures.Count)"
  }
}

$items | ConvertTo-Json -Depth 4 -Compress | Set-Content -LiteralPath $manifestPath -Encoding utf8
$failures | Set-Content -LiteralPath $logPath -Encoding utf8
Write-Output "concluido total=$($files.Count) validas=$($items.Count) falhas=$($failures.Count)"
