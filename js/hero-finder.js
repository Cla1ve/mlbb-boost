(() => {
  const tools = document.querySelector('.atlas-tools');
  if (!tools) return;
  const query = document.getElementById('hero-query');
  const role = document.getElementById('hero-role');
  const tiers = document.querySelectorAll('.tier-row');
  const normalize = text => text.toLowerCase().replaceAll('ё', 'е').trim();
  function filter() {
    let total = 0;
    const term = normalize(query.value);
    for (const tier of tiers) {
      let count = 0;
      for (const hero of tier.querySelectorAll('.hero-chip')) {
        const matches = normalize(hero.dataset.names).includes(term) &&
          (!role.value || hero.dataset.roles.split(' ').includes(role.value));
        hero.hidden = !matches;
        if (matches) count++;
      }
      tier.hidden = count === 0;
      document.querySelector(`[data-tier-link="${tier.dataset.tier}"]`).hidden = tier.hidden;
      total += count;
    }
    document.getElementById('hero-empty').hidden = total > 0;
  }
  tools.hidden = false;
  query.addEventListener('input', filter);
  role.addEventListener('change', filter);
  filter();
})();
