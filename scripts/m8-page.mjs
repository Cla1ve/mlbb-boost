// Live M8 block on /news/m8-istanbul-world-road/ from content/m8.json (scripts/m8-data.mjs).
// The markup is deterministic (a rebuild on another day gives the same file): stage states, countdowns,
// the visitor's time zone and the match window are added in the browser by js/m8.js.
import { faTwitch, faYoutube, faVk, faTiktok, faKickstarterK } from '@fortawesome/free-brands-svg-icons';

const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const SHORT = { ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
const WEEKDAYS = { ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
const CIS = new Set(['team spirit', 'aurevia team', 'team yandex']);
const ROUTES = {
  'MPL/Indonesia/Season_18': 'MPL Indonesia S18', 'MPL/Philippines/Season_18': 'MPL Philippines S18', 'MPL/Malaysia/Season_18': 'MPL Malaysia S18',
  'MCT/2026/Southeast_Asia': 'MCT SEA', 'MCT/2026/East_Asia/Split_2': 'MCT East Asia', 'MCT/2026/Americas/Split_2': 'MCT Americas',
  'MLBB_Continental_Championships/Season_8': 'MCC S8', 'MTC_Turkiye_Championship/Season_8': 'MTC Türkiye S8', 'MPL/MENA/Season_10': 'MPL MENA S10',
  'MLBB Super League/Thailand/Season 2': 'MSL Thailand S2'
};
const ICONS = { twitch: faTwitch, youtube: faYoutube, vk: faVk, tiktok: faTiktok, kick: faKickstarterK };
const STREAM_NAMES = { twitch: 'Twitch', youtube: 'YouTube', vk: 'VK', tiktok: 'TikTok', kick: 'Kick' };
const svg = def => `<svg viewBox="0 0 ${def.icon[0]} ${def.icon[1]}" aria-hidden="true" focusable="false"><path d="${def.icon[4]}"/></svg>`;

// Liquipedia writes picks as short names (esme, paqu, yz): exact name, aliases, then a unique prefix.
const ALIASES = { changee: 'change', popol: 'popol-and-kupa', popolkupa: 'popol-and-kupa', xb: 'x-borg', yz: 'yu-zhong', yss: 'yi-sun-shin', zx: 'zhuxin', val: 'valir', lapu: 'lapu-lapu', pove: 'phoveus', ls: 'lesley' };
function heroResolver(heroes) {
  const norm = text => String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
  const by = {};
  for (const hero of heroes) { by[norm(hero.en)] = hero; by[norm(hero.slug)] = hero; }
  const keys = Object.keys(by);
  return name => {
    const key = norm(name);
    if (!key) return null;
    if (by[key]) return by[key];
    if (ALIASES[key]) return heroes.find(hero => hero.slug === ALIASES[key]) || null;
    const found = new Set(keys.filter(candidate => key.length >= 3 && candidate.startsWith(key)).map(candidate => by[candidate]));
    return found.size === 1 ? [...found][0] : null;
  };
}

export function m8Toc(locale) {
  const en = locale === 'en';
  return [
    { id: 'm8-stages', text: en ? 'Schedule and bracket' : 'Расписание и сетка' },
    { id: 'm8-teams', text: en ? 'Teams' : 'Участники' },
    { id: 'm8-watch', text: en ? 'Where to watch' : 'Где смотреть' }
  ];
}

export function renderM8(data, locale, heroes = []) {
  const en = locale === 'en';
  const lang = en ? 'en' : 'ru';
  const t = (ru, english) => en ? english : ru;
  const hero = heroResolver(heroes);
  const team = key => key ? (data.teams[key] || { name: key.replace(/\b\w/g, c => c.toUpperCase()), short: key.toUpperCase() }) : null;
  const msk = iso => new Date(Date.parse(iso) + 3 * 3600e3);
  const clock = iso => msk(iso).toISOString().slice(11, 16);
  const dayOf = m => m.at ? msk(m.at).toISOString().slice(0, 10) : m.day;
  const dateParts = day => { const d = new Date(`${day}T00:00:00Z`); return { d: d.getUTCDate(), m: d.getUTCMonth(), w: d.getUTCDay() }; };
  const dayTitle = day => { const { d, m, w } = dateParts(day); return en ? `${WEEKDAYS.en[w]}, ${MONTHS.en[m]} ${d}` : `${d} ${MONTHS.ru[m]}, ${WEEKDAYS.ru[w]}`; };
  const shortDay = day => { const { d, m } = dateParts(day); return en ? `${SHORT.en[m]} ${d}` : `${d} ${SHORT.ru[m]}`; };
  const range = (from, to) => {
    if (!from) return '';
    const a = dateParts(from), b = dateParts(to || from);
    if (from === (to || from)) return en ? `${MONTHS.en[a.m]} ${a.d}` : `${a.d} ${MONTHS.ru[a.m]}`;
    if (a.m === b.m) return en ? `${MONTHS.en[a.m]} ${a.d}–${b.d}` : `${a.d}–${b.d} ${MONTHS.ru[a.m]}`;
    return en ? `${MONTHS.en[a.m]} ${a.d} – ${MONTHS.en[b.m]} ${b.d}` : `${a.d} ${MONTHS.ru[a.m]} – ${b.d} ${MONTHS.ru[b.m]}`;
  };
  const logo = (info, size = 24) => info?.logo
    ? `<img class="tl" src="${info.logo}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`
    : `<span class="tl tl--empty" style="--s:${size}px" aria-hidden="true"></span>`;

  // ---------- every match once, with what the match window needs ----------
  const payload = {};
  let serial = 0;
  const register = (m, stage, note) => {
    const id = m.id || `m${++serial}`;
    const side = key => { const info = team(key); return info ? { n: info.name, l: info.logo || '', c: CIS.has(key) ? 1 : 0 } : null; };
    payload[id] = {
      st: stage, bo: m.bo, at: m.at, a: side(m.a), b: side(m.b), s: m.score, w: m.winner, note,
      g: (m.games || []).map(game => ({ w: game.w, len: game.len, vod: game.vod, p: game.picks.map(list => list.map(name => { const h = hero(name); return h ? [h.slug, en ? h.en : h.ru] : null; }).filter(Boolean)) }))
    };
    return id;
  };
  const side = (m, which) => {
    const key = m[which], info = team(key);
    const index = which === 'a' ? 0 : 1;
    const state = !info ? 'is-tbd' : m.winner ? (m.winner === index + 1 ? 'is-win' : 'is-lose') : '';
    return `<span class="mb__team ${state}">${logo(info)}<span class="mb__name"${info ? ` title="${esc(info.name)}"` : ''}>${info ? esc(info.name) : t('Не определена', 'TBD')}</span>${CIS.has(key) ? `<i class="cis">${t('СНГ', 'CIS')}</i>` : ''}<b>${m.score ? m.score[index] : ''}</b></span>`;
  };
  // A match: two team rows like on a bracket. The whole box opens the match window.
  const box = (m, stage, note, format = 'time') => {
    const id = register(m, stage, note);
    const cis = CIS.has(m.a) || CIS.has(m.b);
    const when = m.at ? `<time datetime="${m.at}" data-format="${format}">${format === 'time' ? clock(m.at) : `${shortDay(dayOf(m))}, ${clock(m.at)}`}</time>` : `<span>${t('Время уточняется', 'Time TBA')}</span>`;
    return `<button type="button" class="mb${m.winner ? ' is-done' : ''}" data-match="${esc(id)}"${cis ? ' data-cis' : ''}${m.at ? ` data-at="${m.at}" data-bo="${m.bo}"` : ''}>
      <span class="mb__meta">${when}<span>Bo${m.bo}</span></span>${side(m, 'a')}${side(m, 'b')}</button>`;
  };

  const standings = (teams, matches) => {
    const table = new Map(teams.filter(Boolean).map(key => [key, { key, w: 0, l: 0, diff: 0 }]));
    for (const m of matches) {
      if (!m.winner) continue;
      const win = m.winner === 1 ? m.a : m.b, loss = m.winner === 1 ? m.b : m.a;
      const margin = m.score ? Math.abs(m.score[0] - m.score[1]) : 1;
      for (const key of [win, loss]) if (key && !table.has(key)) table.set(key, { key, w: 0, l: 0, diff: 0 });
      if (table.has(win)) { table.get(win).w++; table.get(win).diff += margin; }
      if (table.has(loss)) { table.get(loss).l++; table.get(loss).diff -= margin; }
    }
    return [...table.values()].sort((a, b) => b.w - a.w || a.l - b.l || b.diff - a.diff);
  };
  const tableHTML = (caption, rows, slots, mark, placeholder = () => t('Не определена', 'TBD')) => {
    const body = rows.map((item, i) => {
      const info = team(item.key);
      const state = mark(item, i);
      return `<tr${state ? ` data-state="${state}"` : ''}${CIS.has(item.key) ? ' data-cis' : ''}><td class="st-pos">${i + 1}</td><th scope="row"><span class="st-team">${logo(info, 22)}<span>${esc(info.name)}</span>${CIS.has(item.key) ? `<i class="cis">${t('СНГ', 'CIS')}</i>` : ''}</span></th><td class="st-rec">${item.w}–${item.l}</td></tr>`;
    });
    for (let i = rows.length; i < slots; i++) body.push(`<tr class="is-tbd"><td class="st-pos">${i + 1}</td><th scope="row"><span class="st-team">${logo(null, 22)}<span>${placeholder(i)}</span></span></th><td class="st-rec">0–0</td></tr>`);
    return `<table class="st"><caption>${caption}</caption><thead><tr><th scope="col">#</th><th scope="col">${t('Команда', 'Team')}</th><th scope="col"><abbr title="${t('Победы и поражения', 'Won and lost')}">${t('В–П', 'W–L')}</abbr></th></tr></thead><tbody>${body.join('')}</tbody></table>`;
  };
  const days = (entries) => {
    const byDay = new Map();
    for (const entry of [...entries].sort((x, y) => Date.parse(x.m.at || x.m.day) - Date.parse(y.m.at || y.m.day))) {
      const day = dayOf(entry.m) || '';
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(entry);
    }
    return [...byDay].map(([day, list]) => `<section class="m8-day"><h4 data-day="${day}">${day ? dayTitle(day) : t('Дата не объявлена', 'Date to be announced')}</h4><div class="m8-day__grid">${list.map(({ m, stage, note }) => box(m, stage, note)).join('')}</div></section>`).join('');
  };
  // A bracket: columns of matches, joined by lines. "pair" feeds two matches into one, "straight" one into one.
  const bracket = (cols, rows) => `<div class="bk" style="--rows:${rows}">${cols.map((col, i) => {
    const slot = m => `<div class="bk-slot">${box(m, col.stage, col.note, 'datetime')}</div>`;
    const body = col.join === 'pair'
      ? Array.from({ length: Math.ceil(col.matches.length / 2) }, (_, k) => `<div class="bk-pair">${col.matches.slice(k * 2, k * 2 + 2).map(slot).join('')}</div>`).join('')
      : col.matches.map(slot).join('');
    return `<div class="bk-col"${i < cols.length - 1 ? ` data-join="${col.join}"` : ''}><h4>${col.title}<span>Bo${col.matches[0]?.bo || ''}</span></h4><div class="bk-body">${body}</div></div>`;
  }).join('')}</div>`;

  // ---------- stages ----------
  const ROUND = {
    'ub-qf': t('1/4 финала', 'Quarterfinals'), 'ub-sf': t('Полуфиналы', 'Semifinals'), 'ub-final': t('Финал верхней сетки', 'Upper final'),
    'lb-r1': t('1-й раунд', 'Round 1'), 'lb-qf': t('2-й раунд', 'Round 2'), 'lb-sf': t('3-й раунд', 'Round 3'), 'lb-final': t('Финал нижней сетки', 'Lower final'),
    sf: t('Полуфиналы', 'Semifinals'), final: t('Финал Wild Card', 'Wild Card final')
  };
  const groups = data.wildcard.groups;
  const drawn = groups.some(g => g.teams.some(Boolean));
  const wcRounds = data.wildcard.bracket?.rounds || [];
  const ko = Object.fromEntries((data.knockout?.rounds || []).map(r => [r.round, r.matches]));
  const swissRounds = data.swiss.rounds;
  const allDays = list => list.map(m => dayOf(m)).filter(Boolean).sort();
  const span = list => { const d = allDays(list); return d.length ? [d[0], d.at(-1)] : [null, null]; };
  const wcMatches = [...groups.flatMap(g => g.matches), ...wcRounds.flatMap(r => r.matches)];
  const swissMatches = swissRounds.flatMap(r => r.matches);
  const koMatches = Object.entries(ko).filter(([round]) => round !== 'grand-final').flatMap(([, list]) => list);
  const gf = ko['grand-final']?.[0] || null;
  const steps = [
    { id: 'wildcard', title: 'Wild Card', place: t('Бангкок', 'Bangkok'), dates: span(wcMatches) },
    { id: 'swiss', title: t('Швейцарская система', 'Swiss stage'), place: t('Стамбул', 'Istanbul'), dates: span(swissMatches) },
    { id: 'playoffs', title: t('Плей-офф', 'Playoffs'), place: t('Стамбул', 'Istanbul'), dates: span(koMatches) },
    { id: 'final', title: t('Гранд-финал', 'Grand final'), place: 'Ora Arena', dates: span(gf ? [gf] : []) }
  ];

  // Wild Card
  const legend = items => `<ul class="m8-legend">${items.map(([state, text]) => `<li data-state="${state}">${text}</li>`).join('')}</ul>`;
  const wcTeams = data.participants.wildcard;
  const waiting = wcTeams.map(entry => {
    const key = entry.name.toLowerCase(), info = entry.name ? team(key) : null;
    return `<li class="chip${info ? '' : ' is-tbd'}"${CIS.has(key) ? ' data-cis' : ''}>${logo(info, 22)}<span>${info ? esc(info.name) : t(`${entry.place}-е место ${ROUTES[entry.route] || ''}`, `${ROUTES[entry.route] || ''} place ${entry.place}`)}</span>${CIS.has(key) ? `<i class="cis">${t('СНГ', 'CIS')}</i>` : ''}</li>`;
  }).join('');
  const groupNote = t('Соперников определит жеребьёвка групп 14 декабря.', 'The group draw on December 14 decides the opponents.');
  const groupTables = groups.map(g => {
    const rows = standings(g.teams, g.matches);
    const finished = g.matches.length && g.matches.every(m => m.winner);
    return `<div class="m8-card">${tableHTML(t(`Группа ${g.name}`, `Group ${g.name}`), rows, Math.max(5, g.teams.length), (_, i) => finished ? (i === 0 ? 'through' : i < 3 ? 'playoff' : 'out') : '')}</div>`;
  }).join('');
  const wildcard = `
    ${legend([['through', t('1-е место: сразу в Swiss', '1st: straight to the Swiss stage')], ['playoff', t('2–3-е: плей-офф Wild Card', '2nd–3rd: Wild Card playoffs')], ['out', t('4–5-е: вылет', '4th–5th: out')]])}
    ${drawn ? '' : `<p class="m8-await">${groupNote}</p>`}
    ${drawn ? `<div class="m8-grid2">${groupTables}</div>` : ''}
    <h3>${t('Матчи групп', 'Group matches')}</h3>${days(groups.flatMap(g => g.matches.map(m => ({ m, stage: t(`Wild Card, группа ${g.name}`, `Wild Card, group ${g.name}`), note: drawn ? '' : groupNote }))))}
    ${wcRounds.length ? `<h3>${t('Плей-офф Wild Card', 'Wild Card playoffs')}</h3><p class="m8-lead">${t('Вторые и третьи места групп играют на вылет до трёх побед. Победитель проходит в Swiss.', 'Second and third places play knockout matches, best of five. The winner goes to the Swiss stage.')}</p>
    ${bracket(wcRounds.map((r, i) => ({ title: ROUND[r.round] || r.round, matches: r.matches, join: i === 0 ? 'pair' : 'straight', stage: `Wild Card, ${(ROUND[r.round] || '').toLowerCase()}`, note: t('Сюда выйдут 2-е и 3-е места групп.', 'Second and third places of the groups play here.') })), 2)}` : ''}`;

  // Swiss
  const swissTeams = data.swiss.teams.filter(Boolean);
  const swissRows = standings(swissTeams, swissMatches);
  const recordOf = r => r.record || (r.round === 1 ? '0-0' : r.round === 5 ? '2-2' : '');
  const swissCols = [1, 2, 3, 4, 5].map(n => {
    const lists = swissRounds.filter(r => r.round === n).sort((a, b) => recordOf(b).localeCompare(recordOf(a)));
    if (!lists.length) return '';
    const bo = lists.map(r => r.matches[0]?.bo).filter(Boolean);
    const note = n === 1 ? t('Пары первого раунда определит жеребьёвка.', 'A draw sets the first round pairs.') : t('Пары составят из команд с одинаковым счётом.', 'Teams with the same record meet each other.');
    return `<div class="sw-col"><h4>${t(`Раунд ${n}`, `Round ${n}`)}<span>${[...new Set(bo)].map(b => `Bo${b}`).join(', ')}</span></h4>${lists.map(r => `<div class="sw-group"><p>${recordOf(r).replace('-', '–')}</p>${r.matches.map(m => box(m, t(`Swiss, раунд ${n}`, `Swiss, round ${n}`), note, 'datetime')).join('')}</div>`).join('')}</div>`;
  }).join('');
  const swiss = `
    ${legend([['through', t('3 победы: плей-офф', '3 wins: playoffs')], ['out', t('3 поражения: вылет', '3 losses: out')]])}
    <div class="sw-board" tabindex="0" aria-label="${t('Раунды Swiss', 'Swiss rounds')}">${swissCols}</div>
    ${swissMatches.some(m => m.a || m.b) ? `<h3>${t('Положение команд', 'Standings')}</h3>
    <div class="m8-card m8-card--wide">${tableHTML(t('Swiss', 'Swiss'), swissRows, 16, item => item.w >= 3 ? 'through' : item.l >= 3 ? 'out' : '', i => i < 13 ? t('Выйдет из MCT SEA', 'From MCT SEA') : t('Выйдет из Wild Card', 'From the Wild Card'))}</div>` : ''}`;

  // Playoffs
  const koNote = t('Соперники определятся по итогам предыдущих матчей.', 'The previous matches decide the opponents.');
  const koCol = (round, join) => ({ title: ROUND[round], matches: ko[round] || [], join, stage: `${t('Плей-офф', 'Playoffs')}, ${(ROUND[round] || '').toLowerCase()}`, note: round === 'ub-qf' ? t('Сюда выйдут 8 лучших команд Swiss.', 'The top eight Swiss teams play here.') : koNote });
  const playoffs = `<p class="m8-lead">${t('8 команд, двойное выбывание: после первого поражения команда уходит в нижнюю сетку, после второго покидает турнир. Первый раунд до двух побед, дальше до трёх.', 'Eight teams, double elimination: one loss sends a team to the lower bracket, two losses end its run. The first round is best of three, the rest best of five.')}</p>
    <h3>${t('Верхняя сетка', 'Upper bracket')}</h3>${bracket([koCol('ub-qf', 'pair'), koCol('ub-sf', 'pair'), koCol('ub-final', 'straight')].filter(c => c.matches.length), 4)}
    <h3>${t('Нижняя сетка', 'Lower bracket')}</h3>${bracket([koCol('lb-r1', 'straight'), koCol('lb-qf', 'pair'), koCol('lb-sf', 'straight'), koCol('lb-final', 'straight')].filter(c => c.matches.length), 2)}`;

  // Grand final
  const champion = gf?.winner ? team(gf.winner === 1 ? gf.a : gf.b) : null;
  const finalSide = key => { const info = team(key); return `<div class="gf-team${info ? '' : ' is-tbd'}">${logo(info, 72)}<b>${info ? esc(info.name) : t('Не определена', 'TBD')}</b></div>`; };
  const final = gf ? `<p class="m8-lead">${t('Победитель верхней сетки против победителя нижней, до четырёх побед.', 'The upper bracket winner meets the lower bracket winner, best of seven.')}</p>
    <div class="gf">
      ${champion ? `<p class="gf-champ">${t('Чемпион M8', 'M8 champion')}: ${esc(champion.name)}</p>` : ''}
      <div class="gf-row">${finalSide(gf.a)}<div class="gf-score">${gf.score ? `${gf.score[0]}<span>:</span>${gf.score[1]}` : '<span>vs</span>'}</div>${finalSide(gf.b)}</div>
      <p class="gf-when">${gf.at ? `<time datetime="${gf.at}" data-format="full">${dayTitle(dayOf(gf))}, ${clock(gf.at)}</time>` : ''}<span>Ora Arena, ${t('Стамбул', 'Istanbul')}</span><span>Bo${gf.bo}</span></p>
      <button type="button" class="btn-ghost" data-match="${esc(register(gf, t('Гранд-финал', 'Grand final'), t('Победители верхней и нижней сетки.', 'The upper and lower bracket winners.')))}">${t('Подробнее о матче', 'Match details')}</button>
    </div>` : '';

  // Teams
  const place = n => n === 1 ? t('чемпион', 'champion') : n ? t(`${n}-е место`, `place ${n}`) : '';
  const teamCard = entry => {
    const key = entry.name.toLowerCase(), info = entry.name ? team(key) : null;
    const route = ROUTES[entry.route] || entry.route.replace(/_/g, ' ').split('/')[0];
    return `<li class="tc${info ? '' : ' is-tbd'}"${CIS.has(key) ? ' data-cis' : ''}>${logo(info, 40)}<span><b>${info ? esc(info.name) : t('Определится', 'To be decided')}</b><small>${esc(route)}${entry.place ? `, ${place(entry.place)}` : ''}</small></span>${CIS.has(key) ? `<i class="cis">${t('СНГ', 'CIS')}</i>` : ''}</li>`;
  };

  const streams = (data.streams?.[en ? 'en' : 'ru'] || []);
  const watch = streams.map(s => `<li><a class="ws ws--${s.kind}" href="${esc(s.url)}" target="_blank" rel="noopener"><span class="ws__icon">${svg(ICONS[s.kind])}</span><span class="ws__text"><b>${STREAM_NAMES[s.kind]}</b><small>${esc(s.handle)}</small></span></a></li>`).join('');

  const panels = [
    ['wildcard', wildcard], ['swiss', swiss], ['playoffs', playoffs], ['final', final]
  ];
  const updated = new Date(Date.parse(data.updated) + 3 * 3600e3);
  const updatedText = en ? `${MONTHS.en[updated.getUTCMonth()]} ${updated.getUTCDate()}, ${updated.toISOString().slice(11, 16)} Moscow time` : `${updated.getUTCDate()} ${MONTHS.ru[updated.getUTCMonth()]} в ${updated.toISOString().slice(11, 16)} по Москве`;
  const first = [...wcMatches, ...swissMatches].filter(m => m.at).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
  const startText = champion ? t(`Чемпион M8: ${champion.name}`, `M8 champion: ${champion.name}`) : first ? t(`Старт ${range(dayOf(first))}`, `Starts ${range(dayOf(first))}`) : 'M8';

  // Structured data: the event itself, so search can show dates, place and teams.
  const lastDay = gf?.at || [...koMatches, ...swissMatches].map(m => m.at).filter(Boolean).sort().at(-1) || first?.at;
  const eventLd = first ? {
    "@context": "https://schema.org", "@type": "SportsEvent", name: "M8 World Championship (Mobile Legends: Bang Bang)",
    url: `https://boostmlbb.ru${en ? "/en" : ""}/news/m8-istanbul-world-road/`, startDate: first.at, endDate: lastDay, sport: "Mobile Legends: Bang Bang",
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    location: [{ "@type": "Place", name: "ICONSIAM", address: { "@type": "PostalAddress", addressLocality: "Bangkok", addressCountry: "TH" } }, { "@type": "Place", name: "Ora Arena", address: { "@type": "PostalAddress", addressLocality: "Istanbul", addressCountry: "TR" } }],
    organizer: { "@type": "Organization", name: "MOONTON", url: "https://en.moonton.com/" },
    competitor: [...data.participants.swiss, ...data.participants.wildcard].filter(e => e.name).map(e => ({ "@type": "SportsTeam", name: team(e.name.toLowerCase()).name })),
    ...(champion ? { winner: { "@type": "SportsTeam", name: champion.name } } : {})
  } : null;
  return `<section class="container m8hub" id="m8-live" data-m8 data-lang="${lang}" data-start="${first?.at || ''}"${champion ? ' data-champion' : ''} aria-label="${t('M8: расписание и результаты', 'M8 schedule and results')}">
    <div class="m8-top">
      <div class="m8-now">
        <p class="m8-now__title" data-m8-headline>${esc(startText)}</p>
        <p class="m8-now__sub" data-m8-sub>${t('Бангкок и Стамбул, призовой фонд $1 000 000', 'Bangkok and Istanbul, $1,000,000 prize pool')}</p>
        <div class="m8-next" data-m8-next hidden><h3>${t('Ближайшие матчи', 'Up next')}</h3><div class="m8-next__list"></div></div>
      </div>
      ${watch ? `<div class="m8-watch" id="m8-watch"><h2>${t('Где смотреть на русском', 'Where to watch')}</h2><ul>${watch}</ul></div>` : ''}
    </div>
    <div class="m8-stages" id="m8-stages">
      <h2 class="arena-sr">${t('Расписание, сетка и результаты M8', 'M8 schedule, bracket and results')}</h2>
      <div class="m8-steps" role="tablist" aria-label="${t('Этапы M8', 'M8 stages')}">${steps.map((s, i) => `<button type="button" role="tab" id="m8-tab-${s.id}" aria-controls="m8-${s.id}" aria-selected="${i === 0}"${s.dates[0] ? ` data-from="${s.dates[0]}" data-to="${s.dates[1]}"` : ''}><span class="m8-step__dot" aria-hidden="true">${i + 1}</span><span class="m8-step__text"><b>${s.title}</b><span>${range(...s.dates)}</span><em data-m8-state></em></span></button>`).join('')}</div>
      ${panels.map(([id, html]) => `<div class="m8-panel" id="m8-${id}" role="tabpanel" aria-labelledby="m8-tab-${id}" tabindex="-1">${html}</div>`).join('\n')}
    </div>
    <section class="m8-teams" id="m8-teams">
      <h2>${t('Участники M8', 'M8 teams')}</h2>
      <h3>${t('Сразу в Swiss', 'Straight to the Swiss stage')}<span>${data.participants.swiss.length}</span></h3><ul class="tcs">${data.participants.swiss.map(teamCard).join('')}</ul>
      <h3>${t('Начинают с Wild Card', 'Starting in the Wild Card')}<span>${wcTeams.length}</span></h3><ul class="tcs">${wcTeams.map(teamCard).join('')}</ul>
    </section>
    <dialog class="m8-dialog" data-m8-dialog aria-labelledby="m8-dialog-title"><div class="m8-dialog__body"></div></dialog>
    <script type="application/json" data-m8-json>${JSON.stringify({ matches: payload, watch: streams.map(s => [s.kind, STREAM_NAMES[s.kind], s.url, svg(ICONS[s.kind])]) }).replace(/</g, '\\u003c')}</script>
  </section>
  ${eventLd ? `<script type="application/ld+json">${JSON.stringify(eventLd).replace(/</g, '\u003c')}</script>` : ''}
  <script src="/js/m8.js?v=7" defer></script>`;
}
