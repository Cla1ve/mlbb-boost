import TurndownService from 'turndown';

const INTERNAL_HEADER = 'x-markdown-internal';
const MARKDOWN_ACCEPT = 'text/markdown';

const DISCOVERY_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-skills/index.json>; rel="service-desc"',
  '</faq.html>; rel="service-doc"',
  '</about.html>; rel="describedby"',
];

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  linkStyle: 'inlined',
});

export default {
  async fetch(request) {
    if (request.headers.get(INTERNAL_HEADER)) {
      return fetch(request);
    }

    const url = new URL(request.url);
    const ext = url.pathname.split('.').pop().toLowerCase();
    if (ext && !['html', 'htm', ''].includes(ext) && !url.pathname.endsWith('/')) {
      return fetch(request);
    }

    const accept = request.headers.get('Accept') || '';

    if (accept.includes(MARKDOWN_ACCEPT)) {
      try {
        const response = await handleMarkdown(request);
        if (response) return response;
      } catch {
        // fall through
      }
    }

    const originResponse = await fetch(request);
    return addDiscoveryLinks(originResponse);
  },
};

async function handleMarkdown(request) {
  const headers = new Headers(request.headers);
  headers.set('Accept', 'text/html');
  headers.set(INTERNAL_HEADER, '1');

  const req = new Request(request, { headers });
  const res = await fetch(req);

  if (!res.ok) return null;
  const ct = res.headers.get('Content-Type') || '';
  if (!ct.startsWith('text/html')) return null;

  const html = await res.text();
  const processed = processHTML(html, new URL(request.url));

  const markdownResponse = new Response(processed.markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(processed.tokenCount),
      'Vary': 'Accept',
      'Content-Signal': 'ai-train=no, search=yes, ai-input=yes',
    },
  });

  return addDiscoveryLinks(markdownResponse);
}

function addDiscoveryLinks(response) {
  const newHeaders = new Headers(response.headers);
  for (const link of DISCOVERY_LINKS) {
    newHeaders.append('Link', link);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function processHTML(html, url) {
  let cleaned = html;

  const frontmatter = buildFrontmatter(cleaned);
  const jsonldBlocks = extractJSONLD(cleaned);

  cleaned = cleaned
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  let markdown = turndownService.turndown(cleaned);

  if (frontmatter) {
    markdown = frontmatter + '\n' + markdown;
  }

  if (jsonldBlocks.length > 0) {
    markdown += '\n\n```json\n' + jsonldBlocks.join('\n\n') + '\n```\n';
  }

  markdown = markdown.replace(/\n{4,}/g, '\n\n\n');

  const tokenCount = estimateTokens(markdown);

  return { markdown, tokenCount };
}

function buildFrontmatter(html) {
  const title = extractMeta(html, 'name', 'title') || extractMeta(html, 'property', 'og:title') || extractTitle(html);
  const description = extractMeta(html, 'name', 'description') || extractMeta(html, 'property', 'og:description');
  const image = extractMeta(html, 'property', 'og:image');

  if (!title && !description && !image) return '';

  let fm = '---\n';
  if (title) fm += `title: ${title}\n`;
  if (description) fm += `description: ${description}\n`;
  if (image) fm += `image: ${image}\n`;
  fm += '---';

  return fm;
}

function extractMeta(html, attr, value) {
  const re = new RegExp(`<meta\\s+${attr}="${value}"\\s+content="([^"]*)"`, 'i');
  const match = html.match(re);
  return match ? match[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractJSONLD(html) {
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.stringify(JSON.parse(match[1]), null, 2));
    } catch {
      blocks.push(match[1].trim());
    }
  }
  return blocks;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
