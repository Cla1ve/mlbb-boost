const assert = require('node:assert/strict');
const { clean } = require('../js/review-text.js');
const cases = [
  ['review_html_v1::спасибо <tg-emoji emoji-id="5447567034541973507">🥰</tg-emoji>', 'спасибо 🥰'],
  ['&lt;tg-emoji emoji-id=&quot;123&quot;&gt;❤️&lt;/tg-emoji&gt;', '❤️'],
  ['&amp;lt;tg-emoji emoji-id=&amp;quot;123&amp;quot;&amp;gt;🔥&amp;lt;/tg-emoji&amp;gt;', '🔥'],
  ['<b>Отлично</b><br>Спасибо &amp; удачи <a href="https://t.me/a">всем</a>', 'Отлично\nСпасибо & удачи всем'],
  ['Текст<script>alert(1)</script><img src=x onerror=alert(1)> отзыв', 'Текст отзыв'],
  ['Обычный отзыв 😀 и счёт 150 → 200 ⭐', 'Обычный отзыв 😀 и счёт 150 → 200 ⭐'],
  ['&#x1F970; &#128077; &#39;текст&#39;', "🥰 👍 'текст'"],
  [null, ''],
];
for (const [input, expected] of cases) assert.equal(clean(input), expected);
for (const [input] of cases) assert.equal(clean(clean(input)), clean(input), 'Cleaning cached content must be idempotent');
console.log('Telegram custom emoji, escaped markup, safe plain text and cached text cleanup passed.');
