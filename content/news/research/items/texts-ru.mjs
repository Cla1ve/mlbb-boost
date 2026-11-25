// Russian names follow the game client (owner's screenshots, 25.11.2026). Effect texts are translated from the official
// in-game Academy text (English), numbers as in the game. p: [kind, ru name, en name, ru text, en text]; kind: passive | active | attr.
export const TEXTS = {
  'Malefic Gun': { ru: 'Губительный пулемет', short: ['Дальность атаки', 'Attack range'], p: [
    ['passive', 'Пробивание брони', 'Armor Buster', 'Физическое проникновение +30%.', 'Increases Physical Penetration by 30%.'],
    ['passive', 'Злая энергия', 'Malefic Energy', 'Дальность базовой атаки +12%. При попадании по цели скорость передвижения растёт на 10% на 0,5 с.', 'Increases Basic Attack range by 12%. Hitting a target grants 10% Movement Speed for 0.5s.']],
    story: ['Технологии Эрудитио дали ему больше дальности и силы — под стать весёлой девушке с яркой улыбкой.', 'With technology from Eruditio, it now has greater range and more power, as befits the ebullient girl with the bright smile.'] },
  'Great Dragon Spear': { ru: 'Копье Великого дракона', short: ['Перезарядка и крит', 'Cooldown and crit'], p: [
    ['passive', 'Высший воин', 'Supreme Warrior', 'После применения ультимейта скорость передвижения растёт на 30% на 7,5 с. Перезарядка эффекта 15 с.', 'After casting an Ultimate, Movement Speed increases by 30% for 7.5s. 15s cooldown.']],
    story: ['Сокровище Драконьего алтаря — символ силы и ответственности, который хранит наследие Речных земель Кадии.', 'The treasure of the Dragon Altar symbolizes power and responsibility, passing on the never-ending legacy of the Cadia Riverlands.'] },
  'Sea Halberd': { ru: 'Трезубец', short: ['Снижение исцеления', 'Anti-heal'], p: [
    ['passive', 'Гибель жизни', 'Lifebane', 'Урон по цели снижает получаемые ею щиты и регенерацию ОЗ до 60% на 3 с.', 'Dealing damage to a target reduces its Shield and HP Regen effects to 60% of normal for 3s.'],
    ['passive', 'Кара', 'Punish', 'Урон по вражеским героям, у которых больше дополнительных ОЗ, выше на 8%.', 'Damage against enemy heroes with more extra HP is increased by 8%.']],
    story: ['«Душа океана чиста, и запятнать её непросто». — Кадита', '“The soul of the oceans is pure, and not easily sullied.” — Kadita'] },
  'Rose Gold Meteor': { ru: 'Золотой метеор', short: ['Щит при низких ОЗ', 'Shield at low HP'], p: [
    ['passive', 'Драконья чешуя', 'Dragon Scale', 'Каждые 4 единицы дополнительной физической атаки дают 1 гибридную защиту, до 50. Если основная роль героя не боец, эффект вдвое слабее.', 'Every 4 extra Physical Attack grants 1 Hybrid Defense, up to 50 (halved if the hero’s main role is not Fighter).'],
    ['passive', 'Спасение', 'Lifeline', 'Если урон опускает ОЗ ниже 30%, герой получает щит (120 × уровень героя) и 50% скорости передвижения, которая быстро спадает за 3 с. Перезарядка 60 с.', 'When damage drops HP below 30%, gain a shield of 120 × hero level and 50% Movement Speed that decays over 3s. 60s cooldown.']],
    story: ['Чешуя, что спасла Белого дракона от смертельного удара, после Битвы драконов стала артефактом и теперь покоится на Драконьем алтаре.', 'The scale that protected the White Dragon from a fatal blow was made into an artifact after the Battle of the Dragons. It now rests silently in the Dragon Altar.'] },
  'Hunter Strike': { ru: 'Удар охотника', short: ['Кратковременное ускорение', 'Burst of speed'], p: [
    ['passive', 'Возмездие', 'Retribution', 'Пять ударов подряд по одному вражескому герою или монстру дают 50% скорости передвижения, которая спадает за 3 с. Перезарядка 8 с.', 'Hitting the same enemy hero or creep 5 times in a row grants 50% Movement Speed that decays over 3s. 8s cooldown.']],
    story: ['Охотники Пустошей Мегалита верят, что охота должна длиться одно мгновение.', 'The hunters of Megalith Wasteland believe that the hunt should take place in the blink of an eye.'] },
  'Blade of Despair': { ru: 'Клинок отчаяния', short: ['Макс. физ. атака', 'Highest Physical Attack'], p: [
    ['passive', 'Отчаяние', 'Despair', 'Урон по врагам (кроме миньонов) с ОЗ ниже 50% повышает физическую атаку на 25% на 2 с. Бонус действует уже на этот удар.', 'Damaging non-minion enemies below 50% HP increases Physical Attack by 25% for 2s (applies before the damage is dealt).']],
    story: ['У самых грозных воинов есть свои демоны, и самые острые клинки в их руках говорят о глубоком отчаянии.', 'The most fearsome fighters have their own demons to face, and so the sharpest blades in their hands speak their deepset despair.'] },
  'Blade of the Heptaseas': { ru: 'Клинок семи морей', short: ['Лучшее для убийц', 'Best for assassins'], p: [
    ['passive', 'Засада', 'Ambush', 'Если 5 с не получать и не наносить урон (кроме миньонов и монстров), следующая базовая атака наносит 160 (+40% общей физ. атаки) физического урона и замедляет цель на 40% на 1,5 с.', 'If no damage is taken or dealt for 5s (minions and creeps excluded), the next Basic Attack deals 160 (+40% Total Physical Attack) extra Physical Damage and slows the target by 40% for 1.5s.']],
    story: ['Клинок, что режет кость как масло, когда-то ушёл на дно вместе с Ледяным королём. Теперь он ждёт часа, чтобы пробудиться.', 'The blade that cuts bones like butter was once lost with the Frozen King in the deep sea. Now it waits for the right moment to awaken its power.'] },
  'Windtalker': { ru: 'Говорящий с ветром', short: ['Урон по площади', 'Splash damage'], p: [
    ['passive', 'Тайфун', 'Typhoon', 'Раз в 5–2 с (каждая базовая атака сокращает интервал на 0,2 с) следующая базовая атака бьёт до 3 врагов и наносит 150–362 магического урона. Может быть критической, по миньонам урон 200%.', 'Every 5–2s (−0.2s per Basic Attack), the next Basic Attack hits up to 3 enemies for 150–362 Magic Damage. It can crit and deals 200% damage to minions.']],
    story: ['Когда-то он решил судьбу городов-близнецов — Форта Ветров и Огненной Глотки, а позже стал свидетелем многолетнего обещания двух друзей.', 'It once determined the fate of the Twin Cities, Wind Fort and Fire Throat, and later its sharp edge witnessed a decades-long promise between two best friends.'] },
  'Endless Battle': { ru: 'Бесконечная битва', short: ['Усиление базовой атаки', 'Empowered Basic Attack'], p: [
    ['passive', 'Божественное правосудие', 'Divine Justice', 'После применения навыка следующая базовая атака в течение 3 с наносит 60% общей физ. атаки как чистый урон и восстанавливает 80 (+40% общей физ. атаки) ОЗ. Перезарядка 1,5 с.', 'After casting a skill, the next Basic Attack within 3s deals 60% Total Physical Attack as extra True Damage and restores 80 (+40% Total Physical Attack) HP. 1.5s cooldown.']],
    story: ['Война в Землях Рассвета не стихала никогда: Бесконечная война, объединение Империи Мониян, конфликты на Севере. Этот артефакт веками видел каждую борьбу за выживание.', 'War has never ceased in the Land of Dawn: the Endless War, the unification of the Moniyan Empire, the Conflicts in the North. The artifact has witnessed every struggle for survival for centuries.'] },
  "Berserker's Fury": { ru: 'Ярость берсерка', short: ['Шанс крита и урон', 'Crit chance and damage'], p: [
    ['passive', 'Рок', 'Doom', 'Критический удар даёт +5% физической атаки на 2 с.', 'Critical strikes grant 5% extra Physical Attack for 2s.']],
    story: ['Забытая реликвия, потерянная в Бесконечной войне. Если прошлая боль ведёт к ещё большему отчаянию, до безумия остаётся один шаг.', 'A forgotten relic, lost in the Endless War. If the pain of the past ultimately leads to greater despair, then madness is only a step away.'] },
  "Haas's Claws": { ru: 'Когти Хааса', short: ['Вампиризм', 'Lifesteal'], p: [
    ['passive', 'Бешенство', 'Frenzy', 'Критический удар даёт +20% скорости атаки на 2 с.', 'Critical strikes grant 20% Attack Speed for 2s.']],
    story: ['Проигравших войну изгнали в Бездну с ненасытной жаждой крови. Хаас первым поддался ей, склонившись перед Королевой.', 'Those who lost the war were banished to the Abyss with an insatiable hunger for blood. Haas was the first to succumb to his desire when he bowed to the Queen.'] },
  'Malefic Roar': { ru: 'Злобный рык', short: ['Высокое физ. проникновение', 'High Physical Penetration'], p: [
    ['passive', 'Пробивание брони', 'Armor Buster', 'Физическое проникновение +30%.', 'Increases Physical Penetration by 30%.'],
    ['passive', 'Разрушитель', 'Breaker', 'При атаке за каждую единицу физической защиты цели физическое проникновение растёт на 0,1%, до 30%.', 'When attacking, gain 0.1% Physical Penetration for each point of the target’s Physical Defense, up to 30%.']],
    story: ['Его прославил воин по прозвищу Западное Правосудие. Выстрел этого оружия пронзает зло и наводит страх на врагов.', 'Famous for a warrior known as West Justice, it symbolizes justice and pierces all evil, striking fear into enemies’ hearts with the sound of its shot.'] },
  'Winter Crown': { ru: 'Зимняя корона', short: ['Временная неуязвимость', 'Brief invulnerability'], p: [
    ['active', 'Заморозка', 'Frozen', 'При использовании герой замерзает на 2 с: на него нельзя навести цель, он не получает урона и эффектов, но не двигается и не применяет навыки. Перезарядка 100 с.', 'Upon use, become frozen for 2s: untargetable and immune to all damage and effects, but unable to move or cast. 100s cooldown.']],
    story: ['Сердце Ледника создал Повелитель Света. Пробудившись вместе с Девой Ледника, оно стало символом вечности, которая и защищает её, и держит в плену.', 'The core of the Glacier was created by the Lord of Light. Awakened along with the Maiden of the Glacier, it symbolizes the power of eternity that not only protects but also confines her.'] },
  'Fleeting Time': { ru: 'Мимолетное время', short: ['Перезарядка ультимейта', 'Ultimate cooldown'], p: [
    ['passive', 'Поток', 'Timestream', 'Убийство героя или помощь сокращают текущую перезарядку ультимейта на 30%.', 'Hero kills or assists reduce the Ultimate’s current cooldown by 30%.']],
    story: ['Драгоценный артефакт из покоев посланницы Монастыря Света. Она часто смотрит на него с тоской, будто вспоминает брата в Бездне и обрывки памяти.', 'A precious artifact kept in the room of an envoy of the Monastery of Light. She often gazes at it with longing, as if remembering her brother in the Abyss and a broken memory.'] },
  'Sky Piercer': { ru: 'Пронзающий небеса', short: ['Лучшее для добивания', 'Best for finishing'], p: [
    ['passive', 'Смертоносность', 'Lethality', 'Урон по вражескому герою мгновенно добивает его, если у него меньше 4% ОЗ. Каждое убийство даёт 10 зарядов, смерть забирает 30% накопленных. Каждый заряд поднимает порог добивания на 0,1%, до 80 зарядов.', 'Damaging an enemy hero below 4% HP executes them. Each kill grants 10 stacks of Lethality and each death removes 30% of them. Each stack raises the execute threshold by 0.1%, up to 80 stacks.']],
    story: ['Свидетель Бесконечной войны с несравненной разрушительной силой. Те, кто его видел, зовут его Пронзающим небеса.', 'Once a witness to the Endless War, the blade has an unparalleled power to wreak havoc, and those who have seen it call it Sky Piercer.'] },
  'War Axe': { ru: 'Топор войны', short: ['Усиление продолжительного урона', 'Sustained damage'], p: [
    ['passive', 'Боевой дух', 'Fighting Spirit', 'Атаки дают +12 физической атаки в секунду на 4 с, до 6 зарядов. При полном запасе герой наносит дополнительно 10% от нанесённого урона как чистый урон. Стрелки, маги и поддержка получают половину эффекта.', 'Attacks grant 12 Physical Attack per second for 4s, up to 6 stacks. At full stacks, deal extra True Damage equal to 10% of the damage dealt. Marksmen, Mages and Supports get 50% of this effect.']],
    story: ['Говорят, этим топором предки леонинов сдерживали силы Бездны вместе с эльфами. Когда сил не осталось, оружие уснуло, но недавно его пробудили ярость и боевой дух одного леонина.', 'This battleaxe is said to have been wielded by the Leonins’ ancestors as they resisted the Abyss alongside the Elves. When they could fight no longer, the weapon fell into slumber, until the rage of a certain Leonin warrior awoke it.'] },
  'Wind of Nature': { ru: 'Ветер природы', short: ['Иммунитет к физ. урону', 'Physical damage immunity'], p: [
    ['active', 'Песнь ветра', 'Wind Chant', 'При использовании герой на 2 с становится невосприимчив к физическому урону. У героев, которые не стрелки, длительность вдвое меньше. Перезарядка 90 с.', 'Upon use, become immune to all Physical Damage for 2s (halved for non-Marksmen). 90s cooldown.']],
    story: ['Самоцвет из глубин Лесов Азрии, полный силы природы, эльфы превратили в лук, чтобы защищать своё святилище — Лунный лес.', 'A gem from the depths of the Azrya Woodlands, rich with natural energy, was forged into a longbow by the Elves to protect their sanctuary, the Moonlit Forest.'] },
  'Golden Staff': { ru: 'Золотой посох', short: ['Улучш. эффекты атаки', 'Stronger attack effects'], p: [
    ['passive', 'Быстрота', 'Swift', 'Каждый 1% шанса крит. удара превращается в 1% скорости атаки.', 'Every 1% extra Crit Chance is converted into 1% extra Attack Speed.'],
    ['passive', 'Бесконечный удар', 'Endless Strike', 'После каждых 2 некритических базовых атак скорость следующей атаки растёт на 80% (предел скорости атаки поднимается до 500%), а её эффекты срабатывают ещё 2 раза.', 'After every 2 non-crit Basic Attacks, the next one gains 80% Attack Speed (cap raised to 500%) and triggers Attack Effects 2 more times.']],
    story: ['«Как стать непобедимым?» — спросил юный воин-панда своего учителя, бессмертную обезьяну. Тот ничего не ответил, лишь нетерпеливо взмахнул посохом — и поднялась буря.', '“How can I be invincible?” a young panda warrior asked his mentor, the immortal monkey. The monkey said nothing, only waved his staff, raising a storm in an instant.'] },
  'Corrosion Scythe': { ru: 'Коса коррозии', short: ['Замедление от урона', 'Slow on hit'], p: [
    ['passive', 'Коррозия', 'Corrosion', 'Базовые атаки наносят +80 физического урона и замедляют цель на 8% на 1,5 с (у дальних атак вдвое меньше). Суммируется до 5 раз.', 'Basic Attacks deal 80 extra Physical Damage and slow the target by 8% (halved for ranged attacks) for 1.5s, stacking up to 5 times.'],
    ['passive', 'Импульс', 'Impulse', 'Базовые атаки дают +6% скорости атаки на 3 с, до 5 зарядов.', 'Basic Attacks grant 6% Attack Speed for 3s, up to 5 stacks.']],
    story: ['Смерть поглотит тебя…', 'Death shall devour you…'] },
  'Demon Hunter Sword': { ru: 'Меч охотника на демонов', short: ['Убийца танков', 'Tank killer'], p: [
    ['passive', 'Поглощение', 'Engulf', 'Базовые атаки наносят дополнительный физический урон в размере 8% текущих ОЗ цели (по миньонам не больше 60).', 'Basic Attacks deal extra Physical Damage equal to 8% of the target’s current HP (up to 60 against minions).'],
    ['passive', 'Пожирание', 'Devour', 'Каждая базовая атака восстанавливает 10 (+4 × уровень героя) ОЗ, по миньонам вдвое меньше.', 'Each Basic Attack restores 10 (+4 × hero level) HP, halved against minions.']],
    story: ['Сердцевину клинка вырезали из кости голема Ледяных островов, и в нём будто живёт яростная история этих великанов.', 'Its core carved from the bones of an Iceland Golem, the blade seems to carry the fierce history of those giants from before they were slain.'] },
  'Magic Blade': { ru: 'Магический клинок', p: [
    ['passive', 'Спасение', 'Lifeline', 'Если урон опускает ОЗ ниже 30%, герой получает щит (60 × уровень героя) и 50% скорости передвижения, которая быстро спадает за 3 с. Перезарядка 60 с.', 'When damage drops HP below 30%, gain a shield of 60 × hero level and 50% Movement Speed that decays over 3s. 60s cooldown.']] },
  'Fury Hammer': { ru: 'Молот гнева', p: [] },
  'Rogue Meteor': { ru: 'Кистень грабителя', p: [] },
  'Ogre Tomahawk': { ru: 'Топор великана', p: [] },
  'Legion Sword': { ru: 'Меч легионера', p: [] },
  'Swift Crossbow': { ru: 'Быстрый арбалет', p: [
    ['passive', 'Арбалет', 'Crossbow', 'Каждая базовая атака наносит +40 адаптивного урона.', 'Each Basic Attack deals 40 extra Adaptive Damage.'],
    ['passive', 'Импульс', 'Impulse', 'Базовые атаки дают +3% скорости атаки на 3 с, до 5 зарядов.', 'Basic Attacks grant 3% Attack Speed for 3s, up to 5 stacks.']] },
  'Regular Spear': { ru: 'Обычное копье', p: [] },
  'Expert Gloves': { ru: 'Перчатки эксперта', p: [] },
  'Iron Hunting Bow': { ru: 'Железный лук охотника', p: [] },
  'Vampire Mallet': { ru: 'Булава вампира', p: [] },
  'Javelin': { ru: 'Копье', p: [] },
  'Knife': { ru: 'Нож', p: [] },
  'Dagger': { ru: 'Кинжал', p: [] },
  'Power Potion': { ru: 'Зелье силы', p: [
    ['passive', 'Усиление', 'Increase Power', 'Сразу после покупки даёт +30 физической атаки и 15% вампиризма на 120 с.', 'Upon purchase, grants 30 Physical Attack and 15% Lifesteal for 120s.']] },

  'Wishing Lantern': { ru: 'Фонарь желаний', short: ['Против высоких ОЗ', 'Against high HP'], p: [
    ['passive', 'Бабочка-богиня', 'Butterfly Goddess', 'За каждые 900 единиц магического урона, нанесённого вражескому герою (до снижения урона), появляется Бабочка-богиня и атакует его, нанося магический урон в размере 8% его текущих ОЗ.', 'For every 900 Magic Damage dealt to an enemy hero (before Damage Reduction), a Butterfly Goddess attacks them for Magic Damage equal to 8% of their current HP.']],
    story: ['Фонарь хранителя Речных земель Кадии, в котором живут бесконечные желания. Теперь его зажигает таинственная девушка: она призывает алых бабочек и ведёт заблудшие души.', 'A lantern left by the guardian of the Cadia Riverlands that holds infinite wishes. A mysterious girl now lights it, summoning Crimson Butterflies and guiding lost spirits.'] },
  'Flask of the Oasis': { ru: 'Фляга Оазиса', short: ['Защита союзников', 'Protects allies'], p: [
    ['passive', 'Благословение', 'Blessing', 'Когда герой лечит союзника или даёт ему щит, а ОЗ союзника ниже 35% или опускаются ниже 35% в течение 3 с, тот получает щит (100 × уровень героя) на 3 с, а перезарядка навыков героя сокращается на 2 с. Срабатывает на одной цели раз в 60 с и не срабатывает от лечения только себя.', 'When a heal or shield skill hits a target whose HP is below 35% (or falls below it within 3s), they get a shield of 100 × hero level for 3s and the caster’s skill cooldowns drop by 2s. Once every 60s per target; not on self-only heals and shields.']],
    story: ['Маги переняли магию Оазиса, чтобы силой мученицы защитить больше людей.', 'Mages mimicked the magic of the Oasis, helping to protect more people with the power of the martyr.'] },
  'Genius Wand': { ru: 'Палочка гения', short: ['Снижение маг. защиты', 'Magic Defense shred'], p: [
    ['passive', 'Магия', 'Magic', 'Магический урон по вражеским героям снижает их магическую защиту на 2,5 (+0,5 × уровень героя) на 2 с. Суммируется до 3 раз.', 'Magic Damage to enemy heroes reduces their Magic Defense by 2.5 (+0.5 × hero level) for 2s, stacking up to 3 times.']],
    story: ['Плод случайного опыта Урсулы. Позже Магическая академия вручила её одному многообещающему юному магу.', 'A product of Ursula’s random experiment, later granted by the Magic Academy to a promising young magician.'] },
  'Lightning Truncheon': { ru: 'Жезл молний', short: ['Массовый урон навыками', 'Burst on skills'], p: [
    ['passive', 'Резонанс', 'Resonate', 'Раз в 6 с следующий навык отзывается эхом и наносит всем врагам в области 255 (+85% общей маг. силы) магического урона.', 'Every 6s, the next skill echoes, dealing 255 (+85% Total Magic Power) extra Magic Damage to all enemies in range.']],
    story: ['Жезл создан по мотивам серебровласой эльфийки, запечатавшей молнии в Магической академии, и вокруг него бушует сила грома.', 'Inspired by the silver-haired Elf girl who sealed the thunderbolts at the Magic Academy, the staff surges with the power of thunder.'] },
  'Blood Wings': { ru: 'Кровавые крылья', short: ['Щит с ускорением', 'Shield and speed'], p: [
    ['passive', 'Защита', 'Guard', 'Даёт щит 800 (+100% общей маг. силы), который восстанавливается через 20 с после получения урона. Пока щит есть, скорость передвижения +30, а после его разрушения +150 на 1 с.', 'Grants an 800 (+100% Total Magic Power) shield that regenerates 20s after taking damage. It grants 30 Movement Speed while it lasts and 150 for 1s after it breaks.']],
    story: ['Багрянец окрасил белоснежное перо, будто в нём похоронено жестокое прошлое Леса Аскати.', 'The crimson red dyed the spotless white feather, as if the brutal past of the Askati Forest were buried within it.'] },
  'Starlium Scythe': { ru: 'Старлиумовая коса', short: ['Усиление базовой атаки', 'Empowered Basic Attack'], p: [
    ['passive', 'Кризис', 'Crisis', 'После применения навыка следующая базовая атака в течение 3 с наносит 90 (+60% общей маг. силы) чистого урона и замедляет цель на 15% на 1,5 с. Перезарядка 1,5 с.', 'After casting a skill, the next Basic Attack within 3s deals 90 (+60% Total Magic Power) extra True Damage and slows the target by 15% for 1.5s. 1.5s cooldown.']],
    story: ['Учёные Эрудитио перекроили устройство на старлиуме по законам магии и соединили обе силы.', 'Eruditio’s scientists rebuilt the Starlium device by the rules of magic, merging the powers of magic and Starlium.'] },
  'Glowing Wand': { ru: 'Пылающий жезл', short: ['Снижение исцеления', 'Anti-heal'], p: [
    ['passive', 'Опаление', 'Scorch', 'Магический урон поджигает цель на 3 с: каждую секунду она получает магический урон в размере 1% своих макс. ОЗ.', 'Magic Damage burns the target for 3s, dealing extra Magic Damage equal to 1% of its Max HP per second.'],
    ['passive', 'Гибель жизни', 'Lifebane', 'Урон по цели снижает получаемые ею щиты и регенерацию ОЗ до 60% на 3 с.', 'Dealing damage to a target reduces its Shield and HP Regen effects to 60% of normal for 3s.']],
    story: ['Посох, потерянный после битвы у Огненной Глотки, вернулся вместе с Сыном Пламени. В нём течёт безумие, горящее огнём.', 'A staff long lost after the Battle of the Fire Throat returns with the Son of Flames. The magic flowing through it is madness burning in flames.'] },
  'Ice Queen Wand': { ru: 'Жезл снежной королевы', short: ['Замедление навыками', 'Slow on skill hit'], p: [
    ['passive', 'Ледяные оковы', 'Ice Bound', 'Урон навыком по вражескому герою замедляет его на 10% на 2 с, до 3 раз. Перезарядка эффекта 0,4 с.', 'Skill damage to an enemy hero slows them by 10% for 2s, stacking up to 3 times. 0.4s cooldown.']],
    story: ['Что такое вечность? Божества ответили: «Взгляни на падающий снег и шепчущий ледник». Всё это — милость Девы Ледника.', 'What is eternity? The deities replied, “Look at the falling snow and the whispering glacier.” All of it is the grace of the Maiden of the Glacier.'] },
  'Concentrated Energy': { ru: 'Концентрированная энергия', short: ['Усиление продолжительного урона', 'Sustained damage'], p: [
    ['passive', 'Подзарядка', 'Recharge', 'Магический урон даёт +5 магической силы, до 6 зарядов (не чаще раза в 0,4 с). При полном запасе магический урон растёт на 12% на 5 с.', 'Magic Damage grants 5 Magic Power, up to 6 stacks (once every 0.4s). At full stacks, Magic Damage increases by 12% for 5s.']],
    story: ['Создана учёными по мотивам взрыва Бесконечных Врат — по законам сгущения и усиления энергии.', 'Inspired by the explosion of the Infinite Gateway, scientists built it on the laws of condensing and amplifying energy.'] },
  'Holy Crystal': { ru: 'Священный кристалл', short: ['Макс. магическая сила', 'Highest Magic Power'], p: [
    ['passive', 'Тайна', 'Mystery', 'Магическая сила растёт на 21–35% в зависимости от уровня героя.', 'Gain 21%–35% extra Magic Power (scales with level).']],
    story: ['Пробный камень Магической академии: Священный кристалл проверяет талант каждого ученика. Первый учёный этот экзамен, конечно, провалил.', 'A touchstone of the Magic Academy, the Holy Crystal tests each student’s talent for magic, though the very first scholar failed the test.'] },
  'Divine Glaive': { ru: 'Божественный меч', short: ['Маг. проникновение', 'Magic Penetration'], p: [
    ['passive', 'Разрушитель чар', 'Spellbreaker', 'При атаке за каждую единицу магической защиты цели магическое проникновение растёт на 0,1%, до 20%.', 'When attacking, gain 0.1% Magic Penetration for each point of the target’s Magic Defense, up to 20%.']],
    story: ['В давней битве эльфов и Империи Мониян предки дома Алвинов этим клинком прорвали оборону эльфов и победили.', 'In a past battle between the Elves and the Moniyan Empire, the ancestors of House Alvin used this blade to break the Elves’ defenses.'] },
  'Clock of Destiny': { ru: 'Часы судьбы', short: ['Для магических танков', 'For magic tanks'], p: [
    ['passive', 'Судьба', 'Destiny', 'Магический урон по вражеским героям даёт 4,5 (+0,5 × уровень героя) гибридной защиты на 5 с, до 6 зарядов (не чаще раза в 0,4 с).', 'Magic Damage to enemy heroes grants 4.5 (+0.5 × hero level) Hybrid Defense for 5s, up to 6 stacks (once every 0.4s).'],
    ['passive', 'Дар', 'Gift', 'Когда ОЗ падают ниже 50%, за 3 с восстанавливается 15% ОЗ; когда мана падает ниже 50%, за 3 с восстанавливается 15% маны. Перезарядка 60 с.', 'When HP drops below 50%, recover 15% HP over 3s; when Mana drops below 50%, restore 15% Mana over 3s. 60s cooldown.']],
    story: ['Новинка Эрудитио: старлиум, магия и время в одном устройстве, которое усиливает силу и рост героя.', 'Eruditio’s latest product combines Starlium with magic and time, enhancing both power and growth.'] },
  'Feather of Heaven': { ru: 'Райское перо', short: ['Маг. базовая атака', 'Magic Basic Attacks'], p: [
    ['passive', 'Скорбь', 'Affliction', 'Каждая базовая атака наносит +50 (+30% общей маг. силы) магического урона.', 'Each Basic Attack deals 50 (+30% Total Magic Power) extra Magic Damage.'],
    ['passive', 'Импульс', 'Impulse', 'Базовые атаки дают +6% скорости атаки на 3 с, до 5 зарядов.', 'Basic Attacks grant 6% Attack Speed for 3s, up to 5 stacks.']],
    story: ['Перо мягко упало на землю, когда служители Монастыря Света приветствовали сотворённого ангела именем Повелителя Света.', 'A feather fell softly to the ground as the Sacrists of the Monastery of Light greeted the created angel in the name of the Lord of Light.'] },
  'Enchanted Talisman': { ru: 'Зачарованный талисман', short: ['Мана и перезарядка', 'Mana and cooldown'], p: [
    ['passive', 'Источник маны', 'Mana Spring', 'Каждые 10 с восстанавливает 15% макс. маны.', 'Restores 15% Max Mana every 10s.'],
    ['passive', 'Магическое мастерство', 'Magic Mastery', 'Предел сокращения перезарядки +5%.', 'Max Cooldown Reduction +5%.']],
    story: ['Создан по мотивам простого курса Магической академии, где ману учат пускать по кругу. После доработки одним чёрным магом в нём бьёт бесконечный источник силы. Какой ценой — другой вопрос.', 'Inspired by a basic Magic Academy course on cycling Mana, it gained an endless source of power after a certain black magician reworked it. As for the price…'] },
  'Elegant Gem': { ru: 'Элегантный самоцвет', p: [
    ['passive', 'Дар', 'Gift', 'Когда ОЗ падают ниже 50%, за 3 с восстанавливается 15% ОЗ; когда мана падает ниже 50%, за 3 с восстанавливается 15% маны. Перезарядка 60 с.', 'When HP drops below 50%, recover 15% HP over 3s; when Mana drops below 50%, restore 15% Mana over 3s. 60s cooldown.']] },
  'Exotic Veil': { ru: 'Иноземная маска', p: [] },
  'Azure Blade': { ru: 'Лазурный клинок', p: [
    ['passive', 'Приговор', 'Judgement', 'После применения навыка следующая базовая атака в течение 3 с наносит +50 чистого урона. Перезарядка 1,5 с.', 'After casting a skill, the next Basic Attack within 3s deals 50 extra True Damage. 1.5s cooldown.']] },
  'Tome of Evil': { ru: 'Книга зла', p: [] },
  'Magic Wand': { ru: 'Волшебная палочка', p: [] },
  'Mystic Container': { ru: 'Загадочный сосуд', p: [] },
  'Book of Sages': { ru: 'Книга мудрости', p: [] },
  'Magic Necklace': { ru: 'Магическое ожерелье', p: [] },
  'Power Crystal': { ru: 'Кристалл силы', p: [] },
  'Mystery Codex': { ru: 'Магическая книга', p: [] },
  'Magic Potion': { ru: 'Зелье магии', p: [
    ['passive', 'Усиление', 'Increase Power', 'Сразу после покупки даёт +30 магической силы и 10% сокращения перезарядки на 120 с.', 'Upon purchase, grants 30 Magic Power and 10% Cooldown Reduction for 120s.']] },
  'Lantern of Hope': { ru: 'Фонарь надежды', p: [
    ['passive', 'Фонарь надежды', 'Lantern of Hope', 'Стартовый предмет Флорин, занимает слот. Характеристики растут с уровнем героя.', 'Floryn’s default item, takes a slot. Its attributes scale with hero level.']] },
  'Flower of Hope': { ru: 'Цветок надежды', p: [
    ['passive', 'Цветок надежды', 'Flower of Hope', 'Его Флорин передаёт союзникам, слот не занимает. Раз в 6 с навык или базовая атака наносит 60 (+30% общей физ. атаки, +30% общей маг. силы) магического урона.', 'Floryn shares it with allies; it takes no slot. Every 6s a skill or Basic Attack deals 60 (+30% Total Physical Attack, +30% Total Magic Power) Magic Damage.']] },

  'Radiant Armor': { ru: 'Сияющая броня', short: ['Против маг. урона', 'Against magic damage'], p: [
    ['passive', 'Святое благословение', 'Holy Blessing', 'Получение магического урона даёт 5 (+1 × уровень героя) магической защиты на 5 с, до 6 зарядов (не чаще раза в 0,4 с).', 'Taking Magic Damage grants 5 (+1 × hero level) Magic Defense for 5s, up to 6 stacks (once every 0.4s).']],
    story: ['«Эта броня — для героев, что сражаются без страха в сердце». На церемонии объединения Империи Мониян Гай Великий вручил её храбрейшим.', '“This armor is given to those heroes who fight without fear in their hearts.” At the unification of the Moniyan Empire, Gaius the Great gave it to the bravest heroes.'] },
  'Chastise Pauldron': { ru: 'Наплечник наказания', short: ['Снижает скорость атаки врага', 'Slows enemy attacks'], p: [
    ['passive', 'Наказание', 'Chastise', 'Получая урон, герой снижает скорость атаки атакующего и её предел до 75% на 2 с.', 'Taking damage reduces the attacker’s Attack Speed and Attack Speed cap to 75% for 2s.'],
    ['passive', 'Искупление', 'Redemption', 'Если урон опускает ОЗ ниже 30%, за 2 с восстанавливается 20% макс. ОЗ. Перезарядка 60 с.', 'When damage drops HP below 30%, recover 20% Max HP over 2s. 60s cooldown.']],
    story: ['На западе Земель Рассвета, среди Туманных гор, страж-кентавр надевает священный наплечник, чтобы покарать любого захватчика.', 'In the western reaches of the Land of Dawn, among the Misty Mountains, a centaur guardian dons the sacred pauldron to punish any invader.'] },
  'Brute Force Breastplate': { ru: 'Кираса грубой силы', short: ['Атака, скорость, сопротивление контролю', 'Attack, speed, CC reduction'], p: [
    ['passive', 'Грубая сила', 'Brute Force', 'Каждую секунду после нанесения урона герой получает +8 адаптивной атаки и +2% скорости передвижения на 4 с, до 6 зарядов. При полном запасе длительность контроля сокращается ещё на 25%.', 'Each second after dealing damage, gain 8 Adaptive Attack and 2% Movement Speed for 4s, up to 6 stacks. At full stacks, gain 25% extra Control Duration Reduction.']],
    story: ['Жители Северной долины всегда находят свой путь. Не хватает силы — берут оружие покрепче. Не хватает защиты — броню потолще.', 'The people of the Northern Vale always find their own way. Lacking power? Grab a stronger weapon. Lacking defense? Grab stronger armor.'] },
  'Immortality': { ru: 'Бессмертие', short: ['Возрождение', 'Revive'], p: [
    ['passive', 'Бессмертный', 'Immortal', 'Через 2,5 с после смерти герой возрождается с 16% ОЗ и щитом на 150 (+70 × уровень героя) урона на 3 с. Перезарядка 210 с.', 'Revive 2.5s after death with 16% HP and a shield absorbing 150 (+70 × hero level) damage for 3s. 210s cooldown.']],
    story: ['Тысячу лет храбрость была им копьём, а чувства — щитом, и люди поняли: бессмертие не во времени, а в чести и подвигах.', 'After a thousand years with courage as their spear and emotion as their shield, humans learned that immortality lies not in time but in honor and achievement.'] },
  'Dominance Ice': { ru: 'Господство льда', short: ['Снижение исцеления', 'Anti-heal'], p: [
    ['passive', 'Щит крепости', 'Fortress Shield', 'За каждого вражеского героя в радиусе 5 единиц физическая и магическая защита растут на 8, до 40.', 'For each enemy hero within 5 units, Physical and Magic Defense increase by 8, up to 40.'],
    ['passive', 'Гибель жизни', 'Lifebane', 'Снижает щиты и регенерацию ОЗ врагов в радиусе 5 единиц до 60% на 1 с.', 'Reduces Shield and HP Regen of enemies within 5 units to 60% of normal for 1s.']],
    story: ['Щит из Лебединого замка напоминает о славном прошлом принца Алвина, отказавшегося от трона ради любви.', 'A shield kept in Swan Castle, a reminder of the gallant past of Prince Alvin, who gave up his throne for love.'] },
  "Athena's Shield": { ru: 'Щит валькирии', short: ['Сопротивл. разруш. маг. урону', 'Against burst magic'], p: [
    ['passive', 'Щит', 'Shield', 'При получении магического урона от навыков или базовых атак вражеских героев получаемый магический урон снижается на 25% на 3 с, включая сам этот удар. Эффект восстанавливается через 5 с вне боя.', 'Taking Magic Damage from enemy hero skills or Basic Attacks reduces Magic Damage taken by 25% for 3s, including the triggering hit. Recharges 5s after leaving combat.']],
    story: ['Сила валькирий, воспетая в Вине поэзии, — вечная защита Вальхаллы для северных племён.', 'The power of the Valkyries, recorded in the Wine of Poetry, stands for Valhalla’s eternal protection of the northern tribes.'] },
  'Oracle': { ru: 'Оракул', short: ['Усиление регенерации', 'Stronger healing'], p: [
    ['passive', 'Благословение', 'Bless', 'Получаемые щиты и регенерация ОЗ сильнее на 25%.', 'Shields and HP Regen received are increased by 25%.']],
    story: ['Эльфы грелись в лунном свете, что пробивался сквозь Древо Жизни, и его пышная зелень стала лучшим толкованием божественного пророчества.', 'As the Elves basked in moonlight shining through the Tree of Life, its lush leaves became the best interpretation of the divine oracle.'] },
  'Antique Cuirass': { ru: 'Древняя кираса', short: ['Снижение физ. АТК', 'Lowers enemy Physical Attack'], p: [
    ['passive', 'Сдерживание', 'Deter', 'Получив урон от навыка, герой снижает физический урон атакующего на 6% на 2 с, до 3 раз.', 'When hit by a skill, reduce the attacker’s Physical Damage by 6% for 2s, stacking up to 3 times.']],
    story: ['Захватив Бесплодные земли, люди нашли у орков эту древнюю броню: технологии в ней куда совершеннее, а сила чудесна.', 'After taking the Barren Lands, humans found this ancient armor among the Orcs, built with far more advanced technology and holding a miraculous power.'] },
  'Guardian Helmet': { ru: 'Защитный шлем', short: ['Постоянная реген. ОЗ', 'Constant HP regen'], p: [
    ['passive', 'Восстановление', 'Recovery', 'Через 5 с вне боя восстанавливает 2,5% общих ОЗ в секунду.', 'After 5s out of combat, recover 2.5% of Total HP per second.'],
    ['passive', 'Защитник', 'Defender', 'Получив за один удар больше 500 урона, герой восстанавливает 30 (+0,3% общих ОЗ)% от урона сверх этого порога.', 'When a single hit deals more than 500 damage, recover 30 (+0.3% Total HP)% of the damage above that amount as HP.']],
    story: ['Эльфы благословили этот доспех, сражаясь бок о бок с людьми, и он обрёл небывалую целебную силу.', 'Blessed by the Elves as they fought alongside humans, the armor holds an extraordinary healing power.'] },
  'Cursed Helmet': { ru: 'Проклятый шлем', short: ['Выживаемость и зачистка линий', 'Waveclear and durability'], p: [
    ['passive', 'Горящая душа', 'Burning Soul', 'Каждую секунду наносит ближайшим врагам магический урон в размере 1,2% общих ОЗ героя. По монстрам и миньонам урон выше на 125% (+15% × уровень героя).', 'Deals Magic Damage equal to 1.2% of Total HP per second to nearby enemies, increased by 125% (+15% × hero level) against creeps and minions.'],
    ['passive', 'Проклятие', 'Curse', 'Урон «Горящей души» снижает гибридную защиту цели на 3 на 3 с, до 3 раз.', 'Burning Soul damage reduces the target’s Hybrid Defense by 3 for 3s, stacking up to 3 times.']],
    story: ['В Кровавых демонах дремлет иная природа, что долгими ночами оборачивается одиночеством. Это проклятие держит их между Светом и Тьмой.', 'An altered nature lies dormant within the Blood Demons, turning into loneliness during long nights. It is a curse that keeps them between Light and Dark.'] },
  'Thunder Belt': { ru: 'Штормовой пояс', short: ['Урон для танков', 'Damage for tanks'], p: [
    ['passive', 'Удар грома', 'Thunderbolt', 'Раз в 4 с следующая базовая атака наносит цели и врагам рядом 50 (+100% доп. физ. защиты, +100% доп. маг. защиты) чистого урона и на миг замедляет их на 99%. Каждое попадание по герою навсегда даёт +1 гибридной защиты. У стрелков и магов эффект вдвое слабее.', 'Every 4s, the next Basic Attack deals 50 (+100% extra Physical Defense, +100% extra Magic Defense) True Damage to the target and nearby enemies and briefly slows them by 99%. Each hit on a hero permanently adds 1 Hybrid Defense. Halved for Marksmen and Mages.']],
    story: ['Пророк Магии заключил силу молнии в пояс и уравновесил в нём нападение и защиту. Теперь он хранится в Магической академии.', 'The Prophet of Magic imbued the power of lightning into a belt, balancing attack and defense. It is now kept in the vault of the Magic Academy.'] },
  "Queen's Wings": { ru: 'Крылья королевы', short: ['Противодействие при низких ОЗ', 'Survive at low HP'], p: [
    ['passive', 'Демонизация', 'Demonize', 'Когда ОЗ падают ниже 40%, на 3 с получаемый урон снижается на 30%, а перезарядка навыков сокращается на 2 с. Перезарядка 60 с.', 'When HP drops below 40%, gain 30% Damage Reduction for 3s and reduce skill cooldowns by 2s. 60s cooldown.'],
    ['passive', 'Непокорность', 'Defiance', 'За каждый потерянный 1% ОЗ урон растёт на 0,25%, до 15%.', 'For every 1% HP lost, damage increases by 0.25%, up to 15%.']],
    story: ['Королева отдала свою кровь обитателям Бездны, и дикое подземное царство расцвело под её крыльями.', 'The Queen offered her royal blood to the dwellers of the Abyss, and the once savage underground kingdom thrived under her wings.'] },
  'Blade Armor': { ru: 'Шипованная броня', short: ['Отражение урона', 'Reflects damage'], p: [
    ['passive', 'Шипы', 'Bladed Armor', 'Получив базовую атаку, герой наносит атакующему физический урон в размере 30 (+2% общей физ. защиты)% от входящего урона (до снижения) и замедляет его на 15% на 1 с.', 'When struck by a Basic Attack, deal Physical Damage equal to 30 (+2% Total Physical Defense)% of the incoming damage (before reduction) to the attacker and slow them by 15% for 1s.']],
    story: ['Самый стойкий и бесстрашный рыцарь Империи Мониян сокрушал в ней врагов несгибаемой волей.', 'The toughest and most fearless knight of the Moniyan Empire once wore it to overpower enemies with an unyielding will.'] },
  'Steel Legplates': { ru: 'Стальные ножные латы', p: [] },
  'Dreadnaught Armor': { ru: 'Броня неустрашимости', p: [
    ['passive', 'Сдерживание', 'Deter', 'Получив урон от навыка, герой снижает физический урон атакующего на 4% на 2 с, до 3 раз.', 'When hit by a skill, reduce the attacker’s Physical Damage by 4% for 2s, stacking up to 3 times.']] },
  'Black Ice Shield': { ru: 'Щит из черного льда', p: [
    ['passive', 'Щит крепости', 'Fortress Shield', 'За каждого вражеского героя в радиусе 5 единиц физическая и магическая защита растут на 4, до 20.', 'For each enemy hero within 5 units, Physical and Magic Defense increase by 4, up to 20.']] },
  'Silence Robe': { ru: 'Роба тишины', p: [] },
  'Molten Essence': { ru: 'Расплавленная субстанция', p: [
    ['passive', 'Горящая душа', 'Burning Soul', 'Каждую секунду наносит ближайшим врагам магический урон в размере 0,6% общих ОЗ героя. По монстрам и миньонам урон выше на 125% (+15% × уровень героя).', 'Deals Magic Damage equal to 0.6% of Total HP per second to nearby enemies, increased by 125% (+15% × hero level) against creeps and minions.']] },
  'Ares Belt': { ru: 'Пояс Ареса', p: [] },
  "Hero's Ring": { ru: 'Кольцо героя', p: [] },
  'Healing Necklace': { ru: 'Исцеляющее ожерелье', p: [] },
  'Magic Resist Cloak': { ru: 'Плащ сопротивления магии', p: [] },
  'Leather Jerkin': { ru: 'Кожаная броня', p: [] },
  'Vitality Crystal': { ru: 'Кристалл здоровья', p: [] },
  'Rock Potion': { ru: 'Зелье стойкости', p: [
    ['passive', 'Усиление', 'Increase Power', 'Сразу после покупки даёт +500 макс. ОЗ и 5% снижения урона на 120 с.', 'Upon purchase, grants 500 Max HP and 5% Damage Reduction for 120s.']] },

  'Demon Boots': { ru: 'Ботинки демона', short: ['Быстрая регенерация маны', 'Fast Mana regen'], p: [
    ['passive', 'Мистика', 'Mysticism', 'Убийство вражеского миньона или помощь в нём восстанавливают 4% маны. Помощь засчитывается, если миньон погиб в течение 2 с после вашего урона.', 'A kill or assist on an enemy minion restores 4% Mana (an assist counts if the minion dies within 2s after your damage).']] },
  'Rapid Boots': { ru: 'Сапоги-скороходы', short: ['Высокая скорость передвижения', 'High Movement Speed'], p: [
    ['passive', 'Побочный эффект', 'Side Effect', 'Нанесение или получение урона снижает скорость передвижения на 20 на 5 с.', 'Dealing or taking damage reduces Movement Speed by 20 for 5s.']] },
  'Swift Boots': { ru: 'Сапоги спешки', short: ['Скорость АТК', 'Attack Speed'], p: [] },
  'Arcane Boots': { ru: 'Сапоги заклинателя', short: ['Маг. проникновение', 'Magic Penetration'], p: [] },
  'Magic Boots': { ru: 'Магические ботинки', short: ['Сокращение перезарядки', 'Cooldown Reduction'], p: [] },
  'Tough Boots': { ru: 'Прочные сапоги', short: ['Сокращение длительности контроля', 'Shorter crowd control'], p: [
    ['passive', 'Стойкость', 'Fortitude', 'Длительность контроля и замедлений на герое короче на 25%.', 'Crowd control and slow duration reduced by 25%.']] },
  'Warrior Boots': { ru: 'Сапоги воина', short: ['Накапливаемая физ. защита', 'Stacking Physical Defense'], p: [
    ['passive', 'Доблесть', 'Valor', 'Получение физического урона даёт +4 физической защиты на 3 с, до 20.', 'Taking Physical Damage grants 4 Physical Defense for 3s, up to 20.']] },
  'Boots': { ru: 'Ботинки', p: [] },
  'Throw Forbidden': { ru: 'Запрет броска', p: [
    ['passive', 'Тяжёлая гора', 'Heavy Mountain', 'До конца матча союзный Кусака не может подхватить и бросить героя.', 'Become immune to allied Jawhead’s Ejector for the rest of the match.']] },
  'Allow Throw': { ru: 'Разрешение броска', p: [
    ['passive', 'Доверие', 'Trust', 'Союзный Кусака снова может бросать героя.', 'Allows allied Jawhead to fling you.']] },
  'Broken Heart': { ru: 'Разбитое сердце', p: [
    ['passive', 'Разбитое сердце', 'Heart Broken', 'Есть только у Кармиллы в команде с Сесилионом. До конца матча Сесилион не может применить к ней «Лунный вальс».', 'Only for Carmilla with Cecilion on the team: Cecilion cannot use Moonlit Waltz on her for the rest of the match.']] }
};
