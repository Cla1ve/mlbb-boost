# Auth.md Agent Registration

Agent registration metadata for boostmlbb.ru per
[auth.md spec](https://workos.com/auth-md)
([GitHub](https://github.com/workos/auth.md)).

## File

`/auth.md` at the site root documents:

- Public content access (no auth required)
- API endpoints at `cla1veisapi.ru` (pricing, reviews)
- Telegram bot for order registration

## Implementation

Static file served by GitHub Pages. No OAuth metadata is published
because the site does not offer OAuth-protected APIs — the public API
at `cla1veisapi.ru` and the Telegram bot handle all interactions.
