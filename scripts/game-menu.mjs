const sections = [
  ['heroes', '/heroes/', 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 1H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 2h8m-7-2h6', 'Тир-лист', 'Tier list'],
  ['items', '/items/', 'm5 4 3 1 11 11-3 3L5 8 4 4Zm10 13 4-4m-1 5 2 2m-7-12 3-3 4-1-1 4-3 3m-7 3-4 4m2 2-3-3', 'Предметы', 'Items'],
  ['skins', '/skins/', 'M12 4a8 8 0 1 0 0 16h1a2 2 0 0 0 1.6-3.2 1.4 1.4 0 0 1 1.1-2.3H18a2 2 0 0 0 2-2 8 8 0 0 0-8-8ZM8 11h.01M11 8h.01M15 8h.01', 'Скины', 'Skins'],
  ['nickname-generator', '/nickname-generator/', 'm5 16-1 4 4-1 11-11-3-3L5 16Zm9-9 3 3M4 8h5M4 11h3m5 9h7', 'Генератор ников', 'Nickname generator'],
  ['news', '/news/', 'M5 4h13v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V4h1Zm13 6h2v7a3 3 0 0 1-3 3M8 8h6m-6 4h6m-6 4h4', 'Новости и гайды', 'News & guides']
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
        ${sections.map(([key, url, symbol, ru, english]) => {
          const href = `${en ? '/en' : ''}${url}`;
          const current = key === section ? ` aria-current="${href === pathname ? 'page' : 'location'}"` : '';
          return `<li><a href="${href}"${current}><span class="game-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="${symbol}" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${en ? english : ru}</span></a></li>`;
        }).join('')}
      </ul>
    </details>
  </li>`;
}
