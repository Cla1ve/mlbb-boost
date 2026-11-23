(() => {
  const tools = document.querySelector('.atlas-tools');
  if (!tools) return;
  const query = tools.querySelector('input');
  const filters = [...tools.querySelectorAll('[data-hero-filter]')].map(group => ({
    group, key: group.dataset.heroFilter, buttons: [...group.querySelectorAll('button')], value: ''
  }));
  const board = document.querySelector('.tier-board');
  const tiers = [...board.querySelectorAll('.tier-row')];
  const jumps = document.querySelector('.tier-jump');
  const switcher = document.querySelector('.tier-views');
  const table = document.querySelector('.tier-stats');
  const empty = document.getElementById('hero-empty');
  const sortButtons = [...table.querySelectorAll('[data-hero-sort]')];
  const language = document.documentElement.lang;
  const formatter = new Intl.NumberFormat(language, { style: 'percent', minimumFractionDigits: 2 });
  const collator = new Intl.Collator(language);
  const normalize = text => text.toLowerCase().replaceAll('ё', 'е').trim();
  const entries = tiers.flatMap(tier => [...tier.querySelectorAll('.tier-entry')].map(tile => {
    const link = tile.querySelector('a');
    return {
      tile, link, tier: tier.dataset.tier, ...tile.dataset,
      names: normalize(link.dataset.names), roles: link.dataset.roles.split(' '),
      lanes: tile.dataset.lanes.split('|')
    };
  }));
  const state = new URLSearchParams(location.search);
  query.value = state.get('q') || '';
  for (const filter of filters) {
    const value = state.get(filter.key);
    if (filter.buttons.some(button => button.dataset.filterValue === value)) filter.value = value;
  }
  let view = state.get('view') === 'stats' ? 'stats' : 'tiers';
  let sort = sortButtons.some(button => button.dataset.heroSort === state.get('sort')) ? state.get('sort') : 'win';
  let ascending = state.get('dir') === 'asc';

  function updateUrl() {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({
      q: query.value.trim(), ...Object.fromEntries(filters.map(filter => [filter.key, filter.value])),
      view: view === 'stats' ? view : '', sort: sort !== 'win' ? sort : '', dir: ascending ? 'asc' : ''
    })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
  }

  function renderTable(matches) {
    const grade = 'DCBAS';
    const compare = {
      name: (a, b) => collator.compare(a.name, b.name),
      tier: (a, b) => grade.indexOf(a.tier) - grade.indexOf(b.tier)
    }[sort] || ((a, b) => Number(a[sort]) - Number(b[sort]));
    matches.sort((a, b) => (ascending ? 1 : -1) * compare(a, b) || collator.compare(a.name, b.name));
    const rows = document.createDocumentFragment();
    for (const entry of matches) {
      const row = document.createElement('tr');
      const hero = document.createElement('th');
      hero.scope = 'row';
      const link = entry.link.cloneNode(true);
      link.querySelector('.hero-chip__value').remove();
      hero.append(link);
      row.append(hero);
      for (const value of [entry.tier, ...['win', 'pick', 'ban'].map(key => formatter.format(Number(entry[key]) / 100))]) {
        row.insertCell().textContent = value;
      }
      rows.append(row);
    }
    table.tBodies[0].replaceChildren(rows);
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
    for (const { tile } of entries) tile.hidden = !shown.has(tile);
    for (const tier of tiers) {
      tier.hidden = !tier.querySelector('.tier-entry:not([hidden])');
      jumps.querySelector('[data-tier-link="' + tier.dataset.tier + '"]').hidden = tier.hidden;
    }
    board.hidden = view !== 'tiers' || !matches.length;
    jumps.hidden = board.hidden;
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
      ascending = sort === key ? !ascending : key === 'name';
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
