# Downscales the environment page photographs to a web-appropriate width.
# wm3.jpg ships at 7360x4140 / 20.4 MB, which alone would stall the page.
# wm0.jpg is deliberately excluded - it is 394x623 and already small.
# Temporary utility: delete once the assets are converted.

Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot 'src\assets'
$targetWidth = 1920
$quality = 82

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int]$quality)

foreach ($name in 'wm1', 'wm2', 'wm3', 'wm4') {

    $path = Join-Path $dir "$name.jpg"
    $before = (Get-Item $path).Length / 1KB

    $source = [System.Drawing.Image]::FromFile($path)

    # Keep the aspect ratio - only the width is fixed
    $height = [int][math]::Round($source.Height * ($targetWidth / $source.Width))

    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = 'HighQualityBicubic'
    $graphics.SmoothingMode = 'HighQuality'
    $graphics.PixelOffsetMode = 'HighQuality'
    $graphics.DrawImage($source, 0, 0, $targetWidth, $height)
    $graphics.Dispose()
    $source.Dispose()

    # Written beside the original, then swapped in, so a failure
    # part way through cannot leave a truncated image behind
    $temp = Join-Path $dir "$name.tmp.jpg"
    $bitmap.Save($temp, $codec, $encoderParams)
    $bitmap.Dispose()
    Move-Item -Force $temp $path

    $after = (Get-Item $path).Length / 1KB
    "{0}.jpg  {1}x{2}  {3:N0} KB -> {4:N0} KB" -f $name, $targetWidth, $height, $before, $after
}
