import TurndownService from 'turndown';

const INTERNAL_HEADER = 'x-markdown-internal';
const MARKDOWN_ACCEPT = 'text/markdown';

const DISCOVERY_LINKS = [
  '</.well-known/api-catalog.json>; rel="api-catalog"; type="application/linkset+json"',
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
    if (!['GET', 'HEAD'].includes(request.method)) return fetch(request);
    if (request.headers.get(INTERNAL_HEADER)) {
      return fetch(request);
    }

    const url = new URL(request.url);
    const ext = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (ext && !['html', 'htm'].includes(ext)) {
      return fetch(request);
    }

    const accept = request.headers.get('Accept') || '';

    if (request.method === 'GET' && acceptsMarkdown(accept)) {
      try {
        const response = await handleMarkdown(request);
        if (response) return response;
      } catch {
        // fall through
      }
    }

    const originResponse = await fetch(request);
    return (originResponse.headers.get('Content-Type') || '').startsWith('text/html')
      ? addDiscoveryLinks(originResponse) : originResponse;
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
    status: res.status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(processed.tokenCount),
      'Vary': 'Accept',
      'Content-Signal': 'ai-train=no, search=yes, ai-input=yes',
      'Content-Language': html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'ru',
      'Cache-Control': res.headers.get('Cache-Control') || 'public, max-age=0, must-revalidate',
      'Link': `<${extractCanonical(html) || new URL(request.url).origin + new URL(request.url).pathname}>; rel="canonical"`,
    },
  });

  return addDiscoveryLinks(markdownResponse);
}

function addDiscoveryLinks(response) {
  const newHeaders = new Headers(response.headers);
  const vary = new Set((newHeaders.get('Vary') || '').split(',').map(value => value.trim()).filter(Boolean));
  vary.add('Accept');
  newHeaders.set('Vary', [...vary].join(', '));
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

  cleaned = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || cleaned.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<(?:header|footer)\b[^>]*class=["'][^"']*site-(?:header|footer)[^"']*["'][^>]*>[\s\S]*?<\/(?:header|footer)>/gi, '')
    .replace(/\b(href|src)=["']([^"']+)["']/gi, (match, attr, value) => {
      if (/^(?:data:|javascript:)/i.test(value)) return match;
      try { return `${attr}="${new URL(value, url).href}"`; } catch { return match; }
    });

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
  if (title) fm += `title: ${JSON.stringify(title)}\n`;
  if (description) fm += `description: ${JSON.stringify(description)}\n`;
  if (image) fm += `image: ${JSON.stringify(image)}\n`;
  const canonical = extractCanonical(html);
  if (canonical) fm += `canonical: ${canonical}\n`;
  fm += '---';

  return fm;
}

function extractMeta(html, attr, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const target = tags.find(tag => new RegExp(`\\b${attr}=["']${value}["']`, 'i').test(tag));
  return target?.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || null;
}

function extractCanonical(html) {
  const tag = (html.match(/<link\b[^>]*>/gi) || []).find(tag => /\brel=["']canonical["']/i.test(tag));
  return tag?.match(/\bhref=(["'])([\s\S]*?)\1/i)?.[2] || null;
}

function acceptsMarkdown(accept) {
  const entries = accept.split(',').map(value => {
    const [type, ...parameters] = value.trim().split(';');
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='));
    return { type: type.trim().toLowerCase(), q: quality ? Number(quality.trim().slice(2)) : 1 };
  });
  const markdown = entries.find(entry => entry.type === MARKDOWN_ACCEPT);
  const html = entries.find(entry => entry.type === 'text/html');
  return !!markdown && markdown.q > 0 && Number.isFinite(markdown.q) && (!html || markdown.q >= html.q);
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
