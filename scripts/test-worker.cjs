const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TurndownService = require('turndown');

const source = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8').replace("import TurndownService from 'turndown';", '').replace('export default {', 'globalThis.worker = {');
async function run({ accept = 'text/html', method = 'GET', status = 200, body, pathname = '/en/article.html', type = 'text/html', vary = 'Accept-Encoding' } = {}) {
  const requests = [];
  const sandbox = { TurndownService, Request, Response, Headers, URL, fetch: async request => {
    requests.push(request);
    return new Response(method === 'HEAD' ? null : body || '<html lang="en"><head><title>Placement guide</title><meta content="Player\'s guide: preparation" name="description"><link href="https://boostmlbb.ru/en/article.html" rel="canonical"></head><body><nav>Global menu</nav><main><article><header><h1>Placement guide</h1></header><p>Useful content <a href="../prices.html">Prices</a></p></article></main></body></html>', { status, headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=600', Vary: vary } });
  } };
  vm.runInNewContext(source, sandbox);
  const response = await sandbox.worker.fetch(new Request('https://boostmlbb.ru' + pathname, { method, headers: { Accept: accept } }));
  return { response, text: await response.text(), requests };
}
(async () => {
  const markdown = await run({ accept: 'text/markdown' });
  assert.equal(markdown.response.status, 200);
  assert(markdown.response.headers.get('content-type').startsWith('text/markdown'));
  assert.equal(markdown.response.headers.get('content-language'), 'en');
  assert.equal(markdown.response.headers.get('cache-control'), 'public, max-age=600');
  assert(markdown.text.includes('# Placement guide'));
  assert(markdown.text.includes("Player's guide: preparation"));
  assert(markdown.text.includes('canonical: https://boostmlbb.ru/en/article.html'));
  assert(markdown.text.includes('[Prices](https://boostmlbb.ru/prices.html)'));
  assert(!markdown.text.includes('Global menu'));
  assert.equal(markdown.requests[0].headers.get('x-markdown-internal'), '1');
  for (const accept of ['text/markdown;q=0', 'text/html;q=1,text/markdown;q=.5', 'text/html', 'text/markdown;q=invalid']) {
    const html = await run({ accept });
    assert(html.response.headers.get('content-type').startsWith('text/html'));
    assert.equal(html.response.headers.get('vary'), 'Accept-Encoding, Accept');
  }
  for (const status of [404, 500]) {
    const failure = await run({ accept: 'text/markdown', status });
    assert.equal(failure.response.status, status, 'Failed pages must retain the HTTP error status');
    assert(failure.response.headers.get('content-type').startsWith('text/html'));
  }
  const asset = await run({ pathname: '/images/icon.svg', accept: 'text/markdown', type: 'image/svg+xml', body: '<svg/>' });
  assert.equal(asset.response.headers.get('content-type'), 'image/svg+xml');
  assert.equal(asset.response.headers.get('link'), null);
  const head = await run({ method: 'HEAD', accept: 'text/markdown' });
  assert.equal(head.text, '');
  assert(head.response.headers.get('content-type').startsWith('text/html'));
  console.log('Markdown worker: negotiation, quoted metadata, article headings, absolute links, cache variants and origin error statuses passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
