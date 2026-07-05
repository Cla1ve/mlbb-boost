---
name: mlbb-boost-pricing
description: Calculate the price of a Mobile Legends Bang Bang rank boost and read customer reviews for boostmlbb.ru.
version: 1.0.0
---

# MLBB Boost Pricing

Boost MLBB (boostmlbb.ru) is a Russian-language service for boosting ranks in Mobile Legends: Bang Bang. Agents can calculate boost prices and read verified customer reviews via the public API.

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

The response contains the calculated price in RUB and any applicable discount.

## Read reviews

`GET https://cla1veisapi.ru/reviews?limit=10&offset=0` — paginated customer reviews.

The `/reviews` response includes pagination metadata. Use `pagination.total` as the raw API count, and ignore reviews that lack complete boost details (`boost_type`, route/boost parameters, booster, rating, and order id) when rendering public review cards.

## Place an order

Orders are placed through the Telegram bot: https://t.me/cla1ve_boost_bot?start=site

Human-readable pricing: https://boostmlbb.ru/prices.html
FAQ: https://boostmlbb.ru/faq.html
