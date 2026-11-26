// The /skins/ section: search and role filter on the hub, class filter on a hero page, full-screen art on a skin page.
(() => {
  const en = document.documentElement.lang === 'en';
  const prefix = en ? '/en' : '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TIER_COLOR = { Common: '#8fa3b6', Exceptional: '#4fb97b', Deluxe: '#4f9ee8', Exquisite: '#a77bf3', Grand: '#f0a24d', Supreme: '#ef6b6b' };
  const TIER_RU = { Common: 'Обычный', Exceptional: 'Исключительный', Deluxe: 'Делюкс', Exquisite: 'Изысканный', Grand: 'Грандиозный', Supreme: 'Высший' };
  const norm = text => String(text || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  // Soft hyphens in long words, as on the server-rendered cards (Chrome on Windows does not hyphenate Russian).
  const soft = text => String(text).replace(/[А-Яа-яЁёA-Za-z]{11,}/g, word => { const V = /[аеёиоуыэюяaeiouy]/i, C = /[бвгджзклмнпрстфхцчшщbcdfghjklmnpqrstvwxz]/i; const middle = Math.floor(word.length / 2); for (let offset = 0; offset < middle - 2; offset++) for (const at of [middle + offset, middle - offset]) { if (at < 3 || at > word.length - 3) continue; if (C.test(word[at]) && V.test(word[at + 1]) && (V.test(word[at - 1]) || (C.test(word[at - 1]) && V.test(word[at - 2])))) return word.slice(0, at) + '\u00ad' + word.slice(at); } return word; });
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Cards that become visible rise in one after another (a short stagger, capped).
  const enter = nodes => {
    if (reduce) return;
    nodes.forEach((node, i) => {
      node.style.setProperty('--i', i);
      node.classList.remove('is-entering');
      void node.offsetWidth;
      node.classList.add('is-entering');
      node.addEventListener('animationend', () => node.classList.remove('is-entering'), { once: true });
    });
  };

  // ---------- Hub ----------
  const hub = document.querySelector('[data-skins-hub]');
  if (hub) {
    const tools = hub.querySelector('.skins-tools');
    const input = hub.querySelector('#skin-query');
    const roleButtons = [...hub.querySelectorAll('[data-skin-role]')];
    const heroCards = [...hub.querySelectorAll('.hcard')];
    const newBlock = hub.querySelector('[data-skins-new]');
    const found = hub.querySelector('[data-skins-found]');
    const results = hub.querySelector('[data-skins-results]');
    const more = hub.querySelector('[data-skins-more]');
    const heroesTitle = hub.querySelector('[data-heroes-title]');
    const heroesBlock = hub.querySelector('#heroes');
    const empty = hub.querySelector('#skin-empty');
    const status = hub.querySelector('#skin-status');
    const heroNames = Object.fromEntries(heroCards.map(cardNode => [cardNode.getAttribute('href').split('/').pop().replace('.html', ''), cardNode.querySelector('b').textContent]));
    const heroSearch = Object.fromEntries(heroCards.map(cardNode => [cardNode.getAttribute('href').split('/').pop().replace('.html', ''), norm(cardNode.dataset.hero)]));
    tools.hidden = false;

    // The toolbar gets a hairline once it sticks under the header.
    const sentinel = document.createElement('div');
    tools.before(sentinel);
    new IntersectionObserver(([entry]) => tools.classList.toggle('is-stuck', !entry.isIntersecting), { rootMargin: '-72px 0px 0px 0px' }).observe(sentinel);

    let index = null;
    let loading = null;
    const loadIndex = () => loading ||= fetch('/skins/search.json').then(response => response.json()).then(json => {
      index = json.skins.map(([hero, slug, ru, english, tier, year, roles, series = '']) => ({ hero, slug, ru, en: english, tier, year, roles, text: norm(`${ru} ${english}`), more: norm(`${heroSearch[hero] || ''} ${series}`) }));
    }).catch(() => { index = []; });
    input.addEventListener('focus', loadIndex, { once: true });

    let role = '';
    let shown = 0;
    let matches = [];
    const PAGE = 36;
    const skinCard = (row, i) => {
      const meta = [heroNames[row.hero], row.year].filter(Boolean).join(' · ');
      const name = en ? row.en : row.ru;
      return `<a class="scard" href="${prefix}/skins/${row.hero}/${row.slug}.html" style="--tier:${TIER_COLOR[row.tier] || '#8fa3b6'}"><span class="scard__img"><img src="/images/skins/cards/${row.hero}/${row.slug}.webp" width="240" height="390" alt="" loading="lazy" decoding="async"></span><span class="scard__name">${esc(soft(name))}</span><span class="scard__meta">${esc(meta)}</span></a>`;
    };
    const renderMore = () => {
      const next = matches.slice(shown, shown + PAGE);
      const start = results.children.length;
      results.insertAdjacentHTML('beforeend', next.map(skinCard).join(''));
      enter([...results.children].slice(start));
      shown += next.length;
      more.hidden = shown >= matches.length;
    };
    const say = text => { status.textContent = text; };
    const words = (n, forms) => { const a = n % 100, b = n % 10; return forms[a > 10 && a < 15 ? 2 : b === 1 ? 0 : b > 1 && b < 5 ? 1 : 2]; };

    function apply({ animate = true } = {}) {
      const q = norm(input.value);
      const terms = q.split(' ').filter(Boolean);
      const hit = text => terms.every(term => text.includes(term));
      // Heroes: by role and by hero name; they come first, the skins below.
      const visible = [];
      for (const cardNode of heroCards) {
        // A hero card shows when its name matches; a skin-name match goes to the skin list below, not to a hero card.
        const ok = (!role || cardNode.dataset.roles.split(' ').includes(role)) && (!terms.length || hit(norm(cardNode.dataset.hero)));
        if (ok && cardNode.hidden) visible.push(cardNode);
        cardNode.hidden = !ok;
      }
      const heroCount = heroCards.filter(cardNode => !cardNode.hidden).length;
      newBlock.hidden = Boolean(terms.length || role);
      // Skins: only while searching; a hero name alone shows the hero card, a skin name shows the skin cards.
      matches = [];
      if (terms.length && index) {
        matches = index.filter(row => (!role || row.roles.split(' ').includes(role)) && (hit(row.text) || hit(`${row.more} ${row.text}`)));
        // Skin-name hits first, newest first inside each group.
        matches.sort((a, b) => Number(hit(b.text)) - Number(hit(a.text)) || (b.year || '').localeCompare(a.year || ''));
      }
      results.innerHTML = '';
      shown = 0;
      found.hidden = !matches.length;
      if (matches.length) {
        found.querySelector('h2').textContent = en ? `Skins · ${matches.length}` : `Скины · ${matches.length}`;
        renderMore();
      }
      heroesBlock.hidden = !heroCount;
      heroesTitle.textContent = terms.length || role ? (en ? `Heroes · ${heroCount}` : `Герои · ${heroCount}`) : (en ? 'Heroes' : 'Герои');
      empty.hidden = Boolean(heroCount || matches.length) || (terms.length > 0 && !index);
      if (animate) enter(visible);
      say(terms.length || role ? (en ? `${heroCount} heroes, ${matches.length} skins` : `${heroCount} ${words(heroCount, ['герой', 'героя', 'героев'])}, ${matches.length} ${words(matches.length, ['скин', 'скина', 'скинов'])}`) : '');
      // The state lives in the address, so a search can be shared and survives the back button.
      const url = new URL(location.href);
      q ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
      role ? url.searchParams.set('role', role) : url.searchParams.delete('role');
      history.replaceState(history.state, '', url);
    }

    let timer = 0;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => { if (norm(input.value) && !index) await loadIndex(); apply(); }, 140);
    });
    input.addEventListener('keydown', event => { if (event.key === 'Escape' && input.value) { input.value = ''; apply(); } });
    more.addEventListener('click', renderMore);
    for (const button of roleButtons) button.addEventListener('click', () => {
      role = button.dataset.skinRole;
      roleButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      apply();
    });
    hub.querySelector('[data-skin-reset]').addEventListener('click', () => {
      input.value = ''; role = '';
      roleButtons.forEach(other => other.setAttribute('aria-pressed', String(other.dataset.skinRole === '')));
      apply(); input.focus();
    });
    // Restore a shared or remembered state.
    const params = new URLSearchParams(location.search);
    if (params.get('role') && roleButtons.some(button => button.dataset.skinRole === params.get('role'))) {
      role = params.get('role');
      roleButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.skinRole === role)));
    }
    if (params.get('q')) { input.value = params.get('q'); loadIndex().then(() => apply({ animate: false })); }
    else if (role) apply({ animate: false });
  }

  // ---------- Hero page: class filter ----------
  const tierbar = document.querySelector('.skin-tierbar');
  if (tierbar) {
    tierbar.hidden = false;
    const buttons = [...tierbar.querySelectorAll('[data-skin-tier]')];
    const cards = [...document.querySelectorAll('#all .scard[data-tier]')];
    for (const button of buttons) button.addEventListener('click', () => {
      const tier = button.dataset.skinTier;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const shownNow = [];
      for (const cardNode of cards) {
        const ok = !tier || cardNode.dataset.tier === tier;
        if (ok) shownNow.push(cardNode);
        cardNode.hidden = !ok;
      }
      enter(shownNow);
    });
  }

  // ---------- Skin page: full-screen art, the current card in view ----------
  const dialog = document.querySelector('[data-skin-zoom]');
  if (dialog) {
    const image = dialog.querySelector('img');
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-zoom]');
      if (trigger) { image.src = trigger.dataset.zoom; dialog.showModal(); return; }
      if (event.target.closest('[data-zoom-close]') || event.target === dialog || event.target === image) dialog.close();
    });
  }
  for (const rail of document.querySelectorAll('.rail')) {
    const current = rail.querySelector('.is-current');
    if (current) rail.scrollLeft = Math.max(0, current.offsetLeft - rail.offsetLeft - 16);
  }
})();
