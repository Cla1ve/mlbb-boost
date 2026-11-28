// Server markup of the nickname generator on /nickname-generator/. The browser logic lives in js/nicknames/.
// The first list of names is generated with a fixed seed, so a rebuild never changes the page.
import { generate, STYLES } from '../js/nicknames/engine.js';

const PREVIEW_HEROES = ['kagura', 'ling', 'gusion', 'fanny', 'selena', 'lancelot', 'layla', 'miya', 'hayabusa', 'hirara', 'nolan', 'valentina'];
const CYRILLIC = /[А-Яа-яЁё]/;
const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
export const ICON = {
  copy: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h3.5c2 0 3.2 1 4.3 2.6l.4.6M4 17h3.5c2 0 3.2-1 4.3-2.6l2.4-3.6C15.3 9 16.5 7 18.5 7H20M17 4l3 3-3 3M17 14l3 3-3 3M14.6 14.4c1 1.5 2 2.6 3.9 2.6H20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

export function renderNickTool(locale) {
  const en = locale === 'en';
  const t = (ru, english) => en ? english : ru;
  // English pages carry no Cyrillic in their HTML (a build rule); the browser still offers Russian names there.
  const first = generate({ count: 30, random: seeded(20261126) }).filter(item => !en || !CYRILLIC.test(item.name)).filter(item => !item.pair).slice(0, 12);
  const styles = STYLES.map(([id, ru, english]) => `<button type="button" class="ng-chip" data-style="${id}" aria-pressed="${id === 'mix'}">${en ? english : ru}</button>`).join('');
  const gender = [['any', t('Всем', 'Anyone')], ['m', t('Парню', 'For him')], ['f', t('Девушке', 'For her')]]
    .map(([id, text]) => `<button type="button" data-gender="${id}" aria-pressed="${id === 'any'}">${text}</button>`).join('');
  const card = item => `<li class="ng-card"><button type="button" class="ng-card__try" data-try="${esc(item.name)}"><span class="ng-card__name">${esc(item.name)}</span>${(en ? item.en : item.ru) ? `<span class="ng-card__note">${esc(en ? item.en : item.ru)}</span>` : ''}<span class="ng-card__cta">${t('Примерить', 'Try it')}</span></button></li>`;
  return `<section class="container nickgen" id="generator" data-nickgen data-lang="${locale}" data-heroes='${JSON.stringify(PREVIEW_HEROES)}' aria-labelledby="ng-title">
    <div class="ng-main">
      <div class="ng-setup">
        <h2 id="ng-title" class="arena-sr">${t('Генератор ников', 'Nickname generator')}</h2>
        <div class="ng-row">
          <div class="ng-field">
            <span class="ng-label" id="ng-for">${t('Для кого', 'For')}</span>
            <div class="ng-seg" role="group" aria-labelledby="ng-for">${gender}</div>
          </div>
          <div class="ng-field ng-field--grow">
            <label class="ng-label" for="ng-name">${t('Своё имя или слово', 'Your name or a word')} <span>${t('необязательно', 'optional')}</span></label>
            <div class="ng-input"><input id="ng-name" type="text" maxlength="12" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="${t('Например, Макс', 'For example, Max')}"><button type="button" class="ng-input__clear" aria-label="${t('Очистить', 'Clear')}" hidden>${ICON.close}</button></div>
          </div>
        </div>
        <div class="ng-field">
          <span class="ng-label" id="ng-style">${t('Стиль', 'Style')}</span>
          <div class="ng-chips" role="group" aria-labelledby="ng-style">${styles}</div>
        </div>
      </div>
      <div class="ng-results-head">
        <p class="ng-status" aria-live="polite">${t('Нажмите на ник, чтобы примерить', 'Tap a name to try it')}</p>
        <button type="button" class="ng-reroll" data-reroll>${ICON.shuffle}<span>${t('Другие варианты', 'New ideas')}</span></button>
      </div>
      <ul class="ng-results">${first.map(card).join('')}</ul>
      <div class="ng-favs" hidden><h3>${t('Избранное', 'Saved')}</h3><ul></ul></div>
    </div>
    <aside class="ng-bench" aria-label="${t('Примерочная', 'Preview')}">
      <div class="ng-bench__panel" role="dialog" aria-modal="false" aria-labelledby="ng-bench-title">
        <div class="ng-bench__head"><h2 id="ng-bench-title">${t('Примерочная', 'Preview')}</h2><button type="button" class="ng-bench__close" aria-label="${t('Закрыть', 'Close')}">${ICON.close}</button></div>
        <div class="ng-stage">
          <div class="ng-player">
            <img class="ng-player__art" src="/images/heroes/art/${PREVIEW_HEROES[0]}.webp" width="240" height="390" alt="">
            <div class="ng-player__plate"><img src="/images/ranks/Mythical_Glory.webp" width="26" height="26" alt=""><span data-nick-out>${esc(first[0].name)}</span></div>
          </div>
          <div class="ng-stage__side">
            <p class="ng-chat"><span>${t('[Команде]', '[Team]')}</span> <b data-nick-out>${esc(first[0].name)}</b>: gg wp</p>
            <p class="ng-result" data-nick-result>${esc(first[0].name)}</p>
            <p class="ng-count" data-nick-count></p>
            <button type="button" class="ng-hero" data-hero-swap>${t('Сменить героя', 'Change hero')}</button>
          </div>
        </div>
        <div class="ng-opt">
          <h3>${t('Шрифт', 'Font')}</h3>
          <div class="ng-fonts" role="radiogroup" aria-label="${t('Шрифт', 'Font')}"></div>
        </div>
        <div class="ng-opt">
          <h3>${t('Украшение', 'Symbols')}</h3>
          <div class="ng-frames" role="radiogroup" aria-label="${t('Украшение', 'Symbols')}"></div>
        </div>
        <div class="ng-actions">
          <button type="button" class="ng-copy" data-copy-result>${ICON.copy}<span>${t('Скопировать ник', 'Copy name')}</span></button>
          <button type="button" class="ng-save" data-save-result aria-pressed="false" aria-label="${t('В избранное', 'Save')}">${ICON.star}</button>
        </div>
        <p class="ng-hint">${t('Проверьте ник в поле смены имени до покупки карточки: если знак не подходит, игра скажет об этом сразу.', 'Check the name in the rename field before buying a card: the game tells you right away if a character is not allowed.')}</p>
      </div>
    </aside>
    <div class="ng-toast" role="status" aria-live="polite" hidden></div>
  </section>
  <script type="module" src="/js/nicknames/app.js?v=4"></script>`;
}
