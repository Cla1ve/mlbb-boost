# Link Response Headers

Link response headers for agent discovery per
[RFC 8288](https://www.rfc-editor.org/rfc/rfc8288).

## Headers

Every HTML page on boostmlbb.ru includes these Link headers:

```http
Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"
Link: </.well-known/agent-skills/index.json>; rel="service-desc"
Link: </faq.html>; rel="service-doc"
Link: </about.html>; rel="describedby"
```

## Implementation

Added via:
1. **Cloudflare Worker** (`src/index.js`) — injects `Link` HTTP headers on every HTML response
2. **HTML `<link>` tags** — embedded in `<head>` of all pages for GitHub Pages compatibility
