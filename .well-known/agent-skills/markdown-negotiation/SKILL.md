# Markdown Content Negotiation

Support `Accept: text/markdown` content negotiation so agents can request
markdown versions of pages on boostmlbb.ru.
See [llmstxt.org](https://llmstxt.org/) and
[Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

## Usage

Request any page with the `Accept: text/markdown` header:

```bash
curl https://boostmlbb.ru/ -H "Accept: text/markdown"
```

The response will include:
- `Content-Type: text/markdown`
- `x-markdown-tokens` with estimated token count

## Implementation

Enabled via Cloudflare Worker (`src/index.js`) using Turndown for
HTML-to-Markdown conversion. Strips navigation, header, footer, scripts,
and styles before conversion. Preserves JSON-LD structured data and
YAML frontmatter from meta tags.
