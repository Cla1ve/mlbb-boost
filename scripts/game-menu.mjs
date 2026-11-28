const sections = [
  ['heroes', '/heroes/', '🏆', 'Тир-лист', 'Tier list'],
  ['items', '/items/', '⚔️', 'Предметы', 'Items'],
  ['skins', '/skins/', '🎨', 'Скины', 'Skins'],
  ['nickname-generator', '/nickname-generator/', '✍️', 'Генератор ников', 'Nickname generator'],
  ['news', '/news/', '📰', 'Новости и гайды', 'News & guides']
];

export function gameMenu(lang, pathname) {
  const en = lang === 'en';
  const section = pathname.replace(/^\/en\//, '/').split('/')[1];
  const active = sections.some(([key]) => key === section);
  const chevron = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<li class="game-menu">
    <details${active ? ' data-section-current' : ''}>
      <summary class="nav-link">
        <svg class="game-grid-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2.5 2.5h4v4h-4zm7 0h4v4h-4zm-7 7h4v4h-4zm7 0h4v4h-4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg><span>${en ? 'More sections' : 'Другие разделы'}</span><span class="game-chevron">${chevron}</span>
      </summary>
      <ul class="game-links">
        ${sections.map(([key, url, emoji, ru, english]) => {
          const href = `${en ? '/en' : ''}${url}`;
          const current = key === section ? ` aria-current="${href === pathname ? 'page' : 'location'}"` : '';
          return `<li><a href="${href}"${current}><span class="game-icon" aria-hidden="true">${emoji}</span><span>${en ? english : ru}</span></a></li>`;
        }).join('')}
      </ul>
    </details>
  </li>`;
}
