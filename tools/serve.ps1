# Tiny local web server for testing: powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 8787]
param([int]$Port = 8787)
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".png" = "image/png"; ".json" = "application/json"; ".webmanifest" = "application/manifest+json"; ".svg" = "image/svg+xml"
}
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
"Serving $root at http://localhost:$Port/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if (-not $rel) { $rel = "index.html" }
  $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
  $res = $ctx.Response
  if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file)
    $res.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $res.Headers.Add("Cache-Control", "no-store")
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
  }
  $res.Close()
  "{0} {1}" -f $res.StatusCode, $rel
}
