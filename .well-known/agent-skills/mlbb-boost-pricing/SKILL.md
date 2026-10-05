---
name: mlbb-boost-pricing
description: Calculate the price of a Mobile Legends Bang Bang rank boost and read customer reviews for boostmlbb.ru.
version: 1.1.0
---

# MLBB Boost Pricing

MLBB Boost (boostmlbb.ru) is an independent service for arranging Mobile Legends: Bang Bang game services. Russian and English HTML pages are public. Agents can calculate base estimates and read published customer reviews via the public API. Reviews are not independently certified.

## Calculate a boost price

`POST https://cla1veisapi.ru/calculate`

Request body (JSON):

```json
{
  "rank_from": "Эпик V 1 звезд",
  "rank_to": "Легенда V 1 звезд",
  "boost_type": "standard",
  "weak_account_markup": 0
}
```

- `rank_from` / `rank_to` — rank names in Russian, format: `"<Ранг> <Ступень> <N> звезд"`. Ranks: Воин, Элита, Мастер, Грандмастер, Эпик, Легенда, Мифик.
- `boost_type` — `"standard"`, `"role"`, `"hero"`, or `"party"`.
- `weak_account_markup` — surcharge percent for weak accounts (0–30).

The response contains a base calculated price in RUB. The website applies a conditional first-order discount separately; do not infer that the API applies it. Estimated timing and win rate are service estimates, not guarantees. Confirm the final terms with support before payment.

## Current rates and placement

`GET https://cla1veisapi.ru/prices/formatted` returns the current per-rank rates. Ordinary rank routes are charged per star; Mythic placement uses per-win rates. Honor, Glory and Immortal use their own rate categories. Routes spanning ranks sum the rate of each part.

For placement-aware request fields, consult the live [OpenAPI description](https://cla1veisapi.ru/openapi.json) and the [calculator](https://boostmlbb.ru/en/order.html). Do not invent missing placement status or wins; obtain those details from the user. An entry-only Mythic target ends at zero stars and does not add placement wins.

The rank boost minimum is 5 stars. Account surcharge and first-order discount eligibility must be confirmed. Never submit payment or disclose account credentials on behalf of a user without their explicit authorization.

## Read reviews

`GET https://cla1veisapi.ru/reviews?limit=10&offset=0` — paginated customer reviews.

The `/reviews` response includes pagination metadata. Use `pagination.total` as the raw API count, and ignore reviews that lack complete boost details (`boost_type`, route/boost parameters, booster, rating, and order id) when rendering public review cards.

## Place an order

Orders are placed through the Telegram bot: https://t.me/cla1ve_boost_bot?start=site

Human-readable pricing: https://boostmlbb.ru/prices.html
FAQ: https://boostmlbb.ru/faq.html
English pricing: https://boostmlbb.ru/en/prices.html
Format comparison: https://boostmlbb.ru/en/guides/party-boost.html
Placement guide: https://boostmlbb.ru/en/guides/mythic-placement.html
