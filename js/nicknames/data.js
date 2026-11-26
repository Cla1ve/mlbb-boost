// Word lists for the nickname generator. Shared by the browser (js/nicknames/app.js) and the site build
// (static lists on the nickname page). Format: "Word|значение|tag", tag m = reads as male, f = as female, empty = either.

const parse = lines => lines.trim().split('\n').flatMap(line => line.split(';')).map(entry => {
  const [word, ru = '', tag = ''] = entry.trim().split('|');
  return word ? { word, ru, tag } : null;
}).filter(Boolean);

// One strong word. Meanings are shown under the nickname, so a player can choose by sense.
export const WORDS = parse(`
Amoral|вне морали;Solace|утешение;Apathy|апатия;Serene|безмятежность|f;Halcyon|тихие дни;Sonder|у каждого своя жизнь;Limerence|одержимая влюблённость|f;Reverie|грёзы|f
Lucid|ясный сон;Somnia|сны|f;Insomnia|бессонница;Ennui|тоска;Melancholy|меланхолия;Euphoria|эйфория|f;Nostalgia|ностальгия;Solitude|уединение
Silence|тишина;Mercy|милосердие|f;Malice|злой умысел;Karma|карма;Kismet|судьба;Vendetta|кровная месть;Nemesis|возмездие;Anathema|проклятие
Heresy|ересь;Sinful|грешный;Virtue|добродетель;Vice|порок;Pride|гордыня;Envy|зависть;Greed|жадность;Wrath|гнев|m
Rue|раскаяние|f;Dread|ужас|m;Sorrow|печаль;Bliss|блаженство|f;Hollow|пустота;Numb|без чувств;Absent|нет в сети;Elusive|неуловимый
Ruin|руины|m;Havoc|разгром|m;Ravage|опустошение|m;Rampage|буйство|m;Carnage|бойня|m;Mayhem|хаос|m;Chaos|хаос;Anarchy|анархия|m
Savage|дикий|m;Feral|одичавший;Rogue|изгой|m;Outlaw|вне закона|m;Renegade|отступник|m;Pariah|отверженный;Drifter|бродяга|m;Nomad|кочевник
Reaper|жнец|m;Wraith|призрак;Phantom|фантом;Specter|привидение;Revenant|восставший|m;Banshee|банши|f;Siren|сирена|f;Valkyrie|валькирия|f
Nyx|богиня ночи|f;Erebus|мрак|m;Morpheus|бог снов|m;Icarus|летящий к солнцу|m;Orpheus|певец из мифа|m;Styx|река мёртвых;Fenrir|волк из мифа|m;Hades|царь мёртвых|m
Elysium|рай героев;Valhalla|чертог воинов|m;Oblivion|забвение;Abyss|бездна;Void|пустота;Limbo|между мирами;Inferno|преисподняя|m;Paradox|парадокс
Cipher|шифр;Enigma|загадка;Anomaly|аномалия;Glitch|сбой;Proxy|заместитель;Vector|вектор|m;Quantum|квант;Neon|неон
Eclipse|затмение;Solstice|солнцестояние;Zenith|зенит|m;Nadir|низшая точка;Vesper|вечерняя звезда|f;Umbra|тень;Lumen|свет;Aether|эфир
Nova|новая звезда|f;Quasar|квазар|m;Meteor|метеор|m;Comet|комета;Zephyr|западный ветер;Tempest|буря;Monsoon|муссон;Tundra|тундра|m
Cinder|зола;Ember|тлеющий уголь|f;Pyre|погребальный костёр|m;Mirage|мираж;Petrichor|запах после дождя;Frost|мороз;Rime|иней;Glacier|ледник|m
Onyx|оникс;Sable|чёрный соболь;Obscura|тайная|f;Cobalt|кобальт|m;Amethyst|аметист|f;Garnet|гранат|f;Jet|гагат;Ivory|слоновая кость|f
Crimson|багровый;Scarlet|алый|f;Vermilion|киноварь;Indigo|индиго;Azure|лазурь|f;Argent|серебряный|m;Noir|чёрный;Blanc|белый
Viper|гадюка;Mamba|мамба|m;Lynx|рысь;Raven|ворон;Moth|мотылёк|f;Jackal|шакал|m;Kestrel|пустельга;Mantis|богомол|m
Requiem|реквием;Nocturne|ноктюрн;Sonata|соната|f;Elegy|элегия|f;Cadence|ритм;Lament|плач;Anthem|гимн|m;Verse|строфа
Sinister|зловещий|m;Morbid|мрачный;Grim|угрюмый|m;Ashen|пепельный;Pallid|бледный;Austere|суровый;Stoic|стоик|m;Arcane|тайный
Vanity|тщеславие|f;Fable|легенда;Myth|миф;Omen|знамение;Augur|прорицатель|m;Relic|реликвия;Totem|тотем|m;Sigil|печать
Valor|доблесть|m;Triumph|триумф|m;Ascend|восхождение;Vigil|бодрствование;Wander|странствие;Exile|изгнание;Haven|убежище|f;Sanctum|святилище
`);

