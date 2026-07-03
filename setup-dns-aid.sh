#!/bin/bash
# Setup DNS for AI Discovery (DNS-AID) records for boostmlbb.ru
# Prerequisites:
#   1. Cloudflare API token with Zone:DNS:Edit permission
#   2. Set CLOUDFLARE_API_TOKEN environment variable
#
# Usage:
#   ./setup-dns-aid.sh <zone_id> [api_token]
#   CLOUDFLARE_API_TOKEN=xxx ./setup-dns-aid.sh <zone_id>

set -euo pipefail

ZONE_ID="${1:?Usage: $0 <zone_id> [api_token]}"
API_TOKEN="${2:-${CLOUDFLARE_API_TOKEN:?API token required via arg or CLOUDFLARE_API_TOKEN env}}"

BASE_URL="https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records"

add_record() {
  local type="$1" name="$2" content="$3" comment="$4"
  echo "Adding $type record for $name..."
  
  curl -s -X POST "$BASE_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$(cat <<EOF
{
  "type": "$type",
  "name": "$name",
  "content": "$content",
  "ttl": 3600,
  "comment": "$comment"
}
EOF
  )" | jq '.success // false' | grep -q true && echo "  OK" || echo "  FAIL"
}

add_record "HTTPS" "_index._agents.boostmlbb.ru" \
  "1 . alpn=\"h2,h3\"" \
  "DNS-AID: Agent index discovery endpoint"

add_record "SVCB" "_a2a._agents.boostmlbb.ru" \
  "1 boostmlbb.ru. alpn=\"a2a\" port=443" \
  "DNS-AID: Agent-to-Agent protocol endpoint"

echo ""
echo "=== Next Step ==="
echo "Enable DNSSEC in Cloudflare Dashboard:"
echo "  Dashboard > boostmlbb.ru > DNS > DNSSEC > Enable DNSSEC"
