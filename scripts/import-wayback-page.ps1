param(
  [Parameter(Mandatory = $true)]
  [string] $WaybackUrl,

  # Output HTML path relative to repo root (e.g. "about/index.html")
  [Parameter(Mandatory = $true)]
  [string] $OutFile,

  # Used to convert internal links to relative paths ("/about/").
  [Parameter(Mandatory = $false)]
  [string] $PrimaryHost = "www.agsgolfandsports.com",

  # If set, do not download assets (only rewrite HTML).
  [switch] $NoAssets
)

$ErrorActionPreference = "Stop"

function Ensure-DirForFile([string] $path) {
  $dir = Split-Path -Parent $path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
}

function Map-OriginalUrlToLocalPath([string] $originalUrl) {
  # Turn an absolute URL into a filesystem-friendly relative path segment.
  # Examples:
  # - https://fonts.googleapis.com/css2 -> https/fonts.googleapis.com/css2
  # - http://example.com/a -> http/example.com/a
  $u = $originalUrl
  if ($u.StartsWith('https://')) { return 'https/' + $u.Substring(8) }
  if ($u.StartsWith('http://')) { return 'http/' + $u.Substring(7) }
  return $u
}

function Download-AssetIfMissing([string] $waybackAssetUrl, [string] $localRelPath) {
  $localPath = Join-Path (Get-Location) $localRelPath
  if (Test-Path -LiteralPath $localPath) { return }

  Ensure-DirForFile -path $localPath

  $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  Invoke-WebRequest -Uri $waybackAssetUrl -UseBasicParsing -UserAgent $ua -OutFile $localPath | Out-Null
}

function Rewrite-Html([string] $html, [string] $primaryHost, [switch] $noAssets) {
  $out = $html

  # Remove Wayback toolbar (inclusive)
  $out = [Regex]::Replace(
    $out,
    '(?s)<!--\s*BEGIN WAYBACK TOOLBAR INSERT\s*-->.*?<!--\s*END WAYBACK TOOLBAR INSERT\s*-->',
    ''
  )

  # Remove Wayback injected head scripts/styles up to the marker
  $out = [Regex]::Replace(
    $out,
    '(?s)(<head\b[^>]*>).*?<!-- End Wayback Rewrite JS Include -->\s*',
    '$1' + "`r`n"
  )

  # Replace web-static.archive.org assets with local _static equivalents (you already have these)
  $out = $out -replace 'https?://web-static\.archive\.org/_static/', '_static/'
  $out = $out -replace 'https?://archive\.org/', ''
  $out = $out -replace '//archive\.org/', ''

  # Download + rewrite Wayback asset URLs (im_/cs_/js_/jm_/etc)
  $assetPattern = '(https?:)?//web\.archive\.org/web/(\d+[a-z_]{0,10})/(https?://[^\s"''<>]+)'
  $out = [Regex]::Replace($out, $assetPattern, {
    param($m)
    $prefix = $m.Groups[2].Value
    $orig = $m.Groups[3].Value
    $mappedOrig = Map-OriginalUrlToLocalPath $orig
    $localRel = "$prefix/$mappedOrig"
    $fullWayback = "https://web.archive.org/web/$prefix/$orig"
    if (-not $noAssets) {
      try { Download-AssetIfMissing -waybackAssetUrl $fullWayback -localRelPath $localRel } catch { }
    }
    return $localRel
  })

  # Unwrap any remaining Wayback page links to their original URL
  $unwrapPattern = 'https?://web\.archive\.org/web/\d+(?:[a-z_]{0,10})?/(https?://[^\s"''<>]+)'
  $out = [Regex]::Replace($out, $unwrapPattern, { param($m) $m.Groups[1].Value })

  # Unwrap Wayback-wrapped tel/mailto links
  $out = [Regex]::Replace($out, 'https?://web\.archive\.org/web/\d+/(tel:[^\s"''<>]+)', { param($m) $m.Groups[1].Value })
  $out = [Regex]::Replace($out, 'https?://web\.archive\.org/web/\d+/(mailto:[^\s"''<>]+)', { param($m) $m.Groups[1].Value })

  # Convert primary host absolute links to relative paths
  $hostLit = [Regex]::Escape($primaryHost)
  $hostAbsPattern = "https?://$hostLit(?:(/[^\s\""'<>\)]*))?"
  $out = [Regex]::Replace($out, $hostAbsPattern, {
    param($m)
    if ($m.Groups[1].Success -and $m.Groups[1].Value.Length -gt 0) { return $m.Groups[1].Value }
    return "/"
  })

  return $out
}

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
$raw = (Invoke-WebRequest -Uri $WaybackUrl -UseBasicParsing -UserAgent $ua).Content
$rewritten = Rewrite-Html -html $raw -primaryHost $PrimaryHost -noAssets:$NoAssets

$outPath = Join-Path (Get-Location) $OutFile
Ensure-DirForFile -path $outPath
Set-Content -LiteralPath $outPath -Value $rewritten -NoNewline -Encoding utf8

Write-Host "Wrote: $OutFile"