// Compounds: Head + Tail ("VenomSky"). Respellings are applied to some of them.
export const HEADS = parse(`
Venom;Frost;Night;Void;Blood;Rose||f;Ash;Iron||m;Ghost;Lunar||f;Solar;Crimson;Silver;Silent;Wild;Dark;Neon;Cold;Soul;Dead
Dream;Moon||f;Star;Storm||m;Sin;Holy;Lost;Black||m;White;Pale;Grim||m;Snow||f;Rain;Dusk;Dawn;Sky;Ice;Fire;Thorn
Hex;Vex||m;Nova;Echo;Zero||m;Lethal||m;Mystic;Velvet||f;Cherry||f;Opal||f;Glass;Static;Midnight;Winter;Hollow;Raven
`);
export const TAILS = parse(`
Sky;Fall;Walker||m;Bane||m;Veil||f;Heart;Soul;Blade||m;Fang||m;Wing;Born;Light;Mist;Crow;Wolf||m;Fox;Raven;Lotus||f;Bloom||f;Flame
Wave;Reign||m;Rift;Vow;Song;Tear;Kiss||f;Dust;Shade;Mind;Eyes;Claw||m;Rose||f;Byte;Glow||f;Hunter||m;Reaper||m;Petal||f;Doll||f
Smoke;Ghost;Moth||f;Doom||m;Pulse;Haze
`);

// Words that take a stylised spelling well ("Cxrtez" style: one vowel to x, doubled last consonant and so on).
export const BASES = parse(`
Cortez||m;Vantage||m;Monarch||m;Marauder||m;Corsair||m;Harbinger||m;Heartbreak;Hatred;Lovelorn||f;Romance||f;Casper||m;Vandal||m
Ronin||m;Samurai||m;Soldier||m;Nirvana;Paranoia;Hysteria||f;Delirium;Insane;Madness;Sadness;Sinner||m;Hunter||m
Lonely;Savior||m;Traitor||m;Lethal||m;Mortal||m;Control;Panther||m;Sorrow;Daemon||m;Monster||m;Voodoo;Forsaken
Ruthless||m;Reckless;Restless;Careless;Heartless;Fearless||m;Breakdown;Nightfall;Afterlife;Daydream||f;Bloodline||m;Starlight||f
`);

