// Notify IndexNow engines (Yandex, Bing and partners) about changed public URLs.
// Usage after a deploy: node scripts/indexnow.mjs [url ...]   (no arguments = every sitemap URL)
const host = 'boostmlbb.ru';
const key = '4de65f4422ad3883aae2c2956a70256a';
const keyLocation = `https://${host}/${key}.txt`;
let urlList = process.argv.slice(2);
if (!urlList.length) {
  const xml = await (await fetch(`https://${host}/sitemap.xml`)).text();
  urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}
const live = await fetch(keyLocation);
if (!live.ok || (await live.text()).trim() !== key) throw new Error(`Key file is not live at ${keyLocation}`);
for (const endpoint of ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow']) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList })
  });
  console.log(`${endpoint}: HTTP ${response.status}, ${urlList.length} URLs`);
}
