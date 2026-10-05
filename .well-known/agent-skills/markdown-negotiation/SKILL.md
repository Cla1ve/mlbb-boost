# Static Markdown alternatives

The production website is hosted on GitHub Pages. `Accept: text/markdown`
does not currently change its HTML response. Do not assume negotiation is active.

Each commercial, policy and guide HTML page declares a static alternative:

```html
<link rel="alternate" type="text/markdown" href="/markdown/en/prices.md">
```

Examples:
- https://boostmlbb.ru/markdown/index.md
- https://boostmlbb.ru/markdown/en/prices.md
- https://boostmlbb.ru/markdown/en/guides/mythic-placement.md
- https://boostmlbb.ru/llms.txt
- https://boostmlbb.ru/llms-full.txt

These resources contain the same public content as the HTML pages, with canonical
URLs in their frontmatter. GitHub Pages may serve `.md` as plain text; the file
body is Markdown. The optional Worker in `src/index.js` supports negotiation only
after separate deployment and route configuration. It is not the production host.
