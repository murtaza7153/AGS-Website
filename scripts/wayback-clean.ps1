param(
  [Parameter(Mandatory = $false)]
  [string] $Root = ".",

  # Any unwrapped links to this host will be converted to relative ("/path").
  [Parameter(Mandatory = $false)]
  [string] $PrimaryHost = "www.agsgolfandsports.com",

  # If set, creates "<file>.bak" before modifying in place.
  [switch] $Backup,

  # If set, prints what would change but does not write.
  [switch] $DryRun
)

$ErrorActionPreference = "Stop"

function Escape-RegexLiteral([string] $s) {
  return [Regex]::Escape($s)
}

function Rewrite-Content([string] $content, [string] $primaryHost) {
  # NOTE: Regex replace callbacks run in their own scope, so use a ref flag.
  $changedRef = [ref]$false
  $out = $content

  # 1) Remove Wayback toolbar block (inclusive).
  $toolbarPattern = '(?s)<!--\s*BEGIN WAYBACK TOOLBAR INSERT\s*-->.*?<!--\s*END WAYBACK TOOLBAR INSERT\s*-->'
  $newOut = [Regex]::Replace($out, $toolbarPattern, { param($m) $changedRef.Value = $true; return "" })
  $out = $newOut

  # 2) Unwrap Wayback links to their original URL (unescaped form).
  #    Example: https://web.archive.org/web/20250912051234/https://example.com/a -> https://example.com/a
  $unwrapPattern = 'https?://web\.archive\.org/web/\d+(?:[a-z_]{0,10})?/(https?://[^\s"''<>]+)'
  $newOut = [Regex]::Replace($out, $unwrapPattern, {
    param($m)
    $changedRef.Value = $true
    return $m.Groups[1].Value
  })
  $out = $newOut

  # 2b) Unwrap Wayback links inside escaped strings (e.g. https:\/\/web.archive.org\/web\/...\/https:\/\/example.com\/a).
  $unwrapEscapedPattern = 'https?:\\/\\/web\.archive\.org\\/web\\/\\d+(?:[a-z_]{0,10})?\\/(https?:\\/\\/[^\\s"''<>]+)'
  $newOut = [Regex]::Replace($out, $unwrapEscapedPattern, {
    param($m)
    $changedRef.Value = $true
    return $m.Groups[1].Value
  })
  $out = $newOut

  # 3) Convert absolute links to PrimaryHost into relative links (unescaped form).
  #    Example: https://www.agsgolfandsports.com/about/ -> /about/
  $hostLit = Escape-RegexLiteral($primaryHost)
  $hostAbsPattern = "https?://$hostLit(?:(/[^\s\""'<>\)]*))?"
  $newOut = [Regex]::Replace($out, $hostAbsPattern, {
    param($m)
    $changedRef.Value = $true
    if ($m.Groups[1].Success -and $m.Groups[1].Value.Length -gt 0) { return $m.Groups[1].Value }
    return "/"
  })
  $out = $newOut

  # 3b) Convert absolute links to PrimaryHost into relative links inside escaped strings.
  #    Example: https:\/\/www.agsgolfandsports.com\/about\/ -> \/about\/
  $hostAbsEscapedPattern = "https?:\\/\\/$hostLit(?:(\\/[^\\s\""'<>\)]*))?"
  $newOut = [Regex]::Replace($out, $hostAbsEscapedPattern, {
    param($m)
    $changedRef.Value = $true
    if ($m.Groups[1].Success -and $m.Groups[1].Value.Length -gt 0) { return $m.Groups[1].Value }
    return "\\/"
  })
  $out = $newOut

  # 4) Unwrap Wayback-wrapped tel/mailto links
  $newOut = [Regex]::Replace($out, 'https?://web\.archive\.org/web/\d+/(tel:[^\s"''<>]+)', {
    param($m)
    $changedRef.Value = $true
    return $m.Groups[1].Value
  })
  $out = $newOut

  $newOut = [Regex]::Replace($out, 'https?://web\.archive\.org/web/\d+/(mailto:[^\s"''<>]+)', {
    param($m)
    $changedRef.Value = $true
    return $m.Groups[1].Value
  })
  $out = $newOut

  return @{
    Content = $out
    Changed = $changedRef.Value
  }
}

$rootPath = (Resolve-Path -LiteralPath $Root).Path
$files = Get-ChildItem -LiteralPath $rootPath -Recurse -File | Where-Object { $_.Extension -in ".htm", ".html" }

if (-not $files -or $files.Count -eq 0) {
  Write-Host "No .htm/.html files found under '$rootPath'."
  exit 0
}

$changedCount = 0
$scannedCount = 0

foreach ($f in $files) {
  $scannedCount++

  $original = Get-Content -LiteralPath $f.FullName -Raw
  $result = Rewrite-Content -content $original -primaryHost $PrimaryHost

  if ($result.Changed) {
    $changedCount++
    if ($DryRun) {
      Write-Host ("[DRY-RUN] Would update: {0}" -f $f.FullName)
      continue
    }

    if ($Backup) {
      Copy-Item -LiteralPath $f.FullName -Destination ($f.FullName + ".bak") -Force
    }

    Set-Content -LiteralPath $f.FullName -Value $result.Content -NoNewline -Encoding utf8
    Write-Host ("Updated: {0}" -f $f.FullName)
  }
}

Write-Host ("Scanned {0} file(s). Changed {1} file(s)." -f $scannedCount, $changedCount)

