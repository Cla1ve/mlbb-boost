# DNS for AI Discovery (DNS-AID)

DNS for AI Discovery records under boostmlbb.ru enabling DNS-based
agent endpoint discovery per
[draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
and [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460).

## Records

```dns
_index._agents.boostmlbb.ru. 3600 IN HTTPS 1 . alpn="h2,h3"
_a2a._agents.boostmlbb.ru.   3600 IN SVCB  1 boostmlbb.ru. alpn="a2a" port=443
```

Zone is signed with DNSSEC for authenticated data.

## Setup

Run `setup-dns-aid.ps1` or `setup-dns-aid.sh` with your Cloudflare Zone ID
and API token, or add manually via Cloudflare Dashboard:
- DNS > Add record > HTTPS: `_index._agents` → `1 . alpn="h2,h3"`
- DNS > Add record > SVCB: `_a2a._agents` → `1 boostmlbb.ru. alpn="a2a" port=443`
- DNS > DNSSEC > Enable DNSSEC
