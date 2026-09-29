# Renders the Kid あ icon PNGs into icons/.
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

  # Glyph at ~59% of the icon so it stays inside Android's round mask.
  $em = $size * 0.59
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddString($glyphChar, $family, 0, $em, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)
  $b = $path.GetBounds()
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate(($size - $b.Width) / 2 - $b.X, ($size - $b.Height) / 2 - $b.Y)
  $path.Transform($m)
  $b = $path.GetBounds()

  $fg = [System.Drawing.ColorTranslator]::FromHtml("#FAF8F3")
  $brush = New-Object System.Drawing.SolidBrush $fg
  $pen = New-Object System.Drawing.Pen $fg, ($em * 0.034)   # thickened strokes = "bold"
  $pen.LineJoin = "Round"

  # One slice through the middle, shifted right.
  $sliceY = $b.Y + $b.Height * 0.52
  $sliceH = $b.Height * 0.12
  $shift = $em * 0.10

  $g.SetClip((New-Object System.Drawing.RectangleF 0, 0, $size, $sliceY))
  $g.SetClip((New-Object System.Drawing.RectangleF 0, ($sliceY + $sliceH), $size, $size), "Union")
  $g.FillPath($brush, $path); $g.DrawPath($pen, $path)

  $g.SetClip((New-Object System.Drawing.RectangleF 0, $sliceY, $size, $sliceH))
  $g.TranslateTransform($shift, 0)
  $g.FillPath($brush, $path); $g.DrawPath($pen, $path)

  $g.Dispose()
  $bmp.Save((Join-Path $outDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "wrote $file"
}

Render 512 "icon-512.png"
Render 192 "icon-192.png"
Render 180 "apple-touch-icon.png"
