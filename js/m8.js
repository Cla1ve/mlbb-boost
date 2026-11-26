// M8 block: stage tabs, stage states, countdown, next matches, local time and the match window.
(() => {
  const root = document.querySelector('[data-m8]');
  if (!root) return;
  const en = root.dataset.lang === 'en';
  const t = (ru, english) => en ? english : ru;
  const locale = en ? 'en-GB' : 'ru-RU';
  const data = JSON.parse(root.querySelector('[data-m8-json]').textContent);
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const boxes = [...root.querySelectorAll('.m8-panel [data-match][data-at]')];
  const length = bo => Number(bo || 1) * 25 * 60 * 1000 + 15 * 60 * 1000;
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = {
    time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }),
    short: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    day: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    dayMonth: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
  };
  const day = iso => { const text = fmt.day.format(new Date(iso)); return text.charAt(0).toUpperCase() + text.slice(1); };
  const plural = (n, forms) => { const a = n % 100, b = n % 10; return forms[a > 10 && a < 15 ? 2 : b === 1 ? 0 : b > 1 && b < 5 ? 1 : 2]; };
  const left = ms => {
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.max(1, Math.floor(ms % 36e5 / 6e4));
    if (d >= 1) return en ? `${d} day${d > 1 ? 's' : ''} ${h} h` : `${d} ${plural(d, ['день', 'дня', 'дней'])} ${h} ч`;
    return h ? (en ? `${h} h ${m} min` : `${h} ч ${m} мин`) : (en ? `${m} min` : `${m} мин`);
  };

  // Local time: Moscow is the default in the markup.
  const local = -new Date().getTimezoneOffset() !== 180;
  if (local) {
    root.querySelectorAll('time[data-format]').forEach(node => {
      const at = new Date(node.getAttribute('datetime'));
      node.textContent = node.dataset.format === 'time' ? fmt.time.format(at) : node.dataset.format === 'full' ? `${day(at)}, ${fmt.time.format(at)}` : `${fmt.short.format(at)}, ${fmt.time.format(at)}`;
    });
    root.querySelectorAll('.m8-day').forEach(section => {
      const first = section.querySelector('[data-at]');
      if (first) section.querySelector('h4').textContent = day(first.dataset.at);
    });
  }

  // Stage tabs. Capture phase: main.js scrolls to every "#" link of the page.
  function select(id, focus = false) {
    tabs.forEach(tab => {
      const on = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
  }
  const list = root.querySelector('[role="tablist"]');
  list.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    select(tab.getAttribute('aria-controls'));
    history.replaceState(null, '', `#${tab.getAttribute('aria-controls')}`);
  });
  list.addEventListener('keydown', event => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    select(tabs[(index + step + tabs.length) % tabs.length].getAttribute('aria-controls'), true);
  });

  // Stage states from their dates; the running stage opens by default.
  const today = new Date().toISOString().slice(0, 10);
  let current = null;
  tabs.forEach(tab => {
    const { from, to } = tab.dataset;
    if (!from) return;
    const state = today > to ? 'done' : today >= from ? 'live' : 'soon';
    tab.dataset.state = state;
    tab.querySelector('[data-m8-state]').textContent = { done: t('Завершён', 'Finished'), live: t('Идёт сейчас', 'Live now'), soon: '' }[state];
    if (!current && state !== 'done') current = tab.getAttribute('aria-controls');
  });
  const wanted = location.hash.slice(1);
  select(panels.some(panel => panel.id === wanted) ? wanted : current || panels.at(-1).id);

  // Headline: countdown before the start, the next match during the event.
  const headline = root.querySelector('[data-m8-headline]');
  const sub = root.querySelector('[data-m8-sub]');
  const next = root.querySelector('[data-m8-next]');
  const start = Date.parse(root.dataset.start || '');
  function tick() {
    const now = Date.now();
    boxes.forEach(node => node.classList.toggle('is-now', !node.classList.contains('is-done') && now >= Date.parse(node.dataset.at) && now < Date.parse(node.dataset.at) + length(node.dataset.bo)));
    if ('champion' in root.dataset) return;
    const upcoming = boxes.filter(node => !node.classList.contains('is-done') && Date.parse(node.dataset.at) + length(node.dataset.bo) > now).sort((a, b) => Date.parse(a.dataset.at) - Date.parse(b.dataset.at));
    if (start && now < start) {
      headline.textContent = t(`До старта M8 ${left(start - now)}`, `M8 starts in ${left(start - now)}`);
      sub.textContent = t(`Первый матч ${fmt.dayMonth.format(new Date(start))} в ${fmt.time.format(new Date(start))}`, `First match on ${fmt.dayMonth.format(new Date(start))} at ${fmt.time.format(new Date(start))}`);
    } else if (upcoming[0]) {
      const at = Date.parse(upcoming[0].dataset.at);
      headline.textContent = now >= at ? t('Сейчас идут матчи M8', 'M8 matches are on now') : t(`Следующий матч через ${left(at - now)}`, `Next match in ${left(at - now)}`);
    }
    if (!upcoming.length || now < start - 3 * 864e5) { next.hidden = true; return; }
    next.querySelector('.m8-next__list').replaceChildren(...upcoming.slice(0, 3).map(node => node.cloneNode(true)));
    next.hidden = false;
  }
  tick();
  setInterval(tick, 30000);

  // Match window.
  const dialog = root.querySelector('[data-m8-dialog]');
  const body = dialog.querySelector('.m8-dialog__body');
  const logo = side => side?.l ? `<img src="${side.l}" width="56" height="56" alt="">` : '<span class="tl tl--empty" style="--s:56px"></span>';
  const name = side => side ? esc(side.n) : t('Не определена', 'TBD');
  function ics(match) {
    const stamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const end = new Date(Date.parse(match.at) + length(match.bo)).toISOString();
    const title = `M8: ${match.a ? match.a.n : 'TBD'} vs ${match.b ? match.b.n : 'TBD'}`;
    const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//boostmlbb.ru//M8//RU', 'BEGIN:VEVENT', `UID:${stamp(match.at)}-m8@boostmlbb.ru`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(match.at)}`, `DTEND:${stamp(end)}`, `SUMMARY:${title}`, `DESCRIPTION:${match.st}, Bo${match.bo}. ${location.origin}${location.pathname}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  }
  function open(id) {
    const m = data.matches[id];
    if (!m) return;
    const now = Date.now();
    const at = m.at ? Date.parse(m.at) : null;
    const live = at && !m.w && now >= at && now < at + length(m.bo);
    const status = m.w ? t('Матч сыгран', 'Finished') : live ? t('Идёт сейчас', 'Live now') : at && now < at ? t(`Начало через ${left(at - now)}`, `Starts in ${left(at - now)}`) : '';
    const winner = m.w ? (m.w === 1 ? m.a : m.b) : null;
    const games = m.g.length ? `<h3>${t('Игры', 'Games')}</h3><ol class="md-games">${m.g.map((g, i) => `<li><p class="md-game__head"><b>${t(`Игра ${i + 1}`, `Game ${i + 1}`)}</b>${g.w ? `<span>${t('победа', 'won by')} ${name(g.w === 1 ? m.a : m.b)}</span>` : ''}${g.len ? `<span>${g.len}</span>` : ''}${g.vod ? `<a href="${esc(g.vod)}" target="_blank" rel="noopener">${t('Запись', 'Replay')}</a>` : ''}</p>${g.p.some(side => side.length) ? `<div class="md-draft">${g.p.map((side, k) => `<div class="md-draft__side${g.w === k + 1 ? ' is-win' : ''}">${side.map(([slug, hero]) => `<a href="${en ? '/en' : ''}/heroes/${slug}.html" title="${esc(hero)}"><img src="/images/heroes/${slug}.webp" width="40" height="40" alt="${esc(hero)}"></a>`).join('')}</div>`).join('')}</div>` : ''}</li>`).join('')}</ol>` : '';
    const watch = !m.w && data.watch.length ? `<h3>${t('Где смотреть', 'Where to watch')}</h3><ul class="md-watch">${data.watch.map(([kind, label, url, icon]) => `<li><a class="ws ws--${kind}" href="${esc(url)}" target="_blank" rel="noopener"><span class="ws__icon">${icon}</span><span class="ws__text"><b>${label}</b></span></a></li>`).join('')}</ul>` : '';
    body.innerHTML = `<header class="md-head"><p id="m8-dialog-title">${esc(m.st)} · Bo${m.bo}</p><button type="button" class="md-close" data-close aria-label="${t('Закрыть', 'Close')}"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></header>
      <div class="md-score">
        <div class="md-team${m.w === 1 ? ' is-win' : m.w ? ' is-lose' : ''}${m.a ? '' : ' is-tbd'}">${logo(m.a)}<b>${name(m.a)}</b></div>
        <div class="md-result">${m.s ? `${m.s[0]}<span>:</span>${m.s[1]}` : '<span>vs</span>'}</div>
        <div class="md-team${m.w === 2 ? ' is-win' : m.w ? ' is-lose' : ''}${m.b ? '' : ' is-tbd'}">${logo(m.b)}<b>${name(m.b)}</b></div>
      </div>
      <p class="md-when">${at ? `${day(new Date(at))}, ${fmt.time.format(new Date(at))}` : t('Время уточняется', 'Time to be announced')}${status ? `<span class="md-status${live ? ' is-live' : ''}">${status}</span>` : ''}</p>
      ${winner ? `<p class="md-winner">${t('Победитель', 'Winner')}: <b>${esc(winner.n)}</b></p>` : ''}
      ${!m.a || !m.b ? `<p class="md-note">${esc(m.note)}</p>` : ''}
      ${games}${watch}
      ${at && now < at ? `<a class="btn-ghost md-cal" href="${ics(m)}" download="m8-match.ics">${t('Добавить в календарь', 'Add to calendar')}</a>` : ''}`;
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  }
  root.addEventListener('click', event => {
    const trigger = event.target.closest('[data-match]');
    if (trigger) { open(trigger.dataset.match); return; }
    if (event.target.closest('[data-close]') || event.target === dialog) dialog.close();
  });
  root.classList.add('is-ready');
})();
