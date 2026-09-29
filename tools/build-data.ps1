# Rebuilds data.js from "Japanese Vocab by Year.xlsx".
# Usage (from the kid-a-nihongo folder):  powershell -ExecutionPolicy Bypass -File tools\build-data.ps1
param(
  [string]$Xlsx = (Join-Path $PSScriptRoot "..\..\Japanese Vocab by Year.xlsx"),
  [string]$Out  = (Join-Path $PSScriptRoot "..\data.js")
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("kida-xlsx-" + [guid]::NewGuid())
[IO.Compression.ZipFile]::ExtractToDirectory((Resolve-Path $Xlsx), $tmp)
function ReadXml($p) { [xml]([IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)) }

$shared = @()
if (Test-Path "$tmp\xl\sharedStrings.xml") {
  foreach ($si in (ReadXml "$tmp\xl\sharedStrings.xml").sst.si) { $shared += $si.InnerText }
}
$wb = ReadXml "$tmp\xl\workbook.xml"
$rels = ReadXml "$tmp\xl\_rels\workbook.xml.rels"
function ColIdx($ref) { $n = 0; foreach ($ch in ($ref -replace '\d', '').ToCharArray()) { $n = $n * 26 + ([int]$ch - 64) }; $n - 1 }

# sheet name -> array of rows (each row = string[]), header row dropped
$sheets = @{}
foreach ($sh in $wb.workbook.sheets.sheet) {
  $rid = $sh.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
  $target = (($rels.Relationships.Relationship | Where-Object { $_.Id -eq $rid }).Target) -replace '^/xl/', ''
  $x = ReadXml "$tmp\xl\$target"
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($row in $x.worksheet.sheetData.row) {
    $cells = New-Object string[] 12
    foreach ($c in $row.c) {
      $i = ColIdx $c.r
      if ($i -ge 12) { continue }
      if ($c.t -eq "s") { $v = $shared[[int]$c.v] }
      elseif ($c.t -eq "inlineStr") { $v = $c.is.InnerText }
      else { $v = $c.v }
      $cells[$i] = (("" + $v) -replace "\s+", " ").Trim()
    }
    $rows.Add($cells)
  }
  $rows.RemoveAt(0)
  $sheets[$sh.name] = $rows
}
Remove-Item $tmp -Recurse -Force

function Clean($s) { if ($null -eq $s) { "" } else { $s.Trim() } }

# ---- words ----
$words = New-Object System.Collections.Generic.List[object]
foreach ($y in 1, 2, 3) {
  foreach ($r in $sheets["Year $y"]) {
    $jp = Clean $r[1]
    if (-not $jp) { continue }
    $unit = ((Clean $r[0]) -split ',')[0].Trim()
    $words.Add([ordered]@{ id = "$y|$jp"; y = $y; u = $unit; jp = $jp; r = (Clean $r[2]); en = (Clean $r[3]); n = (Clean $r[4]) })
  }
}

# ---- kanji ----
$kanji = New-Object System.Collections.Generic.List[object]
$seen = @{}
$cur = $null
foreach ($r in $sheets["Year 1 Kanji"]) {
  if ($r[0]) {
    $cur = [ordered]@{ id = "k|" + $r[0]; y = 1; g = "Japanese 1"; k = $r[0]; m = (Clean $r[1]); on = ""; kun = ""; ex = @(); s = (Clean $r[5]) }
    $kanji.Add($cur); $seen[$r[0]] = $cur
  }
  if ($r[2] -and $cur) { $cur.ex += , ([ordered]@{ w = $r[2]; r = (Clean $r[3]); en = (Clean $r[4]) }) }
}
foreach ($y in 2, 3) {
  $cur = $null
  foreach ($r in $sheets["Year $y Kanji"]) {
    if ($r[1]) {
      if ($seen.ContainsKey($r[1])) {
        $cur = $seen[$r[1]]   # already taught in an earlier year: fill in missing details, add examples
        if (-not $cur.on) { $cur.on = Clean $r[3] }
        if (-not $cur.kun) { $cur.kun = Clean $r[4] }
      } else {
        $cur = [ordered]@{ id = "k|" + $r[1]; y = $y; g = (Clean $r[0]); k = $r[1]; m = (Clean $r[2]); on = (Clean $r[3]); kun = (Clean $r[4]); ex = @(); s = (Clean $r[9]) }
        $kanji.Add($cur); $seen[$r[1]] = $cur
      }
    }
    if ($r[5] -and $cur -and -not ($cur.ex | Where-Object { $_.w -eq $r[5] })) {
      $cur.ex += , ([ordered]@{ w = $r[5]; r = (Clean $r[6]); en = ((Clean $r[7]) -replace '\s+\S\s+slide says.*$', '') })
    }
    if ($r[9] -and $cur -and -not $cur.s) { $cur.s = Clean $r[9] }
  }
}
# The 3H slide for "pain" repeats the "drink" sentence; use one that actually uses the kanji.
# (Escaped because Windows PowerShell 5.1 reads BOM-less scripts as ANSI.)
$itai = [string][char]0x75DB
if ($seen.ContainsKey($itai) -and -not $seen[$itai].s) {
  $seen[$itai].s = -join ([char[]](0x982D, 0x304C, 0x75DB, 0x3044, 0x3067, 0x3059, 0x3002))
}

$data = [ordered]@{ built = (Get-Date -Format "yyyy-MM-dd"); words = $words; kanji = $kanji }
$json = $data | ConvertTo-Json -Depth 6 -Compress
[IO.File]::WriteAllText((Resolve-Path (Split-Path $Out)).Path + "\" + (Split-Path $Out -Leaf), "window.KIDA_DATA = $json;`n", (New-Object Text.UTF8Encoding $false))
"{0} words, {1} kanji -> {2}" -f $words.Count, $kanji.Count, $Out
