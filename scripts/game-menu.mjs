const sections = [
  ['/heroes/', 'Герои и тир-лист', 'Heroes & tier list'],
  ['/items/', 'Предметы', 'Items'],
  ['/skins/', 'Скины', 'Skins'],
  ['/news/', 'Новости', 'News'],
  ['/news/?category=guides', 'Гайды', 'Guides'],
  ['/news/mlbb-current-patch/', 'Патч', 'Patch notes'],
  ['/nickname-generator/', 'Генератор ников', 'Nickname generator']
];

export function gameMenu(lang) {
  const en = lang === 'en';
  return `<li class="game-menu"><details><summary class="nav-link">${en ? 'Explore MLBB' : 'Разделы MLBB'} ▾</summary><div class="game-links">${sections.map(([url, ru, english]) => `<a href="${en ? '/en' : ''}${url}">${en ? english : ru}</a>`).join('')}</div></details></li>`;
}
