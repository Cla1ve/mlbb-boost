/**
 * MLBB Boost - RU -> EN translations for dynamic review content (reviews.js).
 * Keys are the trimmed Russian review texts / rank routes. Slang is rendered
 * as natural English gaming slang while keeping the casual tone and emojis.
 * Merged into window.MLBB_DICT. Loaded before js/i18n.js.
 */
(function () {
  var R = {
    /* ---- rank routes (left of arrow handled, full strings for safety) ---- */
    'Мифик 5★ → Мифик 20★': 'Mythic 5★ → Mythic 20★',
    'Эпик III → Легенда V': 'Epic III → Legend V',
    'Легенда III → Мифик': 'Legend III → Mythic',
    'Мифик Честь 35★ → Мифик Честь 48★': 'Mythic Honor 35★ → Mythic Honor 48★',
    'Эпик IV → Легенда IV': 'Epic IV → Legend IV',
    'Мифик 12★ → Мифик Честь 31★': 'Mythic 12★ → Mythic Honor 31★',
    'Легенда V → Мифик 5★': 'Legend V → Mythic 5★',
    'Мифик Слава 58★ → Мифик Слава 80★': 'Mythic Glory 58★ → Mythic Glory 80★',
    'Эпик II → Легенда III': 'Epic II → Legend III',
    'Мифик 3★ → Мифик 18★': 'Mythic 3★ → Mythic 18★',
    'Легенда IV → Мифик': 'Legend IV → Mythic',
    'Эпик V → Легенда V': 'Epic V → Legend V',
    'Мифик Честь 42★ → Мифик Слава 51★': 'Mythic Honor 42★ → Mythic Glory 51★',
    'Эпик I → Легенда III': 'Epic I → Legend III',
    'Мифик 7★ → Мифик 25★': 'Mythic 7★ → Mythic 25★',
    'Легенда II → Мифик 8★': 'Legend II → Mythic 8★',
    'Эпик III → Легенда IV': 'Epic III → Legend IV',
    'Мифик Честь 37★ → Мифик Честь 45★': 'Mythic Honor 37★ → Mythic Honor 45★',
    'Легенда V → Мифик': 'Legend V → Mythic',
    'Мифик 15★ → Мифик Честь 32★': 'Mythic 15★ → Mythic Honor 32★',
    'Эпик V → Легенда': 'Epic V → Legend',
    'Эпик II → Легенда IV': 'Epic II → Legend IV',
    'Легенда IV → Мифик': 'Legend IV → Mythic',
    'Легенда II → Мифик 12★': 'Legend II → Mythic 12★',
    'Мифик 8★ → Мифик 25★': 'Mythic 8★ → Mythic 25★',
    'Мифик 3★ → Мифик 15★': 'Mythic 3★ → Mythic 15★',
    'Мифик Честь 33★ → Мифик Честь 45★': 'Mythic Honor 33★ → Mythic Honor 45★',
    'Мифик Честь 38★ → Мифик Честь 50★': 'Mythic Honor 38★ → Mythic Honor 50★',
    'Мифик Слава 52★ → Мифик Слава 75★': 'Mythic Glory 52★ → Mythic Glory 75★',
    'Эпик IV → Легенда V': 'Epic IV → Legend V',
    'Мифик 8★ → Мифик 23★': 'Mythic 8★ → Mythic 23★',
    'Мифик Честь 39★ → Мифик Честь 50★': 'Mythic Honor 39★ → Mythic Honor 50★',
    'Мифик Слава 62★ → Мифик Слава 85★': 'Mythic Glory 62★ → Mythic Glory 85★',
    'Мифик 15★ → Мифик Честь 30★': 'Mythic 15★ → Mythic Honor 30★',
    'Мифик Честь 41★ → Мифик Слава 52★': 'Mythic Honor 41★ → Mythic Glory 52★',
    'Эпик I → Легенда IV': 'Epic I → Legend IV',
    'Легенда V → Мифик 8★': 'Legend V → Mythic 8★',
    'Мифик Честь 36★ → Мифик Честь 48★': 'Mythic Honor 36★ → Mythic Honor 48★',
    'Мифик 12★ → Мифик 25★': 'Mythic 12★ → Mythic 25★',
    'Мифик Слава 55★ → Мифик Слава 78★': 'Mythic Glory 55★ → Mythic Glory 78★',
    'Легенда II → Мифик': 'Legend II → Mythic',
    'Мифик 7★ → Мифик Честь 31★': 'Mythic 7★ → Mythic Honor 31★',
    'Эпик II → Легенда V': 'Epic II → Legend V',
    'Мифик 10★ → Мифик 25★': 'Mythic 10★ → Mythic 25★',
    'Мифик Честь 35★ → Мифик Честь 47★': 'Mythic Honor 35★ → Mythic Honor 47★',
    'Мифик Слава 60★ → Мифик Слава 82★': 'Mythic Glory 60★ → Mythic Glory 82★',
    'Мифик 18★ → Мифик Честь 32★': 'Mythic 18★ → Mythic Honor 32★',
    'Мифик Честь 38★ → Мифик Честь 50★ ': 'Mythic Honor 38★ → Mythic Honor 50★',
    'Мифик 5★ → Мифик 22★': 'Mythic 5★ → Mythic 22★',
    'Мифик Честь 40★ → Мифик Слава 51★': 'Mythic Honor 40★ → Mythic Glory 51★',
    'Мифик 12★ → Мифик 28★': 'Mythic 12★ → Mythic 28★',
    'Мифик 7★ → Мифик Честь 35★': 'Mythic 7★ → Mythic Honor 35★',

    /* ---- review texts ---- */
    'Взял буст после нового года, хотел начать сезон с хорошего ранга. Бустер топ, 15 звезд за день сделал, красава!':
      'Got a boost after New Year, wanted to start the season at a good rank. The booster is top, knocked out 15 stars in a day, what a legend!',
    'спасибо за помощь с рангом 🙏 бустер попался очень терпеливый, даже советы давал как лучше играть':
      'thanks for the help with my rank 🙏 the booster was super patient, even gave tips on how to play better',
    'После ресета застрял в легенде, решил не мучаться. Забустили быстро, без единого проигрыша! Респект':
      'After the reset I got stuck in Legend, decided not to suffer. They boosted fast, without a single loss! Respect',
    'Второй раз заказываю, всё также на высоте! Особенно порадовал винстрик на Джонсоне, противники в шоке были))':
      'Ordering for the second time, still top tier! The win streak on Johnson was especially nice, the enemies were in shock))',
    'наконец-то выбралась из эпика😭 спасибо большое, бустер был на связи 24/7, все четко и быстро':
      'finally climbed out of Epic😭 thank you so much, the booster was online 24/7, everything clean and fast',
    'Бустер тащил как зверь! Особенно на Лансе и Хае. Были пару сложных каток против сквадов, но все равно вытащил':
      'The booster carried like a beast! Especially on Lancelot and Hayabusa. There were a couple of tough matches against squads, but he still pulled it off',
    'Думала не получится дойти до мифика в начале сезона, но ребята помогли) Отдельное спасибо за стрим, было интересно смотреть':
      "Thought I wouldn't reach Mythic so early in the season, but the guys helped) Special thanks for the stream, it was fun to watch",
    'Дороговато конечно, но оно того стоит! На таких рангах без про игрока никак. Спасибо за качественный буст':
      'A bit pricey of course, but worth it! At these ranks there is no way without a pro player. Thanks for the quality boost',
    'изи катка) бустер красава, тащил на танках так, что все в шоке были. порадовало что без задержек все сделали':
      'easy game) the booster is a legend, carried on tanks so hard everyone was in shock. glad they did it all without delays',
    'Не первый раз обращаюсь, всегда все на высшем уровне! В этот раз особенно порадовал винрейт - 90%+':
      "Not my first time here, always top level! This time the win rate was especially nice — 90%+",
    'Сначала думал сам апнуться, но после 10 проигрышей подряд решил обратиться. Не пожалел, за день до мифика долетели':
      "At first I thought I'd climb myself, but after 10 losses in a row I decided to reach out. No regrets, we flew to Mythic in a day",
    'Спасибо большое за буст 💕 Бустер был очень вежливый, все объяснял. И главное - никаких афк и токсиков!':
      'Huge thanks for the boost 💕 The booster was very polite, explained everything. And most importantly — no AFKers or toxic players!',
    'Хотел апнуться до славы, ребята помогли. Немного затянули по времени, но результат порадовал. Винрейт около 80%':
      'Wanted to climb to Glory, the guys helped. Took a little longer than expected, but the result was great. Win rate around 80%',
    'го*но тиммейты достали в эпике, спс что вытащили в легенду! бустер адекватный, даже с войсом играли':
      'trash teammates were driving me crazy in Epic, thanks for pulling me to Legend! the booster was chill, we even played with voice chat',
    'Заказывала буст первый раз, очень переживала. Но всё прошло отлично! Бустер играл на моих любимых героях, без проблем':
      'Ordered a boost for the first time, was really nervous. But everything went great! The booster played my favorite heroes, no problems',
    'Топ буст, на одном дыхании до мифика долетели) Отдельное спасибо за советы по игре на миде':
      'Top boost, flew to Mythic in one go) Special thanks for the tips on playing mid',
    'боялась что кинут или забанят, но все прошло супер! из эпика ада наконец-то выбралась, ура ✨':
      'was scared of getting scammed or banned, but everything went great! finally escaped epic hell, hooray ✨',
    'Хороший буст, бустер знает свое дело. Правда один раз слил катку, но потом закрыл винстриком в 8 игр':
      'Good boost, the booster knows his stuff. He did throw one match, but then closed it out with an 8-game win streak',
    'спасибо за помощь в новом сезоне 🙏 бустер был супер, все быстро и четко. теперь можно и самой катать':
      'thanks for the help in the new season 🙏 the booster was awesome, fast and clean. now I can grind myself too',
    'Решил не тратить время на гринд. Бустер затащил даже против про игроков, красава! Все быстро и четко':
      'Decided not to waste time grinding. The booster carried even against pro players, what a legend! All fast and clean',
    'Спс за буст! Наконец-то выбрался из эпика, а то там полный треш. Бустер адекватный, даже стримил катки)':
      'Thanks for the boost! Finally got out of Epic, it was a total mess there. The booster was chill, even streamed the matches)',
    'Ребята топ, не первый раз обращаюсь. Из эпика вытащили за 2 дня, хотя обещали за 3-4. Винрейт около 80%':
      'These guys are top, not my first time. Pulled me out of Epic in 2 days, though they promised 3-4. Win rate around 80%',
    'бустер красава) тащил на фанни как крейзи, противники в шоке были хахах':
      'the booster is a legend) carried on Fanny like crazy, the enemies were in shock hahah',
    'Долго не мог решиться на буст, но команда попалась отличная. Особенно порадовало, что можно было выбрать героев для буста. Сейчас наконец-то мифик!':
      "Took me a while to decide on a boost, but the team was great. Loved that I could pick the heroes for the boost. Now I'm finally Mythic!",
    'Спасибо за качественный буст! Бустер всегда был на связи, отвечал на все вопросы. Подняли аж до 12 звезд сразу':
      'Thanks for the quality boost! The booster was always in touch, answered all my questions. Pushed all the way to 12 stars at once',
    'Решил не мучаться в соло, взял буст. Бустер затащил 17 звезд за день, винрейт 92%. Теперь можно и в честь)':
      'Decided not to suffer in solo, got a boost. The booster carried 17 stars in a day, 92% win rate. Now on to Honor)',
    'норм забустили, правда были небольшие проблемы с графиком, но в целом доволен. винрейт около 75%':
      'decent boost, there were minor scheduling issues, but overall happy. win rate around 75%',
    'Топ буст, бустер тащил на ланселоте как бог! Очень доволен, хоть и дороговато немного. Но оно того стоит':
      'Top boost, the booster carried on Lancelot like a god! Very happy, even if a bit pricey. But it was worth it',
    'Взял буст до славы, бустер реально про игрок. Затащил даже против трио, респект':
      'Got a boost to Glory, the booster is a real pro. Carried even against a trio, respect',
    'Профи своего дела! Поднял 23 звезды за 2 дня, хотя на этих рангах очень сложно. Всем советую':
      'A true pro! Pushed 23 stars in 2 days, even though it is really hard at these ranks. Recommend to everyone',
    'Думала не получится выбраться из эпика, но ребята помогли! Очень вежливый бустер попался, все объяснял)':
      "Thought I'd never escape Epic, but the guys helped! Got a very polite booster, explained everything)",
    'Решил сделать себе подарок на нг) Из эпика наконец-то выбрался, спасибо большое! Бустер топ, без единого проигрыша':
      'Decided to treat myself for New Year) Finally got out of Epic, thank you so much! The booster is top, without a single loss',
    'хотела закрыть сезон в топе, ребята помогли! винрейт 85%+ вообще без проблем, бустер тащил как надо':
      'wanted to finish the season at the top, the guys helped! 85%+ win rate no problem at all, the booster carried just right',
    'Перед ресетом решил добить до славы. Немного дороговато, но результат того стоит! Бустер реально скилловый':
      'Before the reset I decided to push to Glory. A bit pricey, but the result is worth it! The booster is really skilled',
    'наконец-то мифик! спасибо большое 🙏 отдельное спасибо за советы по игре на миде, очень помогло':
      'finally Mythic! thank you so much 🙏 special thanks for the mid lane tips, it helped a lot',
    'Уже 3й раз заказываю, всегда все четко! В этот раз особенно порадовал винрейт и скорость':
      'Ordering for the 3rd time already, always clean! This time the win rate and speed were especially nice',
    'Спасибо за помощь с рангом ❤️ Бустер был супер добрый, все объяснял и даже с войсом поиграли пару каток':
      'Thanks for the help with my rank ❤️ The booster was super kind, explained everything and we even played a couple of matches with voice chat',
    'бустер реально монстр! тащил 1 против 5 иногда, противники в шоке были. за 2 дня все сделали':
      'the booster is a real monster! sometimes carried 1 vs 5, the enemies were in shock. got it all done in 2 days',
    'Не думала что получится так быстро апнуться) За день до мифика дошли, еще и с запасом звезд':
      'Never thought I could climb so fast) Reached Mythic in a day, with stars to spare too',
    'Хотел успеть до конца сезона в славу, и успели! Правда пришлось немного доплатить за срочность, но оно того стоило':
      'Wanted to make it to Glory before the season ended, and we did! Had to pay a little extra for the rush, but it was worth it',
    'первый раз брала буст, очень переживала. но бустер попался хороший, все объяснил и быстро все сделал 💕':
      'first time getting a boost, was really nervous. but the booster was great, explained everything and did it all fast 💕',
    'Уже который раз обращаюсь, всегда все на высшем уровне! Особенно радует что можно выбрать героев':
      'Coming back yet again, always top level! Especially love that I can pick the heroes',
    'спасибо за буст ✨ бустер был супер, все быстро и четко. отдельное спасибо за стрим, было интересно':
      'thanks for the boost ✨ the booster was awesome, fast and clean. special thanks for the stream, it was fun',
    'Достали тиммейты в эпике, решил не мучаться. Бустер за день все сделал, красава! Даже с войсом поиграли':
      'Teammates in Epic were unbearable, decided not to suffer. The booster did it all in a day, what a legend! We even played with voice chat',
    'второй раз заказываю, всё супер! бустер адекватный, всегда на связи. винрейт под 90% вышел':
      'ordering for the second time, all great! the booster is chill, always in touch. win rate came out near 90%',
    'Хотел успеть до конца сезона побольше звезд набить. Бустер реально затащил, особенно на Лансе и Хае':
      'Wanted to farm more stars before the season ended. The booster really carried, especially on Lancelot and Hayabusa',
    'боялась что не получится выйти из эпика до конца сезона, но ребята помогли 🙏 бустер был очень терпеливый':
      "was scared I wouldn't escape Epic before the season ended, but the guys helped 🙏 the booster was very patient",
    'Дорого конечно на этих рангах, но оно того стоит. Бустер реально про, затащил даже против местных про команд':
      'Pricey at these ranks for sure, but worth it. The booster is a real pro, carried even against local pro teams',
    'наконец-то мифик перед новым сезоном 😊 спасибо большое, все быстро и качественно сделали':
      'finally Mythic before the new season 😊 thank you so much, did it all fast and well',
    'Решил под конец сезона в честь выбраться. Бустер красава, особенно на ассасинах тащил. Рекомендую!':
      'Decided to climb to Honor at the end of the season. The booster is a legend, carried especially on assassins. Recommend!',
    'спасибо за буст! из эпик хелла наконец-то выбралась. бустер адекватный, все четко объяснял':
      'thanks for the boost! finally escaped epic hell. the booster was chill, explained everything clearly',
    'Решил подготовиться к концу сезона заранее. Бустер затащил 15 звезд за день, вообще без проблем!':
      'Decided to prep for the end of the season early. The booster carried 15 stars in a day, no problems at all!',
    'первый раз заказывала буст, очень волновалась 😅 но бустер попался хороший, все объяснял и даже тактику показывал':
      'first time ordering a boost, was really anxious 😅 but the booster was great, explained everything and even showed tactics',
    'Уже не первый раз обращаюсь, всегда все на уровне! В этот раз особенно порадовал пик героев и винрейт':
      'Not my first time here, always on point! This time the hero picks and win rate were especially nice',
    'спасибо за буст до мифика ✨ бустер был супер, все быстро и четко. стрим вообще топчик!':
      'thanks for the boost to Mythic ✨ the booster was awesome, fast and clean. the stream was top notch!',
    'Дорого, но оно того стоит! Бустер реально монстр, тащил даже против про команд. Респект за скилл':
      'Pricey, but worth it! The booster is a real monster, carried even against pro teams. Respect for the skill',
    'наконец-то выбралась из эпика 🎉 спасибо большое, бустер был на связи постоянно, все супер!':
      'finally escaped Epic 🎉 thank you so much, the booster was always in touch, all great!',
    'бустер красава! тащил на фанни и лансе как про. противники в шоке были, особенно когда 1 против 3 затащил':
      'the booster is a legend! carried on Fanny and Lancelot like a pro. the enemies were in shock, especially when he carried 1 vs 3',
    'Долго не могла решиться на буст, но не пожалела! За день до мифика дошли, еще и с запасом звезд':
      'Took me a while to decide on a boost, but no regrets! Reached Mythic in a day, with stars to spare too',
    'Хотел до славы дойти, бустер помог. Немного дороговато вышло, но зато быстро и без единого проигрыша':
      'Wanted to reach Glory, the booster helped. Came out a bit pricey, but it was fast and without a single loss',
    'спасибо за помощь с рангом 💖 бустер был очень терпеливый, все объяснял. даже с войсом поиграли немного':
      'thanks for the help with my rank 💖 the booster was very patient, explained everything. we even played a bit with voice chat',
    'Не первый раз беру буст тут, всегда все четко! В этот раз вообще удивили - 17 звезд за день без единого проигрыша':
      'Not my first boost here, always clean! This time they really surprised me — 17 stars in a day without a single loss',
    'бустер топ! особенно порадовало что можно было смотреть стрим. много полезного узнала по игре':
      'the booster is top! especially loved being able to watch the stream. learned a lot of useful stuff about the game',
    'второй раз заказываю, всё супер! бустер адекватный, всегда на связи. особенно порадовал винрейт':
      'ordering for the second time, all great! the booster is chill, always in touch. the win rate was especially nice',
    'Хотел побыстрее до чести дойти. Бустер реально затащил, особенно на танках впечатлил. Рекомендую!':
      'Wanted to reach Honor faster. The booster really carried, especially impressive on tanks. Recommend!',
    'боялась что не выйдет из эпика, но ребята помогли 🙏 бустер был супер, все объяснял и поддерживал':
      "was scared I wouldn't get out of Epic, but the guys helped 🙏 the booster was awesome, explained everything and was supportive",
    'Дорого конечно на этих рангах, но результат порадовал. Бустер реально про, затащил даже против местных топов':
      'Pricey at these ranks for sure, but the result was great. The booster is a real pro, carried even against local top players',
    'спасибо за буст! бустер был очень терпеливый, все четко объяснял. и главное - быстро все сделали 💫':
      'thanks for the boost! the booster was very patient, explained everything clearly. and best of all — did it all fast 💫',
    'Решил не мучаться с рандомами. Бустер красава, особенно на ассасинах тащил. Всем советую!':
      'Decided not to suffer with randoms. The booster is a legend, carried especially on assassins. Recommend to everyone!',
    'наконец-то распрощалась с эпиком 😌 бустер был супер, все быстро и качественно. буду обращаться еще!':
      'finally said goodbye to Epic 😌 the booster was awesome, fast and high quality. will come back again!'
  };

  /* ---- live reviews UI (reviews.js v3) ---- */
  R['Бустер'] = 'Booster';
  R['Открыть отзыв'] = 'Open review';
  R['Без комментария'] = 'No comment';

  /* boost type labels */
  R['Стандартный буст'] = 'Standard boost';
  R['Буст на роли'] = 'Role boost';
  R['Буст на герое'] = 'Hero boost';
  R['Буст в пати'] = 'Party boost';
  R['Rising: вход'] = 'Rising: login';
  R['Rising: пати'] = 'Rising: party';

  /* chip labels */
  R['Герой:'] = 'Hero:';
  R['Роль:'] = 'Role:';

  /* filters */
  R['Оценка'] = 'Rating';
  R['Все'] = 'All';
  R['5 звёзд'] = '5 stars';
  R['4+ звёзды'] = '4+ stars';
  R['3+ звезды'] = '3+ stars';
  R['Все типы'] = 'All types';
  R['Показать ещё'] = 'Show more';

  /* states */
  R['Ничего не найдено'] = 'Nothing found';
  R['Под выбранные фильтры пока нет отзывов. Попробуйте смягчить условия.'] =
    'No reviews match the selected filters yet. Try relaxing the conditions.';
  R['Не удалось загрузить отзывы'] = 'Failed to load reviews';
  R['Проверьте соединение и попробуйте ещё раз.'] = 'Check your connection and try again.';
  R['Повторить'] = 'Retry';
  R['Отзывы в Telegram'] = 'Reviews on Telegram';
  R['Появились новые отзывы'] = 'New reviews available';

  window.MLBB_DICT = window.MLBB_DICT || {};
  for (var k in R) {
    if (R.hasOwnProperty(k)) window.MLBB_DICT[k] = R[k];
  }
})();
