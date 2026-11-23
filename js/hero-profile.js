(() => {
  const nav = document.querySelector('.arena-profile .atlas-nav');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some(panel => !panel)) return;

  function select(index, { updateUrl = false, focus = false } = {}) {
    const chosen = tabs[index];
    for (const [i, tab] of tabs.entries()) {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    }
    if (updateUrl && location.hash !== chosen.hash) {
      history.pushState(history.state, '', chosen.hash);
    }
    if (focus) chosen.focus({ preventScroll: true });
    chosen.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function selectFromUrl() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(Math.max(0, index));
  }

  nav.setAttribute('role', 'tablist');
  for (const [i, tab] of tabs.entries()) {
    const panel = panels[i];
    tab.id = 'profile-tab-' + panel.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(i, { updateUrl: true, focus: true });
    });
  }
  nav.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const targets = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
      ' ': index
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    select(targets[event.key], { updateUrl: true, focus: true });
  });
  window.addEventListener('hashchange', selectFromUrl);
  selectFromUrl();
})();
