$ErrorActionPreference = "Stop"

$p = Join-Path (Get-Location) "index.html"
if (-not (Test-Path -LiteralPath $p)) {
  throw "index.html not found at repo root: $p"
}

$c = Get-Content -LiteralPath $p -Raw

# Remove Wayback "Rewrite JS Include" block that was injected at the top of <head>.
$replacementHead = "<!DOCTYPE html`r`n<html lang=`"en-US`">`r`n<head>`r`n"
$c2 = [Regex]::Replace(
  $c,
  '(?s)\A<!DOCTYPE html>\s*\r?\n<html[^>]*>\s*\r?\n<head>.*?<!-- End Wayback Rewrite JS Include -->\s*\r?\n',
  $replacementHead
)

# Since index.html is now at repo root, remove old relative prefixes.
$c2 = $c2 -replace '\.\./\.\./\.\./\.\./', ''
$c2 = $c2 -replace '\.\./\.\./\.\./', ''

# Fix leftover escaped Wayback URL string (from earlier rewrite) to just "/".
$c2 = [Regex]::Replace(
  $c2,
  '"url"\s*:\s*"https:\\/\\/web\.archive\.org\\/web\\/\\d+\\/\\/"',
  '"url":"/"'
)

# Remove a prefetch line that still points at web.archive.org.
$c2 = [Regex]::Replace(
  $c2,
  '<link rel="dns-prefetch"[^>]*>\s*\r?\n',
  ''
)

if ($c2 -ne $c) {
  Set-Content -LiteralPath $p -Value $c2 -NoNewline -Encoding utf8
  Write-Host "Updated index.html"
} else {
  Write-Host "No changes needed"
}

