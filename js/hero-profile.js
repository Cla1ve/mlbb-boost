(() => {
  const nav = document.querySelector('.arena-profile .atlas-nav');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some(panel => !panel)) return;
  const holder = panels[0].parentElement;

  // The page never jumps on its own. After a tab change the view moves only when the user had scrolled
  // past the top of the content: then it goes back to the top of the new panel, just under the tab bar.
  function keepPlace() {
    const stuck = parseFloat(getComputedStyle(nav).top) || 0;
    const top = holder.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - stuck - 12;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'instant' });
  }
  // Brings the active tab into view inside a narrow tab bar without touching the page scroll.
  function centerTab(tab) {
    nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }

  function select(index, { updateUrl = false, focus = false, keep = false } = {}) {
    const chosen = tabs[index];
    for (const [i, tab] of tabs.entries()) {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    }
    if (updateUrl && location.hash !== chosen.hash) history.pushState(history.state, '', chosen.hash);
    if (focus) chosen.focus({ preventScroll: true });
    centerTab(chosen);
    if (keep) keepPlace();
  }

  function selectFromUrl(event) {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(Math.max(0, index), { keep: Boolean(event) });
  }

  nav.setAttribute('role', 'tablist');
  for (const [i, tab] of tabs.entries()) {
    const panel = panels[i];
    tab.removeAttribute('aria-current');
    tab.id = 'profile-tab-' + panel.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = -1;
  }
  // The site script (js/main.js) gives every a[href^="#"] its own click handler that scrolls the page to the target.
  // A capture listener on the tab bar runs first and stops the click here, so only this script decides what moves.
  nav.addEventListener('click', event => {
    const tab = event.target.closest('a[href^="#"]');
    const index = tabs.indexOf(tab);
    if (index < 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    select(index, { updateUrl: true, focus: true, keep: true });
  }, true);
  nav.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const targets = { ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    select(targets[event.key], { updateUrl: true, focus: true, keep: true });
  });
  window.addEventListener('hashchange', selectFromUrl);
  // A link to /heroes/x.html#build opens that tab and keeps the page at the top: the browser would otherwise scroll to the section.
  selectFromUrl();
  if (location.hash) requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  // Build switcher: one build at a time, the others stay in the DOM for search engines.
  const switcher = document.querySelector('.build-switch');
  if (switcher) {
    const builds = [...document.querySelectorAll('.build[data-build]')];
    const buttons = [...switcher.querySelectorAll('[data-pick-build]')];
    switcher.hidden = false;
    switcher.addEventListener('click', event => {
      const button = event.target.closest('[data-pick-build]');
      if (!button) return;
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      for (const build of builds) build.hidden = build.dataset.build !== button.dataset.pickBuild;
    });
  }

  // Skills: a list on the left, one description on the right.
  const skillTabs = [...document.querySelectorAll('.skill-tab')];
  if (skillTabs.length) {
    const skillPanels = [...document.querySelectorAll('[data-skill-panel]')];
    const show = index => {
      skillTabs.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      skillPanels.forEach((panel, i) => { panel.hidden = i !== index; });
    };
    for (const button of skillTabs) {
      button.hidden = false;
      button.addEventListener('click', () => show(Number(button.dataset.skill)));
    }
    show(0);
  }
})();
