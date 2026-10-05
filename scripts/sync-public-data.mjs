import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'content/public-data.json');
const api = 'https://cla1veisapi.ru';
const categories = ['warrior_elite', 'master_gm', 'epic', 'legend', 'mythic_calibration', 'mythic', 'honor', 'glory', 'immortal'];
const types = ['standard', 'role', 'hero', 'party'];
const hasText = value => value != null && String(value).trim().length > 0;

// Match the public UI's inclusion rules; never expose payment/contact/account fields.
export function completeReview(r) {
  if (!r || r.id == null || !(Number(r.rating) >= 1 && Number(r.rating) <= 5)
      || !hasText(r.order_short) || !hasText(r.booster?.name)) return false;
  if (['rising_login', 'rising_party'].includes(r.boost_type)) {
    return !!r.rising && (hasText(r.rising.stage_name) || hasText(r.rising.stage) || r.rising.wins_required != null);
  }
  if (!types.includes(r.boost_type) || !hasText(r.rank_from) || !hasText(r.rank_to)) return false;
  if (r.boost_type === 'hero') return hasText(r.hero);
  if (['role', 'party'].includes(r.boost_type)) return hasText(r.preferred_role) || hasText(r.client_role) || hasText(r.booster_role);
  return hasText(r.duration);
}

async function get(endpoint) {
  const response = await fetch(api + endpoint, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Public API ${endpoint}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.success !== true || !Array.isArray(data.data)) throw new Error(`Invalid public API response: ${endpoint}`);
  return data;
}

async function sync() {
  const prices = (await get('/prices/formatted')).data;
  if (prices.length !== categories.length || new Set(prices.map(p => p.category)).size !== categories.length) throw new Error('Incomplete price categories');
  for (const category of categories) {
    const row = prices.find(p => p.category === category);
    if (!row || types.some(type => !row.prices?.some(p => p.type === type && Number.isFinite(p.price) && p.price > 0))) throw new Error(`Incomplete prices: ${category}`);
  }
  const raw = [];
  let total = Infinity;
  for (let offset = 0; offset < total; offset += 100) {
    const page = await get(`/reviews?limit=100&offset=${offset}`);
    total = Number(page.pagination?.total);
    if (!Number.isInteger(total) || total < 0 || total > 100000) throw new Error('Invalid review pagination');
    if (!page.data.length && offset < total) throw new Error('Incomplete review pagination');
    raw.push(...page.data);
  }
  const complete = [...new Map(raw.filter(completeReview).map(r => [String(r.id), r])).values()];
  if (!complete.length) throw new Error('No complete public reviews');
  const safe = complete.filter(r => hasText(r.text) && /^https:\/\/t\.me\//.test(r.message_link || '')).slice(0, 6).map(r => ({
    id: r.id, rating: Number(r.rating), text: String(r.text), messageLink: r.message_link,
  }));
  const payload = {
    source: api, prices,
    reviewStats: {
      count: complete.length,
      rating: Number((complete.reduce((sum, r) => sum + Number(r.rating), 0) / complete.length).toFixed(1)),
      satisfaction: Math.floor(complete.filter(r => Number(r.rating) >= 4).length / complete.length * 100)
    }, reviews: safe
  };
  let previous;
  try { previous = JSON.parse(await readFile(target, 'utf8')); } catch {}
  if (previous) {
    const { checkedAt, ...oldPayload } = previous;
    if (JSON.stringify(oldPayload) === JSON.stringify(payload)) {
      console.log('Public prices and published review snapshot unchanged.');
      return;
    }
  }
  const content = JSON.stringify({ checkedAt: new Date().toISOString(), ...payload }, null, 2) + '\n';
  await writeFile(target + '.tmp', content);
  await rename(target + '.tmp', target);
  console.log(`Updated public snapshot: ${prices.length} price categories, ${complete.length} published reviews.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await sync();
