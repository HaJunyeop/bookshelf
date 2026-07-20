param(
  [string]$PhotosPath = (Join-Path $PSScriptRoot '..\Photos'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\data\ocr-results.json'),
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] | Out-Null

$script:asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
  Select-Object -First 1

function Await($operation, [Type]$type) {
  $task = $script:asTask.MakeGenericMethod($type).Invoke($null, @($operation))
  $task.Wait()
  return $task.Result
}

function Read-Ocr([string]$path) {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $stream.Dispose(); $bitmap.Dispose()
  return ($result.Lines | ForEach-Object { $_.Text })
}

function Save-Rotated([string]$source, [string]$target, [System.Drawing.RotateFlipType]$rotation) {
  $image = [System.Drawing.Image]::FromFile($source)
  try { $image.RotateFlip($rotation); $image.Save($target, [System.Drawing.Imaging.ImageFormat]::Jpeg) }
  finally { $image.Dispose() }
}

$existing = @{}
if ((Test-Path $OutputPath) -and -not $Force) {
  (Get-Content -Raw -Encoding UTF8 $OutputPath | ConvertFrom-Json) | ForEach-Object { $existing[$_.file] = $_ }
}

$temp = Join-Path ([IO.Path]::GetTempPath()) 'bookshelf-ocr'
New-Item -ItemType Directory -Force -Path $temp | Out-Null
$results = [System.Collections.Generic.List[object]]::new()

Get-ChildItem $PhotosPath -File | Where-Object Extension -Match '^\.(jpg|jpeg|png)$' | Sort-Object Name | ForEach-Object {
  if ($existing.ContainsKey($_.Name)) { $results.Add($existing[$_.Name]); return }
  Write-Host "사진 읽는 중: $($_.Name)"
  $texts = [System.Collections.Generic.List[string]]::new()
  foreach ($spec in @(@('right','Rotate90FlipNone'), @('left','Rotate270FlipNone'))) {
    $rotated = Join-Path $temp "$($_.BaseName)-$($spec[0]).jpg"
    Save-Rotated $_.FullName $rotated ([System.Drawing.RotateFlipType]::$($spec[1]))
    (Read-Ocr $rotated) | ForEach-Object { if ($_.Trim()) { $texts.Add($_.Trim()) } }
    Remove-Item -LiteralPath $rotated -Force
  }
  $results.Add([pscustomobject]@{ file=$_.Name; modified=$_.LastWriteTimeUtc.ToString('o'); lines=@($texts | Select-Object -Unique) })
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutputPath) | Out-Null
$results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $OutputPath
Write-Host "완료: $($results.Count)장 → $OutputPath"
