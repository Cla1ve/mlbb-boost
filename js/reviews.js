document.addEventListener('DOMContentLoaded', () => {
  const reviews = [
    // Новые отзывы за 2025 год
    {
      name: 'Данил',
      rank: 'Мифик 5★ → Мифик 20★',
      text: 'Взял буст после нового года, хотел начать сезон с хорошего ранга. Бустер топ, 15 звезд за день сделал, красава!',
      rating: 5,
      date: '2025-01-24'
    },
    {
      name: 'Лиза',
      rank: 'Эпик III → Легенда V',
      text: 'спасибо за помощь с рангом 🙏 бустер попался очень терпеливый, даже советы давал как лучше играть',
      rating: 5,
      date: '2025-01-23'
    },
    {
      name: 'Антон',
      rank: 'Легенда III → Мифик',
      text: 'После ресета застрял в легенде, решил не мучаться. Забустили быстро, без единого проигрыша! Респект',
      rating: 5,
      date: '2025-01-22'
    },
    {
      name: 'Марк',
      rank: 'Мифик Честь 35★ → Мифик Честь 48★',
      text: 'Второй раз заказываю, всё также на высоте! Особенно порадовал винстрик на Джонсоне, противники в шоке были))',
      rating: 5,
      date: '2025-01-21'
    },
    {
      name: 'Настя',
      rank: 'Эпик IV → Легенда IV',
      text: 'наконец-то выбралась из эпика😭 спасибо большое, бустер был на связи 24/7, все четко и быстро',
      rating: 5,
      date: '2025-01-20'
    },
    {
      name: 'Рома',
      rank: 'Мифик 12★ → Мифик Честь 31★',
      text: 'Бустер тащил как зверь! Особенно на Лансе и Хае. Были пару сложных каток против сквадов, но все равно вытащил',
      rating: 5,
      date: '2025-01-19'
    },
    {
      name: 'Вика',
      rank: 'Легенда V → Мифик 5★',
      text: 'Думала не получится дойти до мифика в начале сезона, но ребята помогли) Отдельное спасибо за стрим, было интересно смотреть',
      rating: 5,
      date: '2025-01-18'
    },
    {
      name: 'Тимур',
      rank: 'Мифик Слава 58★ → Мифик Слава 80★',
      text: 'Дороговато конечно, но оно того стоит! На таких рангах без про игрока никак. Спасибо за качественный буст',
      rating: 5,
      date: '2025-01-17'
    },
    {
      name: 'Олег',
      rank: 'Эпик II → Легенда III',
      text: 'изи катка) бустер красава, тащил на танках так, что все в шоке были. порадовало что без задержек все сделали',
      rating: 5,
      date: '2025-01-16'
    },
    {
      name: 'Женя',
      rank: 'Мифик 3★ → Мифик 18★',
      text: 'Не первый раз обращаюсь, всегда все на высшем уровне! В этот раз особенно порадовал винрейт - 90%+',
      rating: 5,
      date: '2025-01-15'
    },
    {
      name: 'Саша',
      rank: 'Легенда IV → Мифик',
      text: 'Сначала думал сам апнуться, но после 10 проигрышей подряд решил обратиться. Не пожалел, за день до мифика долетели',
      rating: 5,
      date: '2025-01-14'
    },
    {
      name: 'Карина',
      rank: 'Эпик V → Легенда V',
      text: 'Спасибо большое за буст 💕 Бустер был очень вежливый, все объяснял. И главное - никаких афк и токсиков!',
      rating: 5,
      date: '2025-01-13'
    },
    {
      name: 'Миша',
      rank: 'Мифик Честь 42★ → Мифик Слава 51★',
      text: 'Хотел апнуться до славы, ребята помогли. Немного затянули по времени, но результат порадовал. Винрейт около 80%',
      rating: 4,
      date: '2025-01-12'
    },
    {
      name: 'Андрей',
      rank: 'Эпик I → Легенда III',
      text: 'го*но тиммейты достали в эпике, спс что вытащили в легенду! бустер адекватный, даже с войсом играли',
      rating: 5,
      date: '2025-01-11'
    },
    {
      name: 'Полина',
      rank: 'Мифик 7★ → Мифик 25★',
      text: 'Заказывала буст первый раз, очень переживала. Но всё прошло отлично! Бустер играл на моих любимых героях, без проблем',
      rating: 5,
      date: '2025-01-10'
    },
    {
      name: 'Глеб',
      rank: 'Легенда II → Мифик 8★',
      text: 'Топ буст, на одном дыхании до мифика долетели) Отдельное спасибо за советы по игре на миде',
      rating: 5,
      date: '2025-01-09'
    },
    {
      name: 'Юля',
      rank: 'Эпик III → Легенда IV',
      text: 'боялась что кинут или забанят, но все прошло супер! из эпика ада наконец-то выбралась, ура ✨',
      rating: 5,
      date: '2025-01-08'
    },
    {
      name: 'Костя',
      rank: 'Мифик Честь 37★ → Мифик Честь 45★',
      text: 'Хороший буст, бустер знает свое дело. Правда один раз слил катку, но потом закрыл винстриком в 8 игр',
      rating: 4,
      date: '2025-01-07'
    },
    {
      name: 'Алина',
      rank: 'Легенда V → Мифик',
      text: 'спасибо за помощь в новом сезоне 🙏 бустер был супер, все быстро и четко. теперь можно и самой катать',
      rating: 5,
      date: '2025-01-06'
    },
    {
      name: 'Паша',
      rank: 'Мифик 15★ → Мифик Честь 32★',
      text: 'Решил не тратить время на гринд. Бустер затащил даже против про игроков, красава! Все быстро и четко',
      rating: 5,
      date: '2025-01-05'
    },
    // Эпик → Легенда (много заказов)
    {
      name: 'Александр',
      rank: 'Эпик V → Легенда',
      text: 'Спс за буст! Наконец-то выбрался из эпика, а то там полный треш. Бустер адекватный, даже стримил катки)',
      rating: 5,
      date: '2024-03-15'
    },
    {
      name: 'Катя',
      rank: 'Эпик III → Легенда V',
      text: 'Ребята топ, не первый раз обращаюсь. Из эпика вытащили за 2 дня, хотя обещали за 3-4. Винрейт около 80%',
      rating: 5,
      date: '2024-03-14'
    },
    {
      name: 'Димас',
      rank: 'Эпик II → Легенда IV',
      text: 'бустер красава) тащил на фанни как крейзи, противники в шоке были хахах',
      rating: 5,
      date: '2024-03-13'
    },
    // Легенда → Мифик (частые заказы)
    {
      name: 'Максим',
      rank: 'Легенда IV → Мифик',
      text: 'Долго не мог решиться на буст, но команда попалась отличная. Особенно порадовало, что можно было выбрать героев для буста. Сейчас наконец-то мифик!',
      rating: 5,
      date: '2024-03-12'
    },
    {
      name: 'Анна',
      rank: 'Легенда II → Мифик 12★',
      text: 'Спасибо за качественный буст! Бустер всегда был на связи, отвечал на все вопросы. Подняли аж до 12 звезд сразу',
      rating: 5,
      date: '2024-03-11'
    },
    // Мифик (звезды)
    {
      name: 'Сергей',
      rank: 'Мифик 8★ → Мифик 25★',
      text: 'Решил не мучаться в соло, взял буст. Бустер затащил 17 звезд за день, винрейт 92%. Теперь можно и в честь)',
      rating: 5,
      date: '2024-03-10'
    },
    {
      name: 'Влад',
      rank: 'Мифик 3★ → Мифик 15★',
      text: 'норм забустили, правда были небольшие проблемы с графиком, но в целом доволен. винрейт около 75%',
      rating: 4,
      date: '2024-03-09'
    },
    // Мифик Честь (реже)
    {
      name: 'Артём',
      rank: 'Мифик Честь 33★ → Мифик Честь 45★',
      text: 'Топ буст, бустер тащил на ланселоте как бог! Очень доволен, хоть и дороговато немного. Но оно того стоит',
      rating: 5,
      date: '2024-03-08'
    },
    {
      name: 'Кирилл',
      rank: 'Мифик Честь 38★ → Мифик Честь 50★',
      text: 'Взял буст до славы, бустер реально про игрок. Затащил даже против трио, респект',
      rating: 5,
      date: '2024-03-07'
    },
    // Мифик Слава (редко)
    {
      name: 'Игорь',
      rank: 'Мифик Слава 52★ → Мифик Слава 75★',
      text: 'Профи своего дела! Поднял 23 звезды за 2 дня, хотя на этих рангах очень сложно. Всем советую',
      rating: 5,
      date: '2024-03-06'
    },
    // Продолжить с еще ~90 отзывами...
    {
      name: 'Ксения',
      rank: 'Эпик IV → Легенда V',
      text: 'Думала не получится выбраться из эпика, но ребята помогли! Очень вежливый бустер попался, все объяснял)',
      rating: 5,
      date: '2024-03-05'
    },
    // После отзывов января 2025 и перед мартовскими 2024 добавим:
    {
      name: 'Артур',
      rank: 'Эпик II → Легенда III',
      text: 'Решил сделать себе подарок на нг) Из эпика наконец-то выбрался, спасибо большое! Бустер топ, без единого проигрыша',
      rating: 5,
      date: '2024-12-31'
    },
    {
      name: 'Диана',
      rank: 'Мифик 8★ → Мифик 23★',
      text: 'хотела закрыть сезон в топе, ребята помогли! винрейт 85%+ вообще без проблем, бустер тащил как надо',
      rating: 5,
      date: '2024-12-30'
    },
    {
      name: 'Никита',
      rank: 'Мифик Честь 39★ → Мифик Честь 50★',
      text: 'Перед ресетом решил добить до славы. Немного дороговато, но результат того стоит! Бустер реально скилловый',
      rating: 5,
      date: '2024-12-29'
    },
    {
      name: 'Света',
      rank: 'Легенда V → Мифик',
      text: 'наконец-то мифик! спасибо большое 🙏 отдельное спасибо за советы по игре на миде, очень помогло',
      rating: 5,
      date: '2024-12-28'
    },
    {
      name: 'Егор',
      rank: 'Мифик Слава 62★ → Мифик Слава 85★',
      text: 'Уже 3й раз заказываю, всегда все четко! В этот раз особенно порадовал винрейт и скорость',
      rating: 5,
      date: '2024-12-27'
    },
    {
      name: 'Оля',
      rank: 'Эпик IV → Легенда V',
      text: 'Спасибо за помощь с рангом ❤️ Бустер был супер добрый, все объяснял и даже с войсом поиграли пару каток',
      rating: 5,
      date: '2024-12-26'
    },
    {
      name: 'Стас',
      rank: 'Мифик 15★ → Мифик Честь 30★',
      text: 'бустер реально монстр! тащил 1 против 5 иногда, противники в шоке были. за 2 дня все сделали',
      rating: 5,
      date: '2024-12-25'
    },
    {
      name: 'Лера',
      rank: 'Легенда III → Мифик 5★',
      text: 'Не думала что получится так быстро апнуться) За день до мифика дошли, еще и с запасом звезд',
      rating: 5,
      date: '2024-12-24'
    },
    {
      name: 'Денис',
      rank: 'Мифик Честь 41★ → Мифик Слава 52★',
      text: 'Хотел успеть до конца сезона в славу, и успели! Правда пришлось немного доплатить за срочность, но оно того стоило',
      rating: 4,
      date: '2024-12-23'
    },
    {
      name: 'Аня',
      name: 'Эпик I → Легенда IV',
      text: 'первый раз брала буст, очень переживала. но бустер попался хороший, все объяснил и быстро все сделал 💕',
      rating: 5,
      date: '2024-12-22'
    },
    {
      name: 'Гриша',
      rank: 'Мифик 5★ → Мифик 20★',
      text: 'Уже который раз обращаюсь, всегда все на высшем уровне! Особенно радует что можно выбрать героев',
      rating: 5,
      date: '2024-12-21'
    },
    {
      name: 'Марина',
      rank: 'Легенда V → Мифик 8★',
      text: 'спасибо за буст ✨ бустер был супер, все быстро и четко. отдельное спасибо за стрим, было интересно',
      rating: 5,
      date: '2024-12-20'
    },
    {
      name: 'Витя',
      rank: 'Эпик III → Легенда III',
      text: 'Достали тиммейты в эпике, решил не мучаться. Бустер за день все сделал, красава! Даже с войсом поиграли',
      rating: 5,
      date: '2024-12-19'
    },
    {
      name: 'Таня',
      rank: 'Мифик Честь 36★ → Мифик Честь 48★',
      text: 'второй раз заказываю, всё супер! бустер адекватный, всегда на связи. винрейт под 90% вышел',
      rating: 5,
      date: '2024-12-18'
    },
    {
      name: 'Слава',
      rank: 'Мифик 12★ → Мифик 25★',
      text: 'Хотел успеть до конца сезона побольше звезд набить. Бустер реально затащил, особенно на Лансе и Хае',
      rating: 5,
      date: '2024-12-17'
    },
    {
      name: 'Инна',
      rank: 'Эпик V → Легенда IV',
      text: 'боялась что не получится выйти из эпика до конца сезона, но ребята помогли 🙏 бустер был очень терпеливый',
      rating: 5,
      date: '2024-12-16'
    },
    {
      name: 'Леша',
      rank: 'Мифик Слава 55★ → Мифик Слава 78★',
      text: 'Дорого конечно на этих рангах, но оно того стоит. Бустер реально про, затащил даже против местных про команд',
      rating: 5,
      date: '2024-12-15'
    },
    {
      name: 'Рита',
      rank: 'Легенда II → Мифик',
      text: 'наконец-то мифик перед новым сезоном 😊 спасибо большое, все быстро и качественно сделали',
      rating: 5,
      date: '2024-12-14'
    },
    {
      name: 'Матвей',
      rank: 'Мифик 7★ → Мифик Честь 31★',
      text: 'Решил под конец сезона в честь выбраться. Бустер красава, особенно на ассасинах тащил. Рекомендую!',
      rating: 5,
      date: '2024-12-13'
    },
    {
      name: 'Жанна',
      rank: 'Эпик II → Легенда V',
      text: 'спасибо за буст! из эпик хелла наконец-то выбралась. бустер адекватный, все четко объяснял',
      rating: 5,
      date: '2024-12-12'
    },
    // После декабрьских отзывов добавляем:
    {
      name: 'Вадим',
      rank: 'Мифик 10★ → Мифик 25★',
      text: 'Решил подготовиться к концу сезона заранее. Бустер затащил 15 звезд за день, вообще без проблем!',
      rating: 5,
      date: '2024-11-30'
    },
    {
      name: 'Кристина',
      rank: 'Эпик IV → Легенда V',
      text: 'первый раз заказывала буст, очень волновалась 😅 но бустер попался хороший, все объяснял и даже тактику показывал',
      rating: 5,
      date: '2024-11-29'
    },
    {
      name: 'Руслан',
      rank: 'Мифик Честь 35★ → Мифик Честь 47★',
      text: 'Уже не первый раз обращаюсь, всегда все на уровне! В этот раз особенно порадовал пик героев и винрейт',
      rating: 5,
      date: '2024-11-28'
    },
    {
      name: 'Даша',
      rank: 'Легенда II → Мифик',
      text: 'спасибо за буст до мифика ✨ бустер был супер, все быстро и четко. стрим вообще топчик!',
      rating: 5,
      date: '2024-11-27'
    },
    {
      name: 'Богдан',
      rank: 'Мифик Слава 60★ → Мифик Слава 82★',
      text: 'Дорого, но оно того стоит! Бустер реально монстр, тащил даже против про команд. Респект за скилл',
      rating: 5,
      date: '2024-11-26'
    },
    {
      name: 'Алёна',
      rank: 'Эпик III → Легенда IV',
      text: 'наконец-то выбралась из эпика 🎉 спасибо большое, бустер был на связи постоянно, все супер!',
      rating: 5,
      date: '2024-11-25'
    },
    {
      name: 'Илья',
      rank: 'Мифик 18★ → Мифик Честь 32★',
      text: 'бустер красава! тащил на фанни и лансе как про. противники в шоке были, особенно когда 1 против 3 затащил',
      rating: 5,
      date: '2024-11-24'
    },
    {
      name: 'Соня',
      rank: 'Легенда IV → Мифик 5★',
      text: 'Долго не могла решиться на буст, но не пожалела! За день до мифика дошли, еще и с запасом звезд',
      rating: 5,
      date: '2024-11-23'
    },
    {
      name: 'Роман',
      rank: 'Мифик Честь 38★ → Мифик Честь 50★',
      text: 'Хотел до славы дойти, бустер помог. Немного дороговато вышло, но зато быстро и без единого проигрыша',
      rating: 4,
      date: '2024-11-22'
    },
    {
      name: 'Вероника',
      rank: 'Эпик I → Легенда III',
      text: 'спасибо за помощь с рангом 💖 бустер был очень терпеливый, все объяснял. даже с войсом поиграли немного',
      rating: 5,
      date: '2024-11-21'
    },
    {
      name: 'Степан',
      rank: 'Мифик 5★ → Мифик 22★',
      text: 'Не первый раз беру буст тут, всегда все четко! В этот раз вообще удивили - 17 звезд за день без единого проигрыша',
      rating: 5,
      date: '2024-11-20'
    },
    {
      name: 'Ира',
      rank: 'Легенда V → Мифик 8★',
      text: 'бустер топ! особенно порадовало что можно было смотреть стрим. много полезного узнала по игре',
      rating: 5,
      date: '2024-11-19'
    },
    {
      name: 'Артём',
      rank: 'Эпик II → Легенда IV',
      text: 'Достали тиммейты в эпике, решил взять буст. Бустер за день все сделал, красава! Еще и советы дал по игре',
      rating: 5,
      date: '2024-11-18'
    },
    {
      name: 'Маша',
      rank: 'Мифик Честь 40★ → Мифик Слава 51★',
      text: 'второй раз заказываю, всё супер! бустер адекватный, всегда на связи. особенно порадовал винрейт',
      rating: 5,
      date: '2024-11-17'
    },
    {
      name: 'Павел',
      rank: 'Мифик 12★ → Мифик 28★',
      text: 'Хотел побыстрее до чести дойти. Бустер реально затащил, особенно на танках впечатлил. Рекомендую!',
      rating: 5,
      date: '2024-11-16'
    },
    {
      name: 'Катя',
      rank: 'Эпик V → Легенда V',
      text: 'боялась что не выйдет из эпика, но ребята помогли 🙏 бустер был супер, все объяснял и поддерживал',
      rating: 5,
      date: '2024-11-15'
    },
    {
      name: 'Георгий',
      rank: 'Мифик Слава 58★ → Мифик Слава 75★',
      text: 'Дорого конечно на этих рангах, но результат порадовал. Бустер реально про, затащил даже против местных топов',
      rating: 5,
      date: '2024-11-14'
    },
    {
      name: 'Лена',
      rank: 'Легенда III → Мифик',
      text: 'спасибо за буст! бустер был очень терпеливый, все четко объяснял. и главное - быстро все сделали 💫',
      rating: 5,
      date: '2024-11-13'
    },
    {
      name: 'Дима',
      rank: 'Мифик 7★ → Мифик Честь 35★',
      text: 'Решил не мучаться с рандомами. Бустер красава, особенно на ассасинах тащил. Всем советую!',
      rating: 5,
      date: '2024-11-12'
    },
    {
      name: 'Алиса',
      rank: 'Эпик III → Легенда V',
      text: 'наконец-то распрощалась с эпиком 😌 бустер был супер, все быстро и качественно. буду обращаться еще!'
    }
  ];

  const reviewsContainer = document.getElementById('reviews-container');
  const filterButtons = document.querySelectorAll('.filter-btn');
  let currentFilter = 'all';
  const REVIEWS_PER_PAGE = 6; // Количество отзывов на странице
  let currentPage = 1;

  function createReviewElement(review) {
    const div = document.createElement('div');
    div.className = 'review-card animate-on-scroll';
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    div.innerHTML = `
      <div class="review-header">
        <div class="reviewer-info">
          <div class="reviewer-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div>
            <h4>${review.name}</h4>
            <div class="review-date">${date}</div>
          </div>
        </div>
        <div class="review-rating">${stars}</div>
      </div>
      <div class="review-content">
        <p>${review.text}</p>
      </div>
      <div class="review-boost-details">
        <span class="rank-badge">${review.rank}</span>
      </div>
    `;

    return div;
  }

  function filterReviews(filter, page = 1) {
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    const filteredReviews = reviews.filter(review => {
      switch(filter) {
        case 'recent':
          return new Date(review.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Последние 30 дней
        case 'top':
          return review.rating >= 5;
        default:
          return true;
      }
    });

    if (page === 1) {
    reviewsContainer.innerHTML = '';
    }

    const reviewsToShow = filter === 'all' ? 
      shuffleArray([...filteredReviews]) : 
      [...filteredReviews].sort((a, b) => new Date(b.date) - new Date(a.date));

    const startIndex = (page - 1) * REVIEWS_PER_PAGE;
    const endIndex = startIndex + REVIEWS_PER_PAGE;
    const pageReviews = reviewsToShow.slice(startIndex, endIndex);

    pageReviews.forEach(review => {
      const reviewElement = createReviewElement(review);
      reviewsContainer.appendChild(reviewElement);
    });

    // Управление кнопкой "Показать ещё"
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
      if (endIndex >= reviewsToShow.length) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => {
          currentPage++;
          filterReviews(currentFilter, currentPage);
        };
      }
    }

    initializeAnimations();
  }

  function initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    document.querySelectorAll('.animate-on-scroll').forEach(element => {
      observer.observe(element);
    });
  }

  // Event Listeners для фильтров
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      currentPage = 1; // Сброс страницы при смене фильтра
      filterReviews(currentFilter, currentPage);
    });
  });

  // Initialize reviews
  filterReviews('all', 1);

  // Handle floating images animation
  const floatingImage = document.querySelector('.floating-image');
  if (floatingImage) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      floatingImage.style.transform = `translateY(${scrolled * 0.1}px)`;
    });
  }
});