// Japanese surnames, given names and words with their meaning.
export const JAPANESE = [
  ['Kurosawa', 'чёрное болото', 'black swamp', 'm'], ['Shirogane', 'серебро', 'silver', 'm'], ['Tsukishiro', 'лунный замок', 'moon castle', ''], ['Kagami', 'зеркало', 'mirror', ''],
  ['Yukimura', 'снежная деревня', 'snow village', 'm'], ['Amamiya', 'дворец дождя', 'rain shrine', ''], ['Kirishima', 'туманный остров', 'misty island', 'm'], ['Hoshino', 'звёздное поле', 'star field', ''],
  ['Kazehaya', 'быстрый ветер', 'swift wind', 'm'], ['Mikazuki', 'молодой месяц', 'crescent moon', ''], ['Shiranui', 'огни на море', 'sea fire', ''], ['Kurogane', 'чёрное железо', 'black iron', 'm'],
  ['Hanabira', 'лепесток', 'petal', 'f'], ['Yozora', 'ночное небо', 'night sky', ''], ['Akatsuki', 'рассвет', 'dawn', 'm'], ['Tasogare', 'сумерки', 'twilight', ''],
  ['Kuroneko', 'чёрная кошка', 'black cat', 'f'], ['Kitsune', 'лисица', 'fox', ''], ['Okami', 'волк', 'wolf', 'm'], ['Karasu', 'ворон', 'crow', 'm'],
  ['Hayate', 'шквал', 'gale', 'm'], ['Rindou', 'горечавка', 'gentian', ''], ['Shion', 'астра', 'aster', ''], ['Sakura', 'сакура', 'cherry blossom', 'f'],
  ['Tsubaki', 'камелия', 'camellia', 'f'], ['Suzume', 'воробей', 'sparrow', 'f'], ['Akane', 'тёмно-красный', 'deep red', 'f'], ['Shizuku', 'капля', 'droplet', 'f'],
  ['Hotaru', 'светлячок', 'firefly', 'f'], ['Kasumi', 'дымка', 'haze', 'f'], ['Yuzuki', 'мягкая луна', 'gentle moon', 'f'], ['Mizuki', 'прекрасная луна', 'beautiful moon', 'f'],
  ['Amaya', 'ночной дождь', 'night rain', 'f'], ['Nagisa', 'линия прибоя', 'shoreline', ''], ['Itsuki', 'дерево', 'tree', 'm'], ['Haruki', 'весенний свет', 'spring light', 'm'],
  ['Renji', 'лотос', 'lotus', 'm'], ['Kaito', 'морской полёт', 'sea flight', 'm'], ['Tatsuya', 'дракон', 'dragon', 'm'], ['Raiden', 'гром и молния', 'thunder', 'm'],
  ['Yami', 'тьма', 'darkness', ''], ['Hikari', 'свет', 'light', 'f'], ['Kage', 'тень', 'shadow', 'm'], ['Shinigami', 'бог смерти', 'death god', 'm'],
  ['Kokoro', 'сердце', 'heart', 'f'], ['Yume', 'сон, мечта', 'dream', 'f'], ['Setsuna', 'мгновение', 'instant', ''], ['Utsuro', 'пустой', 'hollow', ''],
  ['Mugen', 'бесконечность', 'infinity', 'm'], ['Kuro', 'чёрный', 'black', 'm'], ['Shiro', 'белый', 'white', ''], ['Ren', 'лотос', 'lotus', 'm'],
  ['Rei', 'ноль, дух', 'zero, spirit', ''], ['Sora', 'небо', 'sky', ''], ['Aoi', 'синий', 'blue', ''], ['Yoru', 'ночь', 'night', '']
].map(([word, ru, en, tag]) => ({ word, ru, en, tag }));
export const SUFFIXES = ['maru', 'ro', 'ki', 'shi', 'ra', 'zo', 'ya', 'ka'];

// Syllables for coined names. Chosen so that any combination stays easy to say.
export const ONSETS = ['v', 'k', 'z', 'n', 'r', 'l', 's', 'm', 'th', 'kh', 'd', 'el', 'al', 'ae', 'y', 'c', 'x', 'f', 'sh', 'vel', 'kai', 'zer'];
export const MIDDLES = ['a', 'e', 'i', 'o', 'ae', 'ei', 'y', 'ia', 'ao'];
export const LINKS = ['l', 'r', 'n', 'v', 's', 'th', 'z'];
export const ENDINGS = parse(`
ra||f;ro||m;ren;ris;ria||f;vin||m;lyn||f;ix;ia||f;el;iel;on||m;or||m;us||m;ys;ka;za;ne;na||f;th||m;is;en;yn;ae||f;ex||m;ari;ion||m
`);

// Phrase nicknames. {n} is the player's word or a short random one.
export const PHRASES = [
  'who is {n}?', '{n} not here', 'ask {n}', 'just {n}', 'miss u, {n}', '{n} is asleep', 'not ur {n}', '{n} left the chat', 'call me {n}', '{n} aint sorry',
  'oh, its {n}', '{n} never cries', 'blame {n}', '{n} again?', 'sorry, {n}', 'no more {n}', '{n} off duty', 'dont wake {n}', '{n} no mercy', 'hi, im {n}'
];
export const PHRASES_ALONE = [
  'nothing personal', 'too late to care', 'sleep is for later', 'its not me', 'you had one job', 'quiet please', 'last one standing', 'see u never',
  'no feelings here', 'maybe tomorrow', 'not today', 'i was never here', 'who hurt u?', 'catch me later', 'low hp, big ego', 'trust nobody',
  'still not sorry', 'afk in my head', 'just vibes', 'one more game'
];
export const PHRASE_WORDS = ['nobody', 'angel', 'ghost', 'villain', 'nova', 'vex', 'kai', 'luna', 'rain', 'zero', 'mochi', 'sunny', 'echo', 'frost'];

