# Erzeugt die App-Icons (PNG) in ..\icons mit System.Drawing.
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force $out | Out-Null

foreach ($size in 180, 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  # Hintergrund vollflächig (iOS rundet die Ecken selbst)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 13, 15, 18))
  $pad = [int]($size * 0.14)
  $r = [int]($size * 0.2)
  $rect = New-Object System.Drawing.Rectangle $pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
  $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
  $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $lime = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 198, 244, 50))
  $g.FillPath($lime, $path)
  $font = New-Object System.Drawing.Font 'Segoe UI', ([single]($size * 0.3)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 22, 10))
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'
  $rf = New-Object System.Drawing.RectangleF 0, ([single]($size * 0.02)), $size, $size
  $g.DrawString('GF', $font, $ink, $rf, $fmt)
  $file = Join-Path $out "icon-$size.png"
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "OK $file"
}
