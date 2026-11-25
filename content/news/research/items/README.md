# Item data (25.11.2026)

`content/items.json` is built once from these files; the site reads only that file.

- `academy-equipment*.json`: in-game Academy data through the Rone Arena API (`/academy/equipment`, `/academy/equipment/expanded`, `size=300`). Attributes, effect texts, icons and "builds into" links. Effect texts are current; prices are not in this API.
- `liquipedia-items-2026-11-25.json`: Liquipedia wikitext of every page in `Template:Equipment` (CC BY-SA). Stories, passive names, part counts. Prices and some recipes there are older than the game.
- Prices: the owner's in-game screenshots of 25.11.2026 (they win over Liquipedia, see `PRICE_FIX` in `structure.mjs`).
- Recipes: direct parts from the Academy "builds into" links, counts from Liquipedia. Cursed Helmet: the Academy lists four parts worth more than the item, Liquipedia's three-part recipe is used.
- `texts-ru.mjs`: Russian names (as in the game client) and translated effect texts and stories. Edit it, then run `parse.mjs`, `structure.mjs`, `make-data.mjs` from a scratch folder with `raw/` holding the JSON files.
- Blessings (jungle and roam) are described in `scripts/item-pages.mjs`. Exact numbers only where checked in the game (Flame Retribution, Encourage) or the Academy (Conceal, hunter boots).
