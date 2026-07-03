# Setup DNS for AI Discovery (DNS-AID) records for boostmlbb.ru
# Prerequisites:
#   1. Cloudflare API token with Zone:DNS:Edit permission
#   2. Set CLOUDFLARE_API_TOKEN environment variable or pass as -ApiToken
#
# Usage:
#   .\setup-dns-aid.ps1 -ZoneId "your-zone-id" -ApiToken "your-token"
#   .\setup-dns-aid.ps1 -ZoneId "your-zone-id"   # reads CLOUDFLARE_API_TOKEN env

param(
  [Parameter(Mandatory=$true)] [string]$ZoneId,
  [Parameter(Mandatory=$false)] [string]$ApiToken
)

if (-not $ApiToken) {
  $ApiToken = $env:CLOUDFLARE_API_TOKEN
  if (-not $ApiToken) {
    Write-Error "No API token provided. Set CLOUDFLARE_API_TOKEN env var or pass -ApiToken"
    exit 1
  }
}

$headers = @{
  "Authorization" = "Bearer $ApiToken"
  "Content-Type"  = "application/json"
}

$baseUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records"

$records = @(
  @{
    type    = "HTTPS"
    name    = "_index._agents.boostmlbb.ru"
    content = "1 . alpn=\"h2,h3\""
    ttl     = 3600
    comment = "DNS-AID: Agent index discovery endpoint"
  },
  @{
    type    = "SVCB"
    name    = "_a2a._agents.boostmlbb.ru"
    content = "1 boostmlbb.ru. alpn=\"a2a\" port=443"
    ttl     = 3600
    comment = "DNS-AID: Agent-to-Agent protocol endpoint"
  }
)

foreach ($record in $records) {
  Write-Host "Adding $($record.type) record for $($record.name)..." -ForegroundColor Cyan
  $body = $record | ConvertTo-Json -Compress
  try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
    if ($response.success) {
      Write-Host "  OK: $($response.result.id)" -ForegroundColor Green
    } else {
      Write-Host "  FAIL: $($response.errors[0].message)" -ForegroundColor Red
    }
  } catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Next step: Enable DNSSEC in Cloudflare Dashboard" -ForegroundColor Yellow
Write-Host "  Cloudflare Dashboard > boostmlbb.ru > DNS > DNSSEC > Enable DNSSEC" -ForegroundColor Yellow
