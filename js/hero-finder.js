(() => {
  const language = document.documentElement.lang;

  // "Updated N days ago" from the data stamp; the server-rendered date stays if anything fails.
  for (const node of document.querySelectorAll('time[data-ago]')) {
    try {
      const [y, m, d] = node.dateTime.split('-').map(Number);
      const now = new Date();
      const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 864e5);
      if (days < 0 || days > 60) continue;
      const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-days, 'day');
      node.textContent = (language === 'en' ? 'Updated ' : 'Обновлено ') + relative;
      node.title = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
    } catch { /* keep the date */ }
  }

  const tools = document.querySelector('.atlas-tools');
  if (!tools) return;
  const query = tools.querySelector('input');
  const filters = [...tools.querySelectorAll('[data-hero-filter]')].map(group => ({
    group, key: group.dataset.heroFilter, buttons: [...group.querySelectorAll('button')], value: ''
  }));
  const board = document.querySelector('.tier-board');
  const rows = [...board.querySelectorAll('.tier-row')];
  const switcher = document.querySelector('.tier-views');
  const table = document.querySelector('.tier-stats');
  const empty = document.getElementById('hero-empty');
  const sortButtons = [...table.querySelectorAll('[data-hero-sort]')];
  const percent = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const collator = new Intl.Collator(language);
  const normalize = text => text.toLowerCase().replaceAll('ё', 'е').trim();
  const columns = sortButtons.map(button => button.dataset.heroSort).filter(key => !['name', 'rank'].includes(key));
  const entries = [...board.querySelectorAll('.tile')].map(tile => ({
    tile, tier: tile.dataset.tier, ...tile.dataset,
    names: normalize(tile.dataset.names), lanes: tile.dataset.lanes.split('|')
  }));
  const state = new URLSearchParams(location.search);
  query.value = state.get('q') || '';
  for (const filter of filters) {
    const value = state.get(filter.key);
    if (filter.buttons.some(button => button.dataset.filterValue === value)) filter.value = value;
  }
  let view = state.get('view') === 'stats' ? 'stats' : 'tiers';
  let sort = sortButtons.some(button => button.dataset.heroSort === state.get('sort')) ? state.get('sort') : 'rank';
  let ascending = state.has('dir') ? state.get('dir') === 'asc' : sort === 'rank';

  function updateUrl() {
    const url = new URL(location.href);
    const defaultDirection = sort === 'rank' || sort === 'name';
    url.searchParams.delete('show');
    for (const [key, value] of Object.entries({
      q: query.value.trim(), ...Object.fromEntries(filters.map(filter => [filter.key, filter.value])),
      view: view === 'stats' ? view : '', sort: sort !== 'rank' ? sort : '',
      dir: ascending !== defaultDirection ? (ascending ? 'asc' : 'desc') : ''
    })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
  }

  function renderTable(matches) {
    const compare = sort === 'name' ? (a, b) => collator.compare(a.name, b.name) : (a, b) => Number(a[sort]) - Number(b[sort]);
    matches.sort((a, b) => (ascending ? 1 : -1) * compare(a, b) || Number(a.rank) - Number(b.rank));
    const fragment = document.createDocumentFragment();
    for (const entry of matches) {
      const row = document.createElement('tr');
      const hero = document.createElement('th');
      hero.scope = 'row';
      const link = document.createElement('a');
      link.href = entry.tile.getAttribute('href');
      link.className = 'row-hero';
      const image = entry.tile.querySelector('img').cloneNode();
      image.removeAttribute('loading');
      const name = document.createElement('span');
      name.textContent = entry.name;
      link.append(image, name);
      hero.append(link);
      row.append(hero);
      row.insertCell().innerHTML = '<b class="grade" data-grade="' + entry.tier + '">' + entry.tier + '</b>';
      for (const key of columns) {
        const cell = row.insertCell();
        cell.textContent = percent.format(Number(entry[key])) + '%';
        cell.className = 'is-' + key;
      }
      fragment.append(row);
    }
    table.tBodies[0].replaceChildren(fragment);
    for (const button of sortButtons) {
      const header = button.parentElement;
      if (button.dataset.heroSort === sort) header.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      else header.removeAttribute('aria-sort');
    }
  }

  function render() {
    const term = normalize(query.value);
    const lane = filters.find(filter => filter.key === 'lane')?.value || '';
    const matches = entries.filter(entry =>
      (entry.names.includes(term) || entry.slug.includes(term)) &&
      (!lane || entry.lanes.includes(lane))
    );
    const shown = new Set(matches.map(entry => entry.tile));
    for (const entry of entries) entry.tile.hidden = !shown.has(entry.tile);
    for (const row of rows) {
      const count = row.querySelectorAll('.tile:not([hidden])').length;
      row.hidden = !count;
    }
    board.hidden = view !== 'tiers' || !matches.length;
    table.hidden = view !== 'stats' || !matches.length;
    empty.hidden = matches.length > 0;
    for (const button of switcher.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.heroView === view));
    for (const filter of filters) {
      for (const button of filter.buttons) button.setAttribute('aria-pressed', String(button.dataset.filterValue === filter.value));
    }
    if (!table.hidden) renderTable(matches);
    updateUrl();
  }

  switcher.addEventListener('click', event => {
    const button = event.target.closest('[data-hero-view]');
    if (!button) return;
    view = button.dataset.heroView;
    render();
  });
  for (const button of sortButtons) {
    button.addEventListener('click', () => {
      const key = button.dataset.heroSort;
      ascending = sort === key ? !ascending : key === 'name' || key === 'rank';
      sort = key;
      render();
    });
  }
  empty.querySelector('[data-hero-reset]').addEventListener('click', () => {
    query.value = '';
    for (const filter of filters) filter.value = '';
    render();
    query.focus();
  });
  tools.hidden = false;
  query.addEventListener('input', render);
  for (const filter of filters) {
    filter.group.addEventListener('click', event => {
      const button = event.target.closest('[data-filter-value]');
      if (!button) return;
      const value = button.dataset.filterValue;
      filter.value = filter.value === value ? '' : value;
      render();
    });
  }
  render();
})();
