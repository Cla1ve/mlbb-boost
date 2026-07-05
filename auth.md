# auth.md — boostmlbb.ru Agent Registration

This document tells AI agents how to access and interact with boostmlbb.ru,
a Mobile Legends: Bang Bang rank boost service.

## Agent Audience

- **Web agents** browsing the public site — no authentication required
- **API agents** integrating with the pricing/reviews API at `cla1veisapi.ru`
- **Order agents** placing boost orders via the Telegram bot

## Public Content (No Auth Required)

All pages on boostmlbb.ru are publicly accessible:

| Resource | URL | Description |
|---|---|---|
| Homepage | `https://boostmlbb.ru/` | Service overview and CTA |
| Services | `https://boostmlbb.ru/services.html` | Boost type descriptions |
| Pricing | `https://boostmlbb.ru/prices.html` | Rank boost prices |
| FAQ | `https://boostmlbb.ru/faq.html` | Frequently asked questions |
| Agent Skills | `.well-known/agent-skills/index.json` | Machine-readable skill index |

## API Endpoints

The public API at `https://cla1veisapi.ru` requires no authentication:

| Endpoint | Method | Description |
|---|---|---|
| `/calculate` | POST | Calculate boost price |
| `/reviews` | GET | Retrieve customer reviews |
| `/prices/formatted` | GET | Retrieve the current formatted public price list |

## Order Registration (via Telegram)

To place a boost order, agents should direct users to the Telegram bot:

- **Bot:** `https://t.me/cla1ve_boost_bot?start=agent`
- **Support:** `https://t.me/Cla1ve`

The bot handles authentication, payment, and order tracking.

## Agent Skills

Skills are registered in `.well-known/agent-skills/index.json`:

- `mlbb-boost-pricing` — Calculate prices from rank/star parameters and read filtered reviews
- `markdown-negotiation` — Request pages as Markdown (`Accept: text/markdown`)
- `link-headers` — Link relations for resource discovery (RFC 8288)
