# Renders the Kid A (hiragana "a") icon PNGs into icons/. Scanline style: tan glyph on dark brown.
# Needs ZenKurenaido-Regular.ttf (free, SIL Open Font License, from Google Fonts); pass its path with -Font.
param([Parameter(Mandatory)] [string]$Font)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force $outDir | Out-Null
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile((Resolve-Path $Font))
$family = $pfc.Families[0]
$glyphChar = [string][char]0x3042   # hiragana "a"

function Render([int]$size, [string]$file) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#412402"))

  # Glyph at ~78% of the icon so it stays inside Android's round mask.
  $em = $size * 0.78
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddString($glyphChar, $family, 0, $em, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)
  $b = $path.GetBounds()
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate(($size - $b.Width) / 2 - $b.X, ($size - $b.Height) / 2 - $b.Y)
  $path.Transform($m)
  $b = $path.GetBounds()

  $fg = [System.Drawing.ColorTranslator]::FromHtml("#EBD7B5")   # tan
  $brush = New-Object System.Drawing.SolidBrush $fg
  $pen = New-Object System.Drawing.Pen $fg, ($em * 0.05)   # thickened strokes = "bold"
  $pen.LineJoin = "Round"
  $g.FillPath($brush, $path); $g.DrawPath($pen, $path)

  # Scanlines: thin background-colored lines across the glyph, like an old CRT.
  # Spacing scales with icon size so the effect survives at home-screen size.
  $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#412402"))
  $gap = [Math]::Max(4, [Math]::Round($size / 26))
  $line = [Math]::Max(1, [Math]::Round($gap * 0.34))
  for ($y = [Math]::Round($b.Y); $y -lt $b.Bottom + $em * 0.05; $y += $gap) {
    $g.FillRectangle($bgBrush, 0, $y, $size, $line)
  }

  $g.Dispose()
  $bmp.Save((Join-Path $outDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "wrote $file"
}

Render 512 "icon-512.png"
Render 192 "icon-192.png"
Render 180 "apple-touch-icon.png"


