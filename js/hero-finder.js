(() => {
  const tools = document.querySelector('.atlas-tools');
  if (!tools) return;
  const query = tools.querySelector('input');
  const filters = [...tools.querySelectorAll('[data-hero-filter]')].map(group => ({
    group, key: group.dataset.heroFilter, buttons: [...group.querySelectorAll('button')], value: ''
  }));
  const board = document.querySelector('.tier-board');
  const rows = [...board.querySelectorAll('.tier-row')];
  const switcher = document.querySelector('.tier-views');
  const metricSwitch = document.querySelector('.tier-metric');
  const table = document.querySelector('.tier-stats');
  const empty = document.getElementById('hero-empty');
  const sortButtons = [...table.querySelectorAll('[data-hero-sort]')];
  const language = document.documentElement.lang;
  const percent = new Intl.NumberFormat(language, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const percent1 = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const collator = new Intl.Collator(language);
  const normalize = text => text.toLowerCase().replaceAll('ё', 'е').trim();
  const entries = [...board.querySelectorAll('.tile')].map(tile => ({
    tile, tier: tile.dataset.tier, ...tile.dataset,
    names: normalize(tile.dataset.names), roles: tile.dataset.roles.split(' '), lanes: tile.dataset.lanes.split('|'),
    value: tile.querySelector('.tile__value')
  }));
  const state = new URLSearchParams(location.search);
  query.value = state.get('q') || '';
  for (const filter of filters) {
    const value = state.get(filter.key);
    if (filter.buttons.some(button => button.dataset.filterValue === value)) filter.value = value;
  }
  let view = state.get('view') === 'stats' ? 'stats' : 'tiers';
  const metrics = ['none', 'ban', 'win', 'pick'];
  let metric = metrics.includes(state.get('show')) ? state.get('show') : 'none';
  let sort = sortButtons.some(button => button.dataset.heroSort === state.get('sort')) ? state.get('sort') : 'rank';
  let ascending = state.has('dir') ? state.get('dir') === 'asc' : sort === 'rank';

  function updateUrl() {
    const url = new URL(location.href);
    const defaultDirection = sort === 'rank' || sort === 'name';
    for (const [key, value] of Object.entries({
      q: query.value.trim(), ...Object.fromEntries(filters.map(filter => [filter.key, filter.value])),
      view: view === 'stats' ? view : '', show: metric !== 'none' ? metric : '', sort: sort !== 'rank' ? sort : '',
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
      for (const key of ['win', 'pick', 'ban']) row.insertCell().textContent = percent.format(Number(entry[key])) + '%';
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
    const [role, lane] = filters.map(filter => filter.value);
    const matches = entries.filter(entry =>
      (entry.names.includes(term) || entry.slug.includes(term)) &&
      (!role || entry.roles.includes(role)) &&
      (!lane || entry.lanes.includes(lane))
    );
    const shown = new Set(matches.map(entry => entry.tile));
    for (const entry of entries) {
      entry.tile.hidden = !shown.has(entry.tile);
      entry.value.hidden = metric === 'none';
      if (metric !== 'none') entry.value.textContent = percent1.format(Number(entry[metric])) + '%';
    }
    for (const row of rows) row.hidden = !row.querySelector('.tile:not([hidden])');
    board.hidden = view !== 'tiers' || !matches.length;
    metricSwitch.hidden = view !== 'tiers';
    table.hidden = view !== 'stats' || !matches.length;
    empty.hidden = matches.length > 0;
    for (const button of switcher.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.heroView === view));
    for (const button of metricSwitch.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.heroMetric === metric));
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
  metricSwitch.addEventListener('click', event => {
    const button = event.target.closest('[data-hero-metric]');
    if (!button) return;
    metric = button.dataset.heroMetric;
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
  switcher.hidden = false;
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
