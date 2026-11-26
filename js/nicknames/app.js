// Nickname generator UI. Markup: scripts/nickname-page.mjs. Logic: ./engine.js.
// Flow: choose who it is for, a style and optionally a name -> a list of names -> tap one -> try a font and symbols -> copy.
import { generate, FONTS, FRAMES, length, MAX_LENGTH, cleanInput } from './engine.js?v=3';

const root = document.querySelector('[data-nickgen]');
if (root) start(root);

function start(root) {
  const en = root.dataset.lang === 'en';
  const t = (ru, english) => en ? english : ru;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const input = $('#ng-name'), clear = $('.ng-input__clear'), list = $('.ng-results');
  const bench = $('.ng-bench'), fontsBox = $('.ng-fonts'), framesBox = $('.ng-frames'), countBox = $('[data-nick-count]');
  const resultBox = $('[data-nick-result]'), saveBtn = $('[data-save-result]'), toast = $('.ng-toast');
  const favBox = $('.ng-favs'), favList = $('.ng-favs ul');
  const art = $('.ng-player__art');
  const heroes = JSON.parse(root.dataset.heroes || '[]');
  const narrow = matchMedia('(max-width: 980px)');
  const store = {
    read() { try { return JSON.parse(localStorage.getItem('mlbb_nick_favs') || '[]').slice(0, 40); } catch { return []; } },
    write(value) { try { localStorage.setItem('mlbb_nick_favs', JSON.stringify(value)); } catch { /* private mode */ } }
  };
  const params = new URLSearchParams(location.search);
  const state = { style: params.get('style') || 'mix', gender: params.get('for') || 'any', seen: new Set(), base: '', font: 'plain', frame: 0, favs: store.read(), hero: 0 };
  const PLAIN = { id: 'plain', ru: 'Обычный', en: 'Plain', map: text => text };
  const fonts = [PLAIN, ...FONTS];
  const frames = [['', ''], ...FRAMES];

  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const track = (event, detail) => { try { window.gtag?.('event', event, detail); window.ym?.(99684184, 'reachGoal', event); } catch { /* analytics blocked */ } };
  let toastTimer;
  const say = text => { toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 1800); };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const area = el('textarea'); area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
    say(t(`Скопировано: ${text}`, `Copied: ${text}`));
    track('nick_copy', { nick_style: state.style, nick_font: state.font });
  }
  const composed = () => {
    const font = fonts.find(f => f.id === state.font) || PLAIN;
    const [left, right] = frames[state.frame] || frames[0];
    return left + font.map(state.base) + right;
  };

  // ---------- list ----------
  function card(item) {
    const li = el('li', 'ng-card');
    const names = item.pair ? [item.name, item.pair] : [item.name];
    const button = el('button', 'ng-card__try');
    button.type = 'button';
    button.dataset.try = item.name;
    button.append(el('span', 'ng-card__name', names.join(' + ')));
    const note = item.pair ? t('Парный ник: примерьте каждый', 'Matching pair: try each one') : en ? item.en : item.ru;
    if (note) button.append(el('span', 'ng-card__note', note));
    button.append(el('span', 'ng-card__cta', t('Примерить', 'Try it')));
    li.append(button);
    if (item.pair) {
      const second = el('button', 'ng-card__second', t(`Примерить ${item.pair}`, `Try ${item.pair}`));
      second.type = 'button';
      second.dataset.try = item.pair;
      li.append(second);
    }
    const quick = el('button', 'ng-card__copy');
    quick.type = 'button';
    quick.dataset.copy = item.name;
    quick.setAttribute('aria-label', t(`Скопировать ${item.name}`, `Copy ${item.name}`));
    quick.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
    li.append(quick);
    return li;
  }
  function fill() {
    state.seen.clear();
    const batch = generate({ style: state.style, gender: state.gender, input: input.value, count: narrow.matches ? 10 : 12, seen: state.seen });
    list.replaceChildren(...batch.map(card));
    markSelected();
    if (batch[0] && !state.base) preview(batch[0].name, false);
  }
  function markSelected() {
    $$('.ng-card').forEach(node => node.classList.toggle('is-selected', [...node.querySelectorAll('[data-try]')].some(b => b.dataset.try === state.base)));
  }

  // ---------- preview ----------
  function renderOptions() {
    const latin = /[a-z]/i.test(state.base);
    fontsBox.replaceChildren(...fonts.map(font => {
      const sample = font.map(state.base);
      const usable = font.id === 'plain' || (latin && sample !== state.base);
      const option = el('button', 'ng-font');
      option.type = 'button';
      option.setAttribute('role', 'radio');
      option.setAttribute('aria-checked', String(state.font === font.id));
      option.disabled = !usable;
      option.dataset.font = font.id;
      const head = el('span', 'ng-font__name', en ? font.en : font.ru);
      if (font.rare) head.append(el('small', '', t('не на всех телефонах', 'not on every phone')));
      option.append(head, el('span', 'ng-font__sample', usable ? sample : t('только для латиницы', 'Latin letters only')));
      return option;
    }));
    framesBox.replaceChildren(...frames.map(([left, right], index) => {
      const option = el('button', 'ng-frame', index ? `${left}${left ? ' ' : ''}…${right ? ' ' : ''}${right}` : t('Без', 'None'));
      option.type = 'button';
      option.setAttribute('role', 'radio');
      option.setAttribute('aria-checked', String(state.frame === index));
      option.dataset.frame = String(index);
      return option;
    }));
  }
  function refresh() {
    const text = composed();
    $$('[data-nick-out]').forEach(node => { node.textContent = text; });
    resultBox.textContent = text;
    const size = length(text);
    countBox.textContent = t(`${size} из ${MAX_LENGTH} знаков`, `${size} of ${MAX_LENGTH} characters`);
    countBox.classList.toggle('is-over', size > MAX_LENGTH);
    $$('[data-font]').forEach(node => node.setAttribute('aria-checked', String(node.dataset.font === state.font)));
    $$('[data-frame]').forEach(node => node.setAttribute('aria-checked', String(Number(node.dataset.frame) === state.frame)));
    saveBtn.setAttribute('aria-pressed', String(state.favs.includes(text)));
  }
  function preview(name, open) {
    state.base = name;
    state.font = 'plain';
    state.frame = 0;
    renderOptions();
    refresh();
    markSelected();
    if (open && narrow.matches) openSheet();
  }
  function openSheet() {
    bench.classList.add('is-open');
    document.documentElement.classList.add('ng-locked');
    $('.ng-bench__close').focus({ preventScroll: true });
  }
  function closeSheet() {
    bench.classList.remove('is-open');
    document.documentElement.classList.remove('ng-locked');
    list.querySelector('.ng-card.is-selected [data-try]')?.focus({ preventScroll: true });
  }

  // ---------- saved ----------
  function renderFavs() {
    favBox.hidden = !state.favs.length;
    favList.replaceChildren(...state.favs.map(value => {
      const li = el('li');
      const pick = el('button', 'ng-fav', value);
      pick.type = 'button';
      pick.dataset.copy = value;
      pick.title = t('Скопировать', 'Copy');
      const remove = el('button', 'ng-fav__remove', '×');
      remove.type = 'button';
      remove.dataset.unsave = value;
      remove.setAttribute('aria-label', t(`Убрать ${value}`, `Remove ${value}`));
      li.append(pick, remove);
      return li;
    }));
    refresh();
  }

  // ---------- events ----------
  root.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || !root.contains(target)) { if (event.target === bench) closeSheet(); return; }
    if (target.dataset.try) { preview(target.dataset.try, true); return; }
    if (target.dataset.copy) { copy(target.dataset.copy); return; }
    if (target.dataset.unsave) { state.favs = state.favs.filter(v => v !== target.dataset.unsave); store.write(state.favs); renderFavs(); return; }
    if (target.dataset.font && !target.disabled) { state.font = target.dataset.font; refresh(); return; }
    if (target.dataset.frame) { state.frame = Number(target.dataset.frame); refresh(); return; }
    if (target.dataset.style) { state.style = target.dataset.style; press('style', state.style); state.base = ''; fill(); return; }
    if (target.dataset.gender) { state.gender = target.dataset.gender; press('gender', state.gender); state.base = ''; fill(); return; }
    if ('reroll' in target.dataset) {
      state.base = '';
      fill();
      // Scrolled down the list: show the new list from its first name, right under the sticky bar.
      const head = $('.ng-results-head');
      const gap = list.getBoundingClientRect().top - head.getBoundingClientRect().bottom;
      if (gap < -4) window.scrollBy({ top: gap - 8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      track('nick_more', { nick_style: state.style });
      return;
    }
    if ('copyResult' in target.dataset) { copy(composed()); return; }
    if ('saveResult' in target.dataset) {
      const text = composed();
      const has = state.favs.includes(text);
      state.favs = has ? state.favs.filter(v => v !== text) : [text, ...state.favs];
      store.write(state.favs);
      renderFavs();
      if (!has) { say(t('Добавлено в избранное', 'Saved')); track('nick_favorite', { nick_style: state.style }); }
      return;
    }
    if ('heroSwap' in target.dataset) { setHero(state.hero + 1); return; }
    if (target.classList.contains('ng-bench__close')) closeSheet();
  });
  bench.addEventListener('click', event => { if (event.target === bench) closeSheet(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && bench.classList.contains('is-open')) closeSheet(); });
  narrow.addEventListener('change', () => { if (!narrow.matches) closeSheet(); });

  const press = (group, value) => $$(`[data-${group}]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[group] === value)));
  press('style', state.style);
  press('gender', state.gender);

  let typing;
  input.addEventListener('input', () => {
    const clean = cleanInput(input.value);
    if (clean !== input.value.replace(/\s/g, '')) input.value = clean;
    clear.hidden = !input.value;
    clearTimeout(typing);
    typing = setTimeout(() => { state.base = ''; fill(); }, 400);
  });
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); clearTimeout(typing); state.base = ''; fill(); input.blur(); track('nick_generate', { with_name: Boolean(input.value) }); } });
  clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; state.base = ''; fill(); input.focus(); });

  function setHero(index) {
    if (!heroes.length) return;
    state.hero = (index + heroes.length) % heroes.length;
    art.src = `/images/heroes/art/${heroes[state.hero]}.webp`;
  }

  root.classList.add('is-ready');
  setHero(Math.floor(Math.random() * heroes.length));
  renderFavs();
  fill();
}
