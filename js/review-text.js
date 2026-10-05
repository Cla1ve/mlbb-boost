/* Plain-text rendering of Telegram review markup. No HTML is inserted into the page. */
(function (root, factory) {
  var cleaner = factory();
  if (typeof module === 'object' && module.exports) module.exports = cleaner;
  else root.MLBBReviewText = cleaner;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  function decode(text) {
    return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (match, code) {
      if (code[0] !== '#') return entities[code.toLowerCase()] || match;
      var value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : '';
    });
  }
  function clean(value) {
    if (value == null) return '';
    var text = String(value).replace(/^(?:[\s\uFEFF\u200B]*review_html_v\d+::)+[\s\uFEFF\u200B]*/i, '');
    for (var i = 0; i < 3; i++) {
      var next = decode(text);
      if (next === text) break;
      text = next;
    }
    text = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    text = text.replace(/<br\s*\/?\s*>|<\/(?:p|div|blockquote)\s*>/gi, '\n');
    text = text.replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*?)?\s*\/?>/gi, '');
    text = text.replace(/(?:emoji-id|custom_emoji_id)\s*=\s*["']?\d+["']?/gi, '');
    return text.replace(/[\uFEFF\u200B]/g, '').replace(/[\t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  return { clean: clean };
});