// Russian one-word and short phrase nicknames.
export const RUSSIAN = parse(`
Тишина;Полночь;Забвение;Сумрак;Изгой||m;Фантом||m;Пустота;Аритмия;Меланхолия||f;Апатия||f;Бессонница||f;Эхо;Мираж;Туман;Вьюга||f;Метель||f
Гроза||f;Пепел||m;Иней||m;Зарево;Затмение;Бездна||f;Омут||m;Пустошь||f;Скиталец||m;Отшельник||m;Странник||m;Палач||m;Ворон||m;Волчица||f
Лисица||f;Нимфа||f;Сирена||f;Валькирия||f;Ведьма||f;Лунатик||m;Мрак||m;Рассвет;Закат;Созвездие;Комета||f;Янтарь||m;Обсидиан||m;Полынь||f
Ландыш||m;Горечь||f;Нежность||f;Безмолвие;Равновесие;Печаль||f;Свобода||f;Дикарь||m;Бродяга||m;Азарт||m;Шторм||m;Омега||f;Первый снег;Тихий омут
не вернусь;холод внутри;сплю наяву;без имени;мимо проходил||m;мимо проходила||f;не твой||m;не твоя||f;сам по себе||m;сама по себе||f;тише воды;ночная смена
поздно спать;всё по плану;без обид;жду рассвета;далеко отсюда;последний ход
`);

// Matching pairs for two friends or a couple.
export const PAIRS = [
  ['Sol', 'Luna'], ['Nyx', 'Lux'], ['Ember', 'Frost'], ['Sinner', 'Saint'], ['Dawn', 'Dusk'], ['Yin', 'Yang'], ['Venom', 'Cure'], ['Chaos', 'Order'],
  ['Mercy', 'Malice'], ['Sora', 'Yoru'], ['Kuro', 'Shiro'], ['Hikari', 'Kage'], ['Aoi', 'Akane'], ['Echo', 'Silence'], ['Bloom', 'Wither'], ['Storm', 'Calm'],
  ['Predator', 'Prey'], ['Romeo', 'Juliet'], ['King', 'Queen'], ['Hunter', 'Raven'], ['Vodka', 'Lime'], ['Salt', 'Pepper'], ['Thorn', 'Rose'], ['Moth', 'Flame'],
  ['Тьма', 'Свет'], ['Гром', 'Молния'], ['Рассвет', 'Закат'], ['Волк', 'Лисица'], ['Лёд', 'Пламя'], ['Тише', 'Громче']
];
export const PAIR_HEADS = ['Moon', 'Sun', 'Night', 'Day', 'Frost', 'Fire', 'Dark', 'Light', 'Black', 'White', 'Blood', 'Honey', 'Sin', 'Holy'];
export const PAIR_FLIPS = [['Moon', 'Sun'], ['Night', 'Day'], ['Frost', 'Fire'], ['Dark', 'Light'], ['Black', 'White'], ['Sin', 'Holy']];

// Fragments that must never appear inside a generated nickname.
// Precise stems only: a broad "nig" would also drop every word with "night".
export const BLOCKED = ['sex', 'nigg', 'niga', 'nigr', 'fag', 'cum', 'dick', 'cock', 'anal', 'anus', 'rape', 'nazi', 'porn', 'slut', 'whore', 'fuck', 'fuk', 'shit', 'piss', 'twat', 'cunt', 'tits', 'titt', 'boob', 'penis', 'vagin', 'retard', 'hitler', 'kkk', 'isis', 'pedo', 'kys', 'dyke', 'хуй', 'хуе', 'пизд', 'ёб', 'бля', 'сука', 'муда', 'пидо', 'пидр', 'жоп', 'дроч', 'шлюх'];
