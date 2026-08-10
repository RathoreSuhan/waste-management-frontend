# Downscales the full-bleed photographs to a web-appropriate width.
# wm3.jpg ships at 7360x4140 / 20.4 MB, which alone would stall the page.
# wm0.jpg is deliberately excluded - it is 394x623 and already small.
#
# hp1.jpg was added when the home page quote band started using it. At
# 3000x1718 / 836 KB it was the heaviest image on the landing page, and a
# band that is 100vw at most needs nothing beyond 1920.
#
# hp2.jpg followed with the pledge band, and was worse: 8.1 MB, larger than
# every other asset on the landing page put together.
#
# hp2 is also the one portrait image here, and it gets a lower ceiling than
# the rest. The others are landscape and run the full width of the page, so
# 1920 is the width actually painted. hp2 sits in a half-width column beside
# the text and is 2876px tall, so at 1920 wide it was still 2.2 MB - paying
# for roughly twice the pixels the layout can ever show. 1100 covers that
# column on a 2x display with room to spare.
#
# Images already at or below the target width are skipped. The script

# overwrites in place, so without that guard a second run would re-encode
# an already-compressed JPEG and lose a little more quality each time.
#
# Temporary utility: delete once the assets are converted.


Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot 'src\assets'
$quality = 82

# Width each image is allowed to keep. Full-bleed landscape photographs get
# 1920; hp2 is portrait and never painted wider than half the page, so it
# gets 1100. See the note at the top of this file.
$targets = [ordered]@{
    wm1 = 1920
    wm2 = 1920
    wm3 = 1920
    wm4 = 1920
    hp1 = 1920
    hp2 = 1100
}


$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int]$quality)

foreach ($name in $targets.Keys) {

    $targetWidth = $targets[$name]
    $path = Join-Path $dir "$name.jpg"


    if (-not (Test-Path $path)) {
        "{0}.jpg  not found - skipped" -f $name
        continue
    }

    $before = (Get-Item $path).Length / 1KB

    $source = [System.Drawing.Image]::FromFile($path)

    # Already small enough. Dispose before moving on, or the handle
    # keeps the file locked for the rest of the session.
    if ($source.Width -le $targetWidth) {
        $w = $source.Width
        $h = $source.Height
        $source.Dispose()
        "{0}.jpg  {1}x{2}  already within {3}px - skipped" -f $name, $w, $h, $targetWidth
        continue
    }

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
