# Public resource discovery

Production on GitHub Pages uses HTML links in each page's `<head>`:

```html
<link rel="api-catalog" type="application/linkset+json" href="/.well-known/api-catalog.json">
<link rel="service-desc" href="/.well-known/agent-skills/index.json">
<link rel="service-doc" href="/faq.html">
<link rel="describedby" href="/about.html">
```

The `.json` catalog is directly accessible as JSON. The extensionless catalog is
retained for compatibility, but GitHub Pages serves it as an octet stream.
Use https://boostmlbb.ru/llms.txt for additional content discovery.

The optional Cloudflare Worker can also add RFC 8288 HTTP `Link` headers after
deployment. These HTTP headers are not currently emitted by GitHub Pages.
