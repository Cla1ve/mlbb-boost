// Item catalog: search by Russian or English name and the shop tabs. Without JavaScript every tab stays visible.
(() => {
  const tools = document.querySelector('.items-page .atlas-tools');
  if (!tools) return;
  const language = document.documentElement.lang;
  const query = tools.querySelector('input');
  const buttons = [...tools.querySelectorAll('[data-item-tab]')];
  const board = document.querySelector('.shop-board');
  const sections = [...board.querySelectorAll('.shop')];
  const empty = document.getElementById('item-empty');
  const status = document.getElementById('item-status');
  const normalize = text => text.toLowerCase().replaceAll('ё', 'е').trim();
  const cards = sections.flatMap(section => [...section.querySelectorAll('.ware, .part')].map(card => ({ card, section, names: normalize(card.dataset.names || card.textContent) })));
  const state = new URLSearchParams(location.search);
  let tab = buttons.some(button => button.dataset.itemTab === state.get('tab')) ? state.get('tab') : '';
  // A link to /items/#magic opens that tab.
  if (!tab && location.hash && buttons.some(button => button.dataset.itemTab === location.hash.slice(1))) tab = location.hash.slice(1);
  query.value = state.get('q') || '';

  function render() {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    // "All" shows each item once; a tab, or a search, shows every item of its tabs as the game does.
    board.toggleAttribute('data-all', !tab && !searching);
    const seen = new Set();
    let shown = 0;
    for (const section of sections) section.hidden = Boolean(tab) && section.dataset.tab !== tab;
    for (const { card, section, names } of cards) {
      const visible = !section.hidden && words.every(word => names.includes(word)) && !(searching && !tab && seen.has(card.getAttribute('href')));
      card.hidden = !visible;
      if (visible) { seen.add(card.getAttribute('href')); shown++; }
    }
    for (const section of sections) {
      const rest = section.querySelector('.shop-rest');
      if (rest) rest.hidden = !rest.querySelector('.part:not([hidden])');
      const grid = section.querySelector('.shop-grid');
      grid.hidden = !grid.querySelector('.ware:not([hidden])');
      if (!section.hidden) section.hidden = !section.querySelector('.ware:not([hidden]), .part:not([hidden])');
    }
    empty.hidden = shown > 0;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.itemTab === tab));
    status.textContent = language === 'en' ? `Items shown: ${shown}` : `Показано предметов: ${shown}`;
    const url = new URL(location.href);
    url.hash = '';
    for (const [key, value] of [['tab', tab], ['q', query.value.trim()]]) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    history.replaceState(history.state, '', url);
  }
  for (const button of buttons) button.addEventListener('click', () => { tab = button.dataset.itemTab; render(); });
  query.addEventListener('input', render);
  document.querySelector('[data-item-reset]')?.addEventListener('click', () => { tab = ''; query.value = ''; render(); query.focus(); });
  tools.hidden = false;
  render();
})();
