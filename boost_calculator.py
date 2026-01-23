# -*- coding: utf-8 -*-
"""
MLBB BOOST CALCULATOR v2.0
Продвинутый калькулятор стоимости буста Mobile Legends: Bang Bang
с улучшенным распознаванием рангов
"""

from typing import Dict, List, Tuple, Optional
import re
from dataclasses import dataclass
import asyncio
from .time_helpers import format_estimated_time_for_booster

ROLE_DISPLAY_MAP = {
    'fighter': 'Боец',
    'боец': 'Боец',
    'mage': 'Мидер',
    'mid': 'Мидер',
    'мидер': 'Мидер',
    'marksman': 'Стрелок',
    'стрелок': 'Стрелок',
    'mm': 'Стрелок',
    'jungler': 'Лесник',
    'jg': 'Лесник',
    'лесник': 'Лесник',
    'roamer': 'Роумер',
    'support': 'Роумер',
    'роумер': 'Роумер',
    'any': 'Любая',
    'любой': 'Любая',
    'любая': 'Любая'
}


@dataclass
class RankInfo:
    """Информация о ранге"""
    name: str
    division: Optional[int]  # None для мифических рангов
    stars: int
    

class BoostCalculator:
    """
    Калькулятор стоимости буста MLBB
    """
    
    # Структура рангов с дивизионами
    RANK_STRUCTURE = {
        'warrior': {'name': 'Воин', 'divisions': 3, 'stars_per_div': 3, 'max_stars': 9},
        'elite': {'name': 'Элита', 'divisions': 3, 'stars_per_div': 4, 'max_stars': 12},
        'master': {'name': 'Мастер', 'divisions': 4, 'stars_per_div': 4, 'max_stars': 16},
        # MLBB: Грандмастер — 5 дивизионов, 5 звёзд
        'grandmaster': {'name': 'Грандмастер', 'divisions': 5, 'stars_per_div': 5, 'max_stars': 25},
        # MLBB: Эпик — 5 дивизионов, 5 звёзд
        'epic': {'name': 'Эпик', 'divisions': 5, 'stars_per_div': 5, 'max_stars': 25},
        'legend': {'name': 'Легенда', 'divisions': 5, 'stars_per_div': 5, 'max_stars': 25},
    }
    
    # Мифические ранги (без дивизионов, только звезды)
    MYTHIC_RANKS = {
        'mythic': {'name': 'Мифик', 'stars_from': 0, 'stars_to': 24},
        'honor': {'name': 'Мифическая честь', 'stars_from': 25, 'stars_to': 49},
        'glory': {'name': 'Мифическая слава', 'stars_from': 50, 'stars_to': 99},
        'immortal': {'name': 'Мифический бессмертный', 'stars_from': 100, 'stars_to': 999},
    }
    
    # Прайс-лист (руб/звезда)
    # Обновлено: 8 категорий (epic и legend отдельно, mythic и honor отдельно)
    PRICE_TABLE = {
        'warrior_elite': {
            'standard': 55,  # Воин, Элита
            'role': 60,
            'hero': 65,      # На 1-2 персонажах
            'party': 90,     # Совместный буст
        },
        'master_gm': {
            'standard': 80,  # Мастер, Грандмастер
            'role': 85,
            'hero': 110,     # На 1-2 персонажах
            'party': 120,    # Совместный буст
        },
        'epic': {
            'standard': 100, # Эпик
            'role': 110,
            'hero': 130,     # На 1-2 персонажах
            'party': 150,    # Совместный буст
        },
        'legend': {
            'standard': 100, # Легенда
            'role': 110,
            'hero': 130,     # На 1-2 персонажах
            'party': 150,    # Совместный буст
        },
        'mythic': {
            'standard': 110, # Мифик
            'role': 120,
            'hero': 150,     # На 1-2 персонажах
            'party': 210,    # Совместный буст
        },
        'honor': {
            'standard': 110, # Честь
            'role': 120,
            'hero': 150,     # На 1-2 персонажах
            'party': 210,    # Совместный буст
        },
        'glory': {
            'standard': 110, # Миф Слава
            'role': 120,
            'hero': 160,     # На 1-2 персонажах
            'party': 240,    # Совместный буст
        },
        'immortal': {
            'standard': 130, # Миф Бессмертный
            'role': 140,
            'hero': 180,     # На 1-2 персонажах
            'party': 300,    # Совместный буст
        },
    }
    
    # УЛУЧШЕННЫЕ алиасы рангов (от длинных к коротким для правильного матчинга)
    RANK_ALIASES = [
        # Длинные фразы ПЕРВЫМИ (чтобы "мифическая честь" находилась раньше "мифик")
        ('мифический бессмертный', 'immortal'),
        ('мифик бессмертный', 'immortal'),
        ('мифическая слава', 'glory'),
        ('мифическая честь', 'honor'),
        ('мифик слава', 'glory'),
        ('мифик честь', 'honor'),
        ('грандмастер', 'grandmaster'),
        ('легендарный', 'legend'),
        ('мифический', 'mythic'),
        ('эпический', 'epic'),
        ('бессмертный', 'immortal'),
        ('бессмерт', 'immortal'),
        ('grandmaster', 'grandmaster'),
        ('легенда', 'legend'),
        ('warrior', 'warrior'),
        ('мастер', 'master'),
        ('мифик', 'mythic'),
        ('элита', 'elite'),
        ('слава', 'glory'),
        ('честь', 'honor'),
        ('гранд', 'grandmaster'),
        ('эпик', 'epic'),
        ('воин', 'warrior'),
        ('лега', 'legend'),
        ('master', 'master'),
        ('legend', 'legend'),
        ('mythic', 'mythic'),
        ('elite', 'elite'),
        ('honor', 'honor'),
        ('glory', 'glory'),
        ('immortal', 'immortal'),
        ('epic', 'epic'),
        ('миф', 'mythic'),
        ('гм', 'grandmaster'),
        ('gm', 'grandmaster'),
    ]
    
    # Римские цифры -> арабские (от длинных к коротким!)
    DIVISION_MAP = [
        ('III', 3),
        ('iii', 3),
        ('IV', 4),
        ('iv', 4),
        ('II', 2),
        ('ii', 2),
        ('V', 5),
        ('v', 5),
        ('I', 1),
        ('i', 1),
        ('5', 5),
        ('4', 4),
        ('3', 3),
        ('2', 2),
        ('1', 1),
    ]
    
    def __init__(self, db=None):
        """
        Инициализация калькулятора
        
        Args:
            db: Объект базы данных (опционально).
                Если передан, цены будут загружаться из БД.
                Если None, используются жестко заданные цены из PRICE_TABLE.
        """
        self.db = db
        self._db_prices = None  # Кэш цен из БД
        self.custom_prices = None  # Пользовательские цены (для DualPriceCalculator)
    
    async def load_prices_from_db(self):
        """Загрузить актуальные цены из базы данных"""
        if self.db:
            try:
                self._db_prices = await self.db.get_all_boost_prices()
                return True
            except Exception as e:
                print(f"⚠️ Ошибка загрузки цен из БД: {e}")
                self._db_prices = None
                return False
        return False
    
    def get_price_table(self) -> Dict[str, Dict[str, int]]:
        """
        Получить таблицу цен (из БД если доступно, иначе дефолтную)
        
        Returns:
            Словарь цен в формате {category: {boost_type: price}}
        """
        # ИСПРАВЛЕНО: Приоритет custom_prices (для DualPriceCalculator)
        if hasattr(self, 'custom_prices') and self.custom_prices:
            return self.custom_prices
        if self._db_prices:
            return self._db_prices
        return self.PRICE_TABLE
    
    def parse_rank_string(self, rank_str: str) -> RankInfo:
        """
        ПРОДВИНУТЫЙ парсинг строки ранга с максимальной гибкостью
        
        Понимает ВСЕ варианты написания:
        - "Epic IV, 3 stars" -> RankInfo(epic, 4, 3)
        - "эпик 4 3 зв" -> RankInfo(epic, 4, 3)
        - "лега 3, 4 звезды" -> RankInfo(legend, 3, 4)
        - "Легенда II 2⭐" -> RankInfo(legend, 2, 2)
        - "Мифик 15 звезд" -> RankInfo(mythic, None, 15)
        - "Слава 75" -> RankInfo(glory, None, 75)
        - "миф честь" -> RankInfo(honor, None, 25) - дефолт для начала диапазона
        - "111 зв" -> RankInfo(immortal, None, 111) - автоопределение по количеству звезд
        """
        original_str = rank_str
        rank_str = rank_str.lower().strip()
        
        # ФАЗА 1: Нормализация ввода
        # Убираем точки и запятые, заменяем на пробелы
        rank_str = re.sub(r'[,.\-—–]', ' ', rank_str)
        # Схлопываем множественные пробелы
        rank_str = re.sub(r'\s+', ' ', rank_str).strip()
        
        # Нормализуем варианты "звезд"
        rank_str = re.sub(r'\b(?:зв|зв\.|звезда|звезды|звёзд|звёзды)\b', 'звезд', rank_str)
        rank_str = re.sub(r'\b(?:star|stars)\b', 'звезд', rank_str)
        
        # ФАЗА 2: Извлечение названия ранга (от длинных к коротким!)
        rank_name = None
        rank_name_matched = None
        for alias, canonical in self.RANK_ALIASES:
            # Используем word boundary для точного матчинга
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, rank_str):
                rank_name = canonical
                rank_name_matched = alias
                # Удаляем найденный ранг из строки
                rank_str = re.sub(pattern, '', rank_str, count=1).strip()
                break
        
        # ФАЗА 2.1: Автоопределение мифического ранга по количеству звезд
        # Если не нашли ранг, но есть большое число (50+), это точно мифик
        if not rank_name:
            # Ищем любое число в строке
            num_match = re.search(r'\b(\d+)\b', rank_str)
            if num_match:
                num = int(num_match.group(1))
                # Автоопределение мифического ранга по числу
                if 0 <= num <= 24:
                    rank_name = 'mythic'
                elif 25 <= num <= 49:
                    rank_name = 'honor'
                elif 50 <= num <= 99:
                    rank_name = 'glory'
                elif num >= 100:
                    rank_name = 'immortal'
        
        if not rank_name:
            raise ValueError(f"Не удалось определить ранг из строки: '{original_str}'")
        
        # ФАЗА 3: Определяем тип ранга
        is_mythic = rank_name in self.MYTHIC_RANKS
        
        division = None
        stars = 0
        
        if not is_mythic:
            # === ДИВИЗИОННЫЙ РАНГ ===
            
            # ФАЗА 3.0: СПЕЦИАЛЬНЫЙ СЛУЧАЙ - "два числа подряд" (например "1 5", "4 3")
            # Первое число = дивизион, второе = звезды
            two_numbers_pattern = r'\b(\d+)\s+(\d+)\b'
            two_numbers_match = re.search(two_numbers_pattern, rank_str)
            if two_numbers_match:
                potential_div = int(two_numbers_match.group(1))
                potential_stars = int(two_numbers_match.group(2))
                
                # Проверяем, что первое число похоже на дивизион (1-5)
                if 1 <= potential_div <= 5:
                    division = potential_div
                    stars = potential_stars
                    # Удаляем оба числа из строки
                    rank_str = rank_str.replace(two_numbers_match.group(0), '', 1).strip()
            
            # ФАЗА 3.1: СНАЧАЛА извлекаем ЗВЕЗДЫ (чтобы различить "1" как дивизион от "5" как звезды)
            # Варианты: "5 звезд", "5 зв", "5⭐"
            if stars == 0:  # Только если еще не нашли звезды в фазе 3.0
                star_patterns_explicit = [
                    r'(\d+)\s*(?:⭐)',                    # "3⭐"
                    r'(\d+)\s*(?:звезд)',                # "3 звезд"
                ]
                
                stars_str_to_remove = None
                for pattern in star_patterns_explicit:
                    star_match = re.search(pattern, rank_str)
                    if star_match:
                        stars = int(star_match.group(1))
                        stars_str_to_remove = star_match.group(0)
                        # Удаляем найденные звезды из строки
                        rank_str = rank_str.replace(stars_str_to_remove, '', 1).strip()
                        break
            
            # ФАЗА 3.2: Теперь извлекаем дивизион (от длинных к коротким!)
            # ВАЖНО: Ищем только ПЕРВОЕ вхождение цифры/римской цифры
            if division is None:  # Только если еще не нашли дивизион в фазе 3.0
                for div_str, div_num in self.DIVISION_MAP:
                    # Используем word boundary или конец строки
                    pattern = r'\b' + re.escape(div_str) + r'\b'
                    match = re.search(pattern, rank_str, re.IGNORECASE)
                    if match:
                        division = div_num
                        # Удаляем ТОЛЬКО найденное вхождение
                        rank_str = rank_str[:match.start()] + rank_str[match.end():]
                        rank_str = rank_str.strip()
                        break
            
            # Если дивизион не найден, дефолт = I (высший дивизион)
            if division is None:
                division = 1
            
            # ВАЛИДАЦИЯ: проверяем существование дивизиона
            max_divisions = self.RANK_STRUCTURE[rank_name]['divisions']
            if division > max_divisions:
                # УЛУЧШЕНИЕ: Показываем доступные дивизионы
                available_divs = self._get_available_divisions_display(rank_name)
                raise ValueError(
                    f"Дивизион {division} не существует для ранга {self.RANK_STRUCTURE[rank_name]['name']}.\n"
                    f"Доступные дивизионы: {available_divs}"
                )
            
            # ФАЗА 3.3: Если звезды еще не найдены, ищем просто число
            if stars == 0:
                # Ищем просто число (после того как удалили дивизион)
                star_match = re.search(r'(\d+)', rank_str)
                if star_match:
                    stars = int(star_match.group(1))
            
            # Дефолт: 1 звезда (начало дивизиона)
            if stars == 0:
                stars = 1
            
            # ВАЛИДАЦИЯ: проверяем количество звезд
            max_stars = self.RANK_STRUCTURE[rank_name]['stars_per_div']
            if stars > max_stars:
                raise ValueError(
                    f"В дивизионе {self._get_division_roman(division)} ранга {self.RANK_STRUCTURE[rank_name]['name']} "
                    f"максимум {max_stars} звезд (указано: {stars})"
                )
            
        else:
            # === МИФИЧЕСКИЙ РАНГ ===
            
            # ФАЗА 3.3: Извлечение количества звезд для мифика
            # Мифические ранги: только звезды, без дивизионов
            star_patterns = [
                r'(\d+)\s*(?:⭐)',                    # "50⭐"
                r'(\d+)\s*(?:звезд)',                # "50 звезд"
                r'(\d+)',                            # просто число
            ]
            
            for pattern in star_patterns:
                star_match = re.search(pattern, rank_str)
                if star_match:
                    stars = int(star_match.group(1))
                    break
            
            # ДЕФОЛТ для мифических рангов: начало диапазона
            if stars == 0:
                stars = self.MYTHIC_RANKS[rank_name]['stars_from']
            
            # ВАЛИДАЦИЯ: проверяем диапазон звезд
            stars_from = self.MYTHIC_RANKS[rank_name]['stars_from']
            stars_to = self.MYTHIC_RANKS[rank_name]['stars_to']
            
            # Мягкая валидация: если звезды выходят за пределы, автокорректируем ранг
            if stars < stars_from or stars > stars_to:
                # Пытаемся автоопределить правильный мифический ранг
                if 0 <= stars <= 24:
                    rank_name = 'mythic'
                elif 25 <= stars <= 49:
                    rank_name = 'honor'
                elif 50 <= stars <= 99:
                    rank_name = 'glory'
                elif stars >= 100:
                    rank_name = 'immortal'
        
        return RankInfo(name=rank_name, division=division, stars=stars)
    
    def _get_available_divisions_display(self, rank_name: str) -> str:
        """Возвращает строку с доступными дивизионами для ранга"""
        num_divs = self.RANK_STRUCTURE[rank_name]['divisions']
        roman_numerals = ['V', 'IV', 'III', 'II', 'I']
        # Берем последние num_divs римских цифр
        available = roman_numerals[5-num_divs:5]
        return ', '.join(available)
    
    def _get_division_roman(self, division: int) -> str:
        """Конвертирует номер дивизиона в римскую цифру"""
        roman = ['I', 'II', 'III', 'IV', 'V']
        return roman[division - 1] if 1 <= division <= 5 else str(division)
    
    def rank_to_total_stars(self, rank: RankInfo) -> int:
        """
        Преобразование ранга в суммарное количество звезд от начала
        
        ВАЖНО: Дивизионы идут в порядке убывания: V (низший) → IV → III → II → I (высший)
        
        Примеры:
        - Warrior III, 1⭐ = 1 (начало Воина)
        - Warrior II, 1⭐ = 4 (3 звезды в III + 1 в II)
        - Warrior I, 1⭐ = 7 (3+3 в предыдущих + 1 в I)
        - Epic V, 1⭐ = 63 (9+12+16+25 предыдущих рангов + 1 в Epic V)
        - Epic IV, 1⭐ = 68 (63 + 5 за предыдущий дивизион + 0 + 1)
        - Epic I, 1⭐ = 83 (63 + 20 за 4 предыдущих дивизиона + 1)
        - Legend I, 5⭐ = 112 (последняя точка Legend)
        - Mythic 0⭐ = 113 (первая точка Mythic, +1 за переход)
        - Mythic 15⭐ = 113 + 15 = 128
        """
        if rank.name in self.MYTHIC_RANKS:
            # Для мифических рангов считаем все предыдущие дивизионные ранги
            total = 0
            for rank_key in ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend']:
                total += self.RANK_STRUCTURE[rank_key]['max_stars']
            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: +1 за переход из Legend в Mythic
            # Победа на Legend I 5⭐ = переход в Mythic 0⭐, это отдельный шаг прогресса
            # Без этого Legend I 5⭐ (112) == Mythic 0⭐ (112), что неверно
            total += 1
            # Плюс звезды в мифическом ранге
            total += rank.stars
            return total
        else:
            # Для дивизионных рангов считаем все предыдущие ранги
            total = 0
            rank_order = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend']
            current_idx = rank_order.index(rank.name)
            
            # Все предыдущие ранги
            for i in range(current_idx):
                total += self.RANK_STRUCTURE[rank_order[i]]['max_stars']
            
            # Текущий ранг
            structure = self.RANK_STRUCTURE[rank.name]
            divisions_count = structure['divisions']  # Например, 4 для Epic (IV, III, II, I)
            stars_per_div = structure['stars_per_div']  # Например, 5 для Epic
            
            # ИСПРАВЛЕНИЕ: Дивизионы нумеруются от высшего (1=I) до низшего (4=IV для Epic)
            # Epic IV (4) — начало Epic, 0 завершенных дивизионов
            # Epic III (3) — завершен 1 дивизион (IV)
            # Epic I (1) — завершено 3 дивизиона (IV, III, II)
            #
            # Формула: completed_divisions = divisions_count - rank.division
            completed_divisions = divisions_count - rank.division
            
            total += completed_divisions * stars_per_div
            
            # Плюс текущие звезды в текущем дивизионе
            total += rank.stars
            
            return total
    
    def calculate_stars_needed(self, rank_from: RankInfo, rank_to: RankInfo) -> Dict[str, int]:
        """
        Расчет количества звезд по категориям рангов (8 категорий)
        
        Возвращает:
        {
            'warrior_elite': количество звезд,
            'master_gm': количество звезд,
            'epic': количество звезд,
            'legend': количество звезд,
            'mythic': количество звезд,
            'honor': количество звезд,
            'glory': количество звезд,
            'immortal': количество звезд,
        }
        """
        stars_from = self.rank_to_total_stars(rank_from)
        stars_to = self.rank_to_total_stars(rank_to)
        
        if stars_to <= stars_from:
            raise ValueError("Целевой ранг должен быть выше начального")
        
        # НОВАЯ ПРОВЕРКА: Минимум 3 звезды для заказа
        import config
        MIN_STARS = getattr(config, 'MIN_STARS_FOR_ORDER', 3)
        MAX_STARS = getattr(config, 'MAX_STARS_FOR_ORDER', 1000)
        
        stars_diff = stars_to - stars_from
        if stars_diff < MIN_STARS:
            raise ValueError(
                f"Минимальное количество звезд для заказа — {MIN_STARS}⭐\n\n"
                f"Вы указали буст на {stars_diff}⭐\n"
                f"Пожалуйста, выберите целевой ранг минимум на {MIN_STARS} звезды выше текущего."
            )
        
        # НОВАЯ ПРОВЕРКА: Максимум 1000 звезд для заказа
        if stars_diff > MAX_STARS:
            raise ValueError(
                f"Максимальное количество звезд для заказа — {MAX_STARS}⭐\n\n"
                f"Вы указали буст на {stars_diff}⭐\n"
                f"Пожалуйста, выберите целевой ранг не более чем на {MAX_STARS} звезд выше текущего."
            )
        
        categories = {
            'warrior_elite': 0,
            'master_gm': 0,
            'epic': 0,
            'legend': 0,
            'mythic': 0,
            'honor': 0,
            'glory': 0,
            'immortal': 0,
        }

        # Динамическое разбиение вместо "магических" диапазонов.
        #
        # ВАЖНО: "звезды" здесь — это шаги прогресса (победы):
        # - Мы НЕ считаем стартовую точку (stars_from), считаем каждое последующее продвижение.
        #
        # Для дивизионных рангов (до мифика) категорию определяем по РАНГУ ДО победы (pre-win),
        # чтобы переход в следующий ранг/дивизион относился к предыдущему рангу (играется там).
        #
        # Для мифических рангов (0⭐, 1⭐, ...) — разбиение идёт ПО ТИРАМ:
        # Mythic -> Honor -> Glory -> Immortal.
        # По бизнес-правилу сервиса "пороговая звезда" относится к предыдущему тиру:
        # - 25⭐ (вход в Честь) считается как Мифик
        # - 50⭐ (вход в Славу) считается как Честь
        # - 100⭐ (вход в Бессмертный) считается как Слава
        # Это соответствует ожиданиям:
        # Mythic 13 -> Honor 33: 12⭐ Mythic + 8⭐ Honor
        # Honor 25 -> Glory 51: 25⭐ Honor + 1⭐ Glory
        # Glory 55 -> Immortal 119: 45⭐ Glory + 19⭐ Immortal
        rank_order = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend']
        pre_mythic_total = sum(self.RANK_STRUCTURE[key]['max_stars'] for key in rank_order)
        mythic_zero_absolute = pre_mythic_total + 1  # Mythic 0⭐ (после перехода из Legend)

        def _rank_key_for_total_star(total_star: int) -> Optional[str]:
            """Определить дивизионный ранг по абсолютному индексу (1..pre_mythic_total)."""
            if total_star < 1 or total_star > pre_mythic_total:
                return None
            cursor = 0
            for key in rank_order:
                start = cursor + 1
                end = cursor + self.RANK_STRUCTURE[key]['max_stars']
                if start <= total_star <= end:
                    return key
                cursor = end
            return None

        def _mythic_category_for_resulting_star(resulting_mythic_star: int) -> str:
            """
            Определить категорию для шага прогресса в мифике по *результирующей* звезде.
            Пороговая звезда относится к предыдущему тиру (см. комментарий выше).
            """
            if resulting_mythic_star <= 25:
                return 'mythic'
            if resulting_mythic_star <= 50:
                return 'honor'
            if resulting_mythic_star <= 100:
                return 'glory'
            return 'immortal'

        current = stars_from
        while current < stars_to:
            # Категория определяется по текущему состоянию ДО победы.
            if current <= pre_mythic_total:
                current_rank_key = _rank_key_for_total_star(current)
                if current_rank_key in ('warrior', 'elite'):
                    categories['warrior_elite'] += 1
                elif current_rank_key in ('master', 'grandmaster'):
                    categories['master_gm'] += 1
                elif current_rank_key == 'epic':
                    categories['epic'] += 1
                elif current_rank_key == 'legend':
                    categories['legend'] += 1
                else:
                    # Теоретически недостижимо при корректной структуре/индексации.
                    categories['legend'] += 1
            else:
                # Внутри мифических тиров:
                # категорию определяем по результирующей звезде (после победы).
                current_mythic_star = max(0, current - mythic_zero_absolute)  # 0⭐, 1⭐, ...
                resulting_mythic_star = current_mythic_star + 1
                cat = _mythic_category_for_resulting_star(resulting_mythic_star)
                categories[cat] += 1

            current += 1

        return categories
    
    def calculate_price(
        self,
        rank_from_str: str,
        rank_to_str: str,
        boost_type: str = 'standard',
        weak_markup: int = 0
    ) -> Dict:
        """
        Главная функция расчета стоимости
        
        Args:
            rank_from_str: Начальный ранг (строка)
            rank_to_str: Целевой ранг (строка)
            boost_type: Тип буста (standard/role/hero/party)
            weak_markup: Процент надбавки за слабый аккаунт
        
        Returns:
            Детальный словарь с расчетами
        """
        # Парсим ранги
        try:
            rank_from = self.parse_rank_string(rank_from_str)
            rank_to = self.parse_rank_string(rank_to_str)
        except Exception as e:
            return {
                'success': False,
                'error': f"Ошибка парсинга рангов: {str(e)}"
            }
        
        # Проверяем тип буста
        if boost_type not in ['standard', 'role', 'hero', 'party']:
            boost_type = 'standard'
        
        # Рассчитываем звезды по категориям
        try:
            stars_by_category = self.calculate_stars_needed(rank_from, rank_to)
        except Exception as e:
            return {
                'success': False,
                'error': f"Ошибка расчета: {str(e)}"
            }
        
        # Рассчитываем стоимость по категориям
        breakdown = []
        subtotal = 0
        
        # Получаем актуальную таблицу цен (из БД или дефолтную)
        price_table = self.get_price_table()
        
        for category, stars in stars_by_category.items():
            if stars > 0:
                price_per_star = price_table[category][boost_type]
                category_cost = stars * price_per_star
                subtotal += category_cost
                
                # Человекочитаемое название категории (8 категорий)
                category_names = {
                    'warrior_elite': 'Воин, Элита',
                    'master_gm': 'Мастер, Грандмастер',
                    'epic': 'Эпик',
                    'legend': 'Легенда',
                    'mythic': 'Мифик',
                    'honor': 'Честь',
                    'glory': 'Слава',
                    'immortal': 'Бессмертный',
                }
                
                breakdown.append({
                    'category': category_names[category],
                    'stars': stars,
                    'price_per_star': price_per_star,
                    'cost': category_cost,
                })
        
        # Применяем надбавку за слабый аккаунт
        weak_markup_amount = 0
        if weak_markup > 0:
            weak_markup_amount = subtotal * (weak_markup / 100)
        
        total = subtotal + weak_markup_amount
        
        return {
            'success': True,
            'rank_from': {
                'name': rank_from.name,
                'division': rank_from.division,
                'stars': rank_from.stars,
                'display': self._format_rank_display(rank_from),
            },
            'rank_to': {
                'name': rank_to.name,
                'division': rank_to.division,
                'stars': rank_to.stars,
                'display': self._format_rank_display(rank_to),
            },
            'boost_type': boost_type,
            'breakdown': breakdown,
            'subtotal': round(subtotal),
            'weak_markup_percent': weak_markup,
            'weak_markup_amount': round(weak_markup_amount),
            'total': round(total),
        }
    
    def _format_rank_display(self, rank: RankInfo) -> str:
        """Форматирование ранга для отображения"""
        # Получаем человекочитаемое название
        if rank.name in self.RANK_STRUCTURE:
            rank_display = self.RANK_STRUCTURE[rank.name]['name']
            # ИСПРАВЛЕНИЕ: маппинг division → римские цифры
            # division=1 → I, division=2 → II, ..., division=5 → V
            div_roman = ['I', 'II', 'III', 'IV', 'V']
            division_display = div_roman[rank.division - 1] if rank.division else ''
            return f"{rank_display} {division_display}, {rank.stars}⭐"
        elif rank.name in self.MYTHIC_RANKS:
            rank_display = self.MYTHIC_RANKS[rank.name]['name']
            return f"{rank_display}, {rank.stars}⭐"
        else:
            return "Неизвестный ранг"
    
    def _get_moscow_hour(self) -> int:
        """
        Получить текущий час в Московском времени (UTC+3)
        
        Returns:
            Час от 0 до 23
        """
        from datetime import datetime, timezone, timedelta
        
        # Moscow time = UTC+3
        moscow_tz = timezone(timedelta(hours=3))
        moscow_time = datetime.now(moscow_tz)
        return moscow_time.hour
    
    def calculate_boost_time(
        self,
        rank_from: RankInfo,
        rank_to: RankInfo,
        boost_type: str,
        stars_by_category: Dict[str, int] = None
    ) -> str:
        """
        Рассчитать время выполнения буста
        
        Логика:
        - До мифика: 24 мин/звезду (10 звезд = 4 часа)
        - От мифика: 30 мин/звезду (10 звезд = 5 часов)
        - ≤15 звезд: показываем в часах
        - 16-25 звезд: если после 23:00 MSK → "1 день", иначе часы
        - 26+ звезд: рассчитываем дни (25 звезд/день), можем показывать дробные
        - Пати-буст: специальное сообщение
        
        Args:
            rank_from: Начальный ранг
            rank_to: Конечный ранг
            boost_type: Тип буста
            stars_by_category: Опционально, звезды по категориям (для оптимизации)
        
        Returns:
            Строка с оценкой времени (например: "6 часов", "1 день", "2.5 дня")
        """
        # Пати-буст - особый случай
        if boost_type == 'party':
            return "Начнется в течение часа. Срок зависит от вас"
        
        # Рассчитываем общее количество звезд
        total_stars = self.rank_to_total_stars(rank_to) - self.rank_to_total_stars(rank_from)
        
        # Определяем сколько звезд в премифическом и мифическом диапазонах
        # Премифик = до 113 звезд (Warrior → Legend, ВКЛЮЧАЯ переход в Mythic)
        # Мифик = от 114 звезды (Mythic 1⭐+)
        # ВАЖНО: Переход в Mythic (звезда 113) считается как Legend,
        #        потому что игра происходит на Legend I 5⭐
        
        # Начало "игры в мифике" = Mythic 1⭐.
        # Mythic 0⭐ достигается победой в Legend и считается как "премифик" по времени.
        rank_order = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend']
        pre_mythic_total = sum(self.RANK_STRUCTURE[key]['max_stars'] for key in rank_order)
        mythic_zero_absolute = pre_mythic_total + 1
        MYTHIC_GAMEPLAY_START = mythic_zero_absolute + 1  # Mythic 1⭐
        
        stars_from_absolute = self.rank_to_total_stars(rank_from)
        stars_to_absolute = self.rank_to_total_stars(rank_to)
        
        # Считаем премифические и мифические звезды
        pre_mythic_stars = 0
        mythic_stars = 0
        
        for star_idx in range(stars_from_absolute + 1, stars_to_absolute + 1):
            if star_idx < MYTHIC_GAMEPLAY_START:
                pre_mythic_stars += 1
            else:
                mythic_stars += 1
        
        # Рассчитываем время в минутах
        total_minutes = (pre_mythic_stars * 24) + (mythic_stars * 30)
        
        # Конвертируем в часы
        total_hours = total_minutes / 60
        
        # Применяем логику отображения
        if total_stars <= 15:
            # ≤15 звезд: показываем в часах
            hours = int(total_hours)
            minutes = int((total_hours - hours) * 60)
            
            if hours == 0:
                return f"{minutes} минут"
            elif minutes == 0:
                return f"{hours} {'час' if hours == 1 else 'часа' if hours < 5 else 'часов'}"
            else:
                return f"{hours} {'час' if hours == 1 else 'часа' if hours < 5 else 'часов'} {minutes} мин"
        
        elif 16 <= total_stars <= 25:
            # 16-25 звезд: проверяем время
            moscow_hour = self._get_moscow_hour()
            
            if moscow_hour >= 23 or moscow_hour < 6:
                # После 23:00 или до 6:00 - показываем "1 день" (бустеры спят)
                return "1 день"
            else:
                # Днем - показываем в часах
                hours = int(total_hours)
                minutes = int((total_hours - hours) * 60)
                
                if minutes > 30:
                    hours += 1
                    minutes = 0
                
                if hours == 0:
                    return f"{minutes} минут"
                elif minutes == 0:
                    return f"{hours} {'час' if hours == 1 else 'часа' if hours < 5 else 'часов'}"
                else:
                    return f"{hours} {'час' if hours == 1 else 'часа' if hours < 5 else 'часов'} {minutes} мин"
        
        else:
            # 26+ звезд: рассчитываем в днях
            # 25 звезд за день, но учитываем что частичные дни тоже считаются
            days_exact = total_stars / 25.0
            
            # Округляем умно:
            # 26-37 stars (1.04-1.48) → 1.5 дня
            # 38-50 stars (1.52-2.0) → 2 дня
            # 51-62 stars (2.04-2.48) → 2.5 дня
            
            days_int = int(days_exact)
            days_frac = days_exact - days_int
            
            if days_frac <= 0.15:
                # Почти целое - показываем просто число дней
                return f"{days_int} {'день' if days_int == 1 else 'дня' if days_int < 5 else 'дней'}"
            elif days_frac >= 0.85:
                # Почти следующий день - округляем вверх
                days_int += 1
                return f"{days_int} {'день' if days_int == 1 else 'дня' if days_int < 5 else 'дней'}"
            else:
                # Показываем с .5 (половина дня)
                return f"{days_int}.5 {'дня' if days_int == 1 else 'дня'}"
    
    def format_invoice(self, calculation: Dict) -> str:
        """
        Форматирование итогового счета для отображения пользователю
        
        Args:
            calculation: Результат calculate_price()
        
        Returns:
            Строка с форматированным счетом
        """
        if not calculation.get('success'):
            return f"❌ {calculation.get('error', 'Неизвестная ошибка')}"
        
        # Заголовок
        boost_type_names = {
            'standard': 'Стандартный',
            'role': 'На роли',
            'hero': 'На герое',
            'party': 'В пати',
        }
        boost_type_display = boost_type_names.get(calculation['boost_type'], 'Стандартный')
        
        invoice = f"📊 <b>РАСЧЕТ СТОИМОСТИ БУСТА</b>\n\n"
        invoice += f"📍 <b>От:</b> {calculation['rank_from']['display']}\n"
        invoice += f"🎯 <b>До:</b> {calculation['rank_to']['display']}\n"
        invoice += f"⚙️ <b>Тип:</b> {boost_type_display}\n\n"
        invoice += "━━━━━━━━━━━━━━━━━━━━\n\n"
        
        # Разбивка по категориям
        for item in calculation['breakdown']:
            invoice += f"<b>{item['category']}</b> — {item['price_per_star']} руб/⭐\n"
            invoice += f"  {item['stars']}⭐ → {item['cost']:,} руб\n\n"
        
        invoice += "━━━━━━━━━━━━━━━━━━━━\n"
        invoice += f"<b>ИТОГО:</b> {calculation['total']:,} руб\n"
        
        # Надбавка за слабый аккаунт
        if calculation['weak_markup_percent'] > 0:
            invoice += f"<i>(+{calculation['weak_markup_percent']}% за слабый аккаунт: +{calculation['weak_markup_amount']:,} руб)</i>\n"
        
        return invoice


# Глобальный экземпляр калькулятора (без БД, использует дефолтные цены)
calculator = BoostCalculator()

# Вспомогательная функция для создания калькулятора с БД
async def get_calculator_with_prices(db) -> BoostCalculator:
    """
    Создает калькулятор и загружает актуальные цены из БД
    
    Args:
        db: Объект базы данных
        
    Returns:
        BoostCalculator с загруженными ценами из БД
    """
    calc = BoostCalculator(db=db)
    await calc.load_prices_from_db()
    return calc


if __name__ == "__main__":
    # Быстрые sanity-тесты для ручного запуска файла.
    # Полные тесты см. в отдельном скрипте `test_boost_calculator_bugcases.py`.
    print("=== MLBB Boost Calculator: sanity tests ===\n")

    calc = BoostCalculator()

    # Кейсы из баг-репорта:
    cases = [
        ("Легенда I, 1⭐", "Мифическая честь, 25⭐", {'legend': 5, 'mythic': 0, 'honor': 25}),
        ("Эпик I, 1⭐", "Мифик, 0⭐", {'epic': 5, 'legend': 25}),
    ]

    for rank_from_str, rank_to_str, expected in cases:
        rf = calc.parse_rank_string(rank_from_str)
        rt = calc.parse_rank_string(rank_to_str)
        stars = calc.calculate_stars_needed(rf, rt)
        ok = True
        for k, v in expected.items():
            if stars.get(k) != v:
                ok = False
        status = "✅" if ok else "❌"
        print(f"{status} {rank_from_str} → {rank_to_str}")
        if not ok:
            print("  expected:", expected)
            print("  got:", {k: stars.get(k) for k in expected.keys()})


# ============================================
# DUAL PRICE CALCULATOR - НОВАЯ СИСТЕМА ЦЕНООБРАЗОВАНИЯ
# Двойной расчет: для клиента и для бустера отдельно
# ============================================

class DualPriceCalculator:
    """
    Калькулятор с двойной системой ценообразования
    Рассчитывает цены отдельно для клиента и бустера
    Владелец получает разницу между ценами
    """
    
    def __init__(self, db=None):
        """
        Args:
            db: Database instance для загрузки цен из БД
        """
        self.db = db
        self.client_calculator = BoostCalculator(db)
        
        # Кэши цен (загружаются из БД)
        self.client_prices = {}
        self.booster_prices = {}
        
        # Флаг загрузки из БД
        self._prices_loaded = False
    
    async def load_prices(self):
        """Загрузка цен из БД"""
        if self.db and not self._prices_loaded:
            try:
                self.client_prices = await self.db.get_all_boost_prices()
                self.booster_prices = await self.db.get_all_booster_prices()
                self._prices_loaded = True
            except Exception as e:
                print(f"Ошибка загрузки цен: {e}")
                # Используем дефолтные значения
                self._use_default_prices()
        else:
            self._use_default_prices()
    
    def _use_default_prices(self):
        """Использовать дефолтные цены (если БД недоступна) - 8 категорий"""
        # Цены клиента (из текущей PRICE_TABLE)
        self.client_prices = {
            'warrior_elite': {'standard': 55, 'role': 60, 'hero': 65, 'party': 90},
            'master_gm': {'standard': 80, 'role': 85, 'hero': 110, 'party': 120},
            'epic': {'standard': 100, 'role': 110, 'hero': 130, 'party': 150},
            'legend': {'standard': 100, 'role': 110, 'hero': 130, 'party': 150},
            'mythic': {'standard': 110, 'role': 120, 'hero': 150, 'party': 210},
            'honor': {'standard': 110, 'role': 120, 'hero': 150, 'party': 210},
            'glory': {'standard': 110, 'role': 120, 'hero': 160, 'party': 240},
            'immortal': {'standard': 130, 'role': 140, 'hero': 180, 'party': 300},
        }
        
        # Цены бустера (новые, более низкие)
        self.booster_prices = {
            'warrior_elite': {'standard': 40, 'role': 45, 'hero': 50, 'party': 70},
            'master_gm': {'standard': 60, 'role': 65, 'hero': 80, 'party': 90},
            'epic': {'standard': 70, 'role': 80, 'hero': 100, 'party': 120},
            'legend': {'standard': 70, 'role': 80, 'hero': 100, 'party': 120},
            'mythic': {'standard': 80, 'role': 90, 'hero': 110, 'party': 170},
            'honor': {'standard': 80, 'role': 90, 'hero': 110, 'party': 170},
            'glory': {'standard': 90, 'role': 100, 'hero': 120, 'party': 200},
            'immortal': {'standard': 100, 'role': 110, 'hero': 150, 'party': 250},
        }
        
        # Также загружаем в калькулятор клиента
        self.client_calculator.custom_prices = self.client_prices
    
    def get_client_prices(self) -> Dict[str, Dict[str, int]]:
        """Получить текущие цены для клиентов"""
        return self.client_prices
    
    def get_booster_prices(self) -> Dict[str, Dict[str, int]]:
        """Получить текущие цены для бустеров"""
        return self.booster_prices
    
    async def calculate_dual_price(
        self,
        rank_from_str: str,
        rank_to_str: str,
        boost_type: str = 'standard',
        weak_markup: int = 0,
        discount_percent: int = 0
    ) -> Dict:
        """
        Основной метод: расчет цен для клиента и бустера
        
        Args:
            rank_from_str: Начальный ранг (строка)
            rank_to_str: Конечный ранг (строка)
            boost_type: Тип буста (standard/role/hero/party)
            weak_markup: Надбавка за слабый аккаунт (%)
            discount_percent: Скидка (%)
            
        Returns:
            {
                'success': bool,
                'client_total': int,              # Что платит клиент БЕЗ скидки
                'booster_total': int,             # Что получит бустер БЕЗ скидки
                'owner_commission': int,          # Комиссия владельца БЕЗ скидки
                'final_client_price': int,        # Итоговая цена для клиента (со скидкой)
                'final_booster_earnings': int,    # Итоговый заработок бустера (после скидки)
                'final_owner_commission': int,    # Итоговая комиссия владельца (после скидки)
                'client_breakdown': {...},        # Детализация расчета клиента
                'booster_breakdown': {...},       # Детализация расчета бустера
                'discount_details': {...},        # Детали применения скидки
                'rank_from': str,
                'rank_to': str,
                'rank_from_display': str,         # Форматированный начальный ранг
                'rank_to_display': str,           # Форматированный конечный ранг
                'boost_type': str,
                'estimated_time': str             # НОВОЕ: Оценка времени выполнения
            }
        """
        # Загружаем цены если не загружены
        if not self._prices_loaded:
            await self.load_prices()
        
        # 1. РАСЧЕТ ДЛЯ КЛИЕНТА (по ценам клиента)
        client_calc = await self._calculate_for_client(
            rank_from_str, rank_to_str, boost_type, weak_markup
        )
        
        if not client_calc['success']:
            return client_calc
        
        # 2. РАСЧЕТ ДЛЯ БУСТЕРА (по ценам бустера)
        booster_calc = await self._calculate_for_booster(
            rank_from_str, rank_to_str, boost_type, weak_markup
        )
        
        if not booster_calc['success']:
            return booster_calc
        
        # 3. БАЗОВЫЕ СУММЫ (БЕЗ СКИДКИ)
        client_total = client_calc['total']
        booster_total = booster_calc['total']
        owner_commission = client_total - booster_total
        
        # 4. ПРИМЕНЕНИЕ СКИДКИ (новая логика)
        discount_details = self._apply_discount_logic(
            client_total, booster_total, owner_commission, discount_percent
        )
        
        # 5. ПОЛУЧАЕМ ФОРМАТИРОВАННЫЕ ЗНАЧЕНИЯ РАНГОВ из client_calc
        # (они идентичны в client_calc и booster_calc, берем из client_calc)
        rank_from_display = client_calc.get('rank_from_display', rank_from_str)
        rank_to_display = client_calc.get('rank_to_display', rank_to_str)
        
        # 6. НОВОЕ: РАСЧЕТ ВРЕМЕНИ ВЫПОЛНЕНИЯ
        try:
            # Парсим ранги для расчета времени
            rank_from = self.client_calculator.parse_rank_string(rank_from_str)
            rank_to = self.client_calculator.parse_rank_string(rank_to_str)
            
            # Рассчитываем время
            estimated_time = self.client_calculator.calculate_boost_time(
                rank_from, rank_to, boost_type
            )
        except Exception as e:
            print(f"Ошибка расчета времени: {e}")
            estimated_time = "уточняется"
        
        # 7. ФОРМИРОВАНИЕ РЕЗУЛЬТАТА
        return {
            'success': True,
            'client_total': client_total,
            'booster_total': booster_total,
            'owner_commission': owner_commission,
            'final_client_price': discount_details['final_client_price'],
            'final_booster_earnings': discount_details['final_booster_earnings'],
            'final_owner_commission': discount_details['final_owner_commission'],
            'client_breakdown': client_calc['breakdown'],
            'booster_breakdown': booster_calc['breakdown'],
            'discount_details': discount_details,
            'rank_from': rank_from_str,
            'rank_to': rank_to_str,
            'rank_from_display': rank_from_display,
            'rank_to_display': rank_to_display,
            'boost_type': boost_type,
            'estimated_time': estimated_time  # НОВОЕ
        }
    
    async def _calculate_for_client(
        self, rank_from_str: str, rank_to_str: str, 
        boost_type: str, weak_markup: int
    ) -> Dict:
        """
        Расчет цены для клиента (используя существующий BoostCalculator)
        """
        try:
            # Используем существующий калькулятор
            self.client_calculator.custom_prices = self.client_prices
            result = self.client_calculator.calculate_price(
                rank_from_str, rank_to_str, boost_type, weak_markup
            )
            
            if not result['success']:
                return result
            
            # Формируем breakdown
            # ИСПРАВЛЕНО: используем правильные ключи из result
            breakdown = {
                'segments': result['breakdown'],  # breakdown, а не segments
                'total_stars': sum(item['stars'] for item in result['breakdown']),
                'base_price': result['subtotal'],
                'weak_markup': result['weak_markup_amount'],
                'total': result['total']
            }
            
            return {
                'success': True,
                'total': breakdown['total'],
                'breakdown': breakdown,
                'rank_from_display': result['rank_from']['display'],
                'rank_to_display': result['rank_to']['display']
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка расчета для клиента: {str(e)}'
            }
    
    async def _calculate_for_booster(
        self, rank_from_str: str, rank_to_str: str,
        boost_type: str, weak_markup: int
    ) -> Dict:
        """
        Расчет цены для бустера (по ценам бустера)
        Идентичная логика, но с другими ценами
        """
        try:
            # Создаем временный калькулятор с ценами бустера
            booster_calc = BoostCalculator(self.db)
            booster_calc.custom_prices = self.booster_prices
            
            result = booster_calc.calculate_price(
                rank_from_str, rank_to_str, boost_type, weak_markup
            )
            
            if not result['success']:
                return result
            
            # Формируем breakdown
            # ИСПРАВЛЕНО: используем правильные ключи из result
            breakdown = {
                'segments': result['breakdown'],  # breakdown, а не segments
                'total_stars': sum(item['stars'] for item in result['breakdown']),
                'base_price': result['subtotal'],
                'weak_markup': result['weak_markup_amount'],
                'total': result['total']
            }
            
            return {
                'success': True,
                'total': breakdown['total'],
                'breakdown': breakdown
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Ошибка расчета для бустера: {str(e)}'
            }
    
    def _apply_discount_logic(
        self,
        client_total: int,
        booster_total: int,
        owner_commission: int,
        discount_percent: int
    ) -> Dict:
        """
        Применение скидки по НОВОЙ ЛОГИКЕ:
        1. Сначала вычитается из комиссии владельца
        2. Если скидка больше комиссии - вычитается из оплаты бустера
        
        Returns:
            {
                'final_client_price': int,
                'final_booster_earnings': int,
                'final_owner_commission': int,
                'total_discount_amount': int,
                'discount_from_commission': int,
                'discount_from_booster': int,
                'discount_percent': int
            }
        """
        if discount_percent <= 0:
            # Нет скидки
            return {
                'final_client_price': client_total,
                'final_booster_earnings': booster_total,
                'final_owner_commission': owner_commission,
                'total_discount_amount': 0,
                'discount_from_commission': 0,
                'discount_from_booster': 0,
                'discount_percent': 0
            }
        
        # Общая сумма скидки
        total_discount_amount = int(client_total * discount_percent / 100)
        
        # ШАГ 1: Вычитаем из комиссии владельца
        discount_from_commission = min(total_discount_amount, owner_commission)
        remaining_discount = total_discount_amount - discount_from_commission
        
        # ШАГ 2: Если скидка больше комиссии - вычитаем из оплаты бустера
        discount_from_booster = 0
        if remaining_discount > 0:
            discount_from_booster = min(remaining_discount, booster_total)
            # Защита: бустер не может получить меньше 0
            if booster_total - discount_from_booster < 0:
                discount_from_booster = booster_total
        
        # Итоговые значения
        final_client_price = client_total - total_discount_amount
        final_owner_commission = owner_commission - discount_from_commission
        final_booster_earnings = booster_total - discount_from_booster
        
        return {
            'final_client_price': final_client_price,
            'final_booster_earnings': final_booster_earnings,
            'final_owner_commission': final_owner_commission,
            'total_discount_amount': total_discount_amount,
            'discount_from_commission': discount_from_commission,
            'discount_from_booster': discount_from_booster,
            'discount_percent': discount_percent
        }
    
    def format_booster_offer_text(self, calculation: Dict) -> str:
        """
        Форматирование текста предложения для бустера
        С детальным списком цен и доп. параметрами заказа.
        """
        if not calculation.get('success', False):
            return "❌ Ошибка расчета"

        def _extract_segments(breakdown_source):
            if not breakdown_source:
                return []
            data = breakdown_source
            if isinstance(data, dict):
                segments_value = data.get('segments')
                if isinstance(segments_value, list):
                    return segments_value
                breakdown_value = data.get('breakdown')
                if isinstance(breakdown_value, dict) and isinstance(breakdown_value.get('segments'), list):
                    return breakdown_value.get('segments', [])
                if isinstance(breakdown_value, list):
                    return breakdown_value
            elif isinstance(data, list):
                return data
            return []

        def _format_money(value):
            try:
                return f"{float(value):,.0f}"
            except (TypeError, ValueError):
                return str(value)

        def _role_display(raw_value: Optional[str]) -> Optional[str]:
            if not raw_value:
                return None
            normalized = str(raw_value).strip().lower()
            return ROLE_DISPLAY_MAP.get(normalized, raw_value)

        booster_segments = _extract_segments(calculation.get('booster_breakdown'))
        if not booster_segments:
            booster_segments = _extract_segments(calculation.get('client_breakdown'))

        price_lines = []
        for segment in booster_segments:
            try:
                stars = int(segment.get('stars', 0))
            except (TypeError, ValueError):
                stars = 0
            if stars <= 0:
                continue

            try:
                price_per_star = int(round(float(segment.get('price_per_star', 0))))
            except (TypeError, ValueError):
                price_per_star = segment.get('price_per_star', 0) or 0

            total_for_segment = segment.get('cost')
            if total_for_segment is None:
                total_for_segment = price_per_star * stars

            rank_name = segment.get('category', segment.get('rank_display', 'Неизвестно'))
            price_lines.append(
                f"● {rank_name} - {price_per_star}р ⭐ (×{stars} = {_format_money(total_for_segment)}р)"
            )

        booster_breakdown = calculation.get('booster_breakdown') or {}
        weak_markup = 0
        if isinstance(booster_breakdown, dict):
            weak_markup = booster_breakdown.get('weak_markup') or booster_breakdown.get('weak_markup_amount') or 0

        if not weak_markup:
            client_breakdown = calculation.get('client_breakdown') or {}
            if isinstance(client_breakdown, dict):
                weak_markup = client_breakdown.get('weak_markup') or client_breakdown.get('weak_markup_amount') or 0

        if not weak_markup:
            weak_markup = calculation.get('weak_account_markup', 0)

        price_details = "\n".join(price_lines) if price_lines else None
        if weak_markup and price_details:
            price_details += f"\n⚠️ Слабый аккаунт: +{_format_money(weak_markup)} руб"

        rank_from_display = calculation.get('rank_from_display', calculation.get('rank_from'))
        rank_to_display = calculation.get('rank_to_display', calculation.get('rank_to'))

        boost_type_names = {
            'standard': 'Стандартный',
            'role': 'На роли',
            'hero': 'На герое',
            'party': 'В пати'
        }
        boost_type_display = boost_type_names.get(calculation.get('boost_type'), calculation.get('boost_type', 'Стандартный'))

        estimated_time = calculation.get('estimated_time', 'уточняется')
        eta_for_booster = format_estimated_time_for_booster(
            estimated_time,
            calculation.get('boost_type')
        ) or estimated_time

        params_lines = [
            f"📍 От: {rank_from_display}",
            f"🎯 До: {rank_to_display}",
            f"⚙️ Тип: {boost_type_display}"
        ]

        hero_name = calculation.get('hero_name')
        if hero_name:
            params_lines.append(f"🦸 Герой: {hero_name}")

        exec_role = _role_display(
            calculation.get('boost_execution_role_display') or calculation.get('boost_execution_role')
        )
        if exec_role:
            params_lines.append(f"⚔️ Роль: {exec_role}")

        client_role = _role_display(
            calculation.get('client_role_party_display') or calculation.get('client_role_party')
        )
        if client_role:
            params_lines.append(f"👤 Роль клиента: {client_role}")

        text_blocks = [
            "📧 <b>НОВЫЙ ЗАКАЗ</b>",
            "",
            "<b>Параметры:</b>",
            "\n".join(params_lines),
            ""
        ]

        if price_details:
            text_blocks.extend([
                "🎫 <b>Цена за звезду:</b>",
                price_details,
                ""
            ])
        else:
            text_blocks.extend([
                "🎫 <b>Цена за звезду:</b>",
                "Детализация рассчитывается...",
                ""
            ])

        payout = calculation.get('final_booster_earnings', calculation.get('booster_total', 0))
        text_blocks.extend([
            f"💰 <b>Итоговая стоимость: {_format_money(payout)} руб</b>",
            ""
        ])
        
        # Добавляем предупреждение если скидка списана с заработка бустера
        # discount_from_booster может быть как на верхнем уровне, так и внутри discount_details
        discount_details = calculation.get('discount_details', {})
        discount_from_booster = calculation.get('discount_from_booster') or discount_details.get('discount_from_booster', 0)
        if discount_from_booster and discount_from_booster > 0:
            discount_percent = calculation.get('discount_percent') or discount_details.get('discount_percent', 0)
            text_blocks.extend([
                f"⚠️ <i>Скидка клиента ({discount_percent}%) частично списана с вашего заработка: -{_format_money(discount_from_booster)} руб</i>",
                ""
            ])
        
        text_blocks.extend([
            f"⏰ <b>Срок выполнения:</b> {eta_for_booster}",
            "🎯 <b>Винрейт:</b> 90%+",
            "",
            "<i>Принимая заказ, вы соглашаетесь с <a href=\"https://boostmlbb.ru/documents.html\">документами</a></i>"
        ])

        return "\n".join(text_blocks).strip()
    
    def format_client_invoice(self, calculation: Dict) -> str:
        """
        Форматирование счета для клиента
        """
        if not calculation['success']:
            return "❌ Ошибка расчета"
        
        client_breakdown = calculation['client_breakdown']
        segments = client_breakdown['segments']
        
        # Формируем детализацию
        # ИСПРАВЛЕНО: используем правильную структуру из breakdown
        details_lines = []
        for segment in segments:
            # segment теперь имеет структуру: {'category': ..., 'stars': ..., 'price_per_star': ..., 'cost': ...}
            rank_name = segment.get('category', segment.get('rank_display', 'Неизвестно'))
            price_per_star = segment['price_per_star']
            stars = segment['stars']
            total = segment.get('cost', price_per_star * stars)
            details_lines.append(f"  {rank_name}: {stars}⭐ × {price_per_star}р = {total:,}р")
        
        details = "\n".join(details_lines)
        
        # Fix: Display weak account markup
        weak_markup = client_breakdown.get('weak_markup', 0)
        if weak_markup > 0:
            details += f"\n  ⚠️ Слабый аккаунт: +{weak_markup} руб"
        
        # НОВОЕ: Получаем время выполнения
        estimated_time = calculation.get('estimated_time', 'уточняется')
        
        text = f"""
💰 <b>РАСЧЕТ СТОИМОСТИ БУСТА</b>

<b>Маршрут:</b>
📍 От: {calculation['rank_from']}
🎯 До: {calculation['rank_to']}
⚙️ Тип: {calculation['boost_type']}

<b>Детализация:</b>
{details}

<b>Базовая стоимость:</b> {calculation['client_total']:,.0f} руб
        """
        
        # Скидка
        if calculation['discount_details']['discount_percent'] > 0:
            dd = calculation['discount_details']
            text += f"""
<b>Скидка ({dd['discount_percent']}%):</b> -{dd['total_discount_amount']:,.0f} руб

✅ <b>К ОПЛАТЕ: {dd['final_client_price']:,.0f} руб</b>
            """
        else:
            text += f"\n✅ <b>К ОПЛАТЕ: {calculation['client_total']:,.0f} руб</b>"
        
        # НОВОЕ: Добавляем время выполнения и винрейт
        text += f"\n\n⏰ <b>Срок выполнения:</b> {estimated_time}"
        text += "\n🎯 <b>Винрейт:</b> 90%+"
        
        return text.strip()


async def get_dual_calculator(db=None) -> DualPriceCalculator:
    """
    Фабрика: создание и инициализация DualPriceCalculator
    
    Usage:
        calc = await get_dual_calculator(db)
        result = await calc.calculate_dual_price(...)
    """
    calculator = DualPriceCalculator(db)
    await calculator.load_prices()
    return calculator


# ============================================
# ТЕСТЫ DUAL PRICE CALCULATOR
# ============================================

async def test_dual_calculator():
    """Тестирование двойного калькулятора"""
    print("\n" + "="*60)
    print("ТЕСТИРОВАНИЕ DUAL PRICE CALCULATOR")
    print("="*60)
    
    calc = await get_dual_calculator()
    
    test_cases = [
        {
            'name': 'Легенда III → Мифик 20⭐',
            'from': 'Легенда III 4⭐',
            'to': 'Мифик 20⭐',
            'type': 'standard',
            'discount': 0
        },
        {
            'name': 'Эпик I → Легенда V (со скидкой 10%)',
            'from': 'Эпик I 1⭐',
            'to': 'Легенда V 5⭐',
            'type': 'role',
            'discount': 10
        },
        {
            'name': 'Мифик 5⭐ → Миф Честь 30⭐ (со скидкой 20%)',
            'from': 'Мифик 5⭐',
            'to': 'Миф Честь 30⭐',
            'type': 'hero',
            'discount': 20
        },
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n--- ТЕСТ {i}: {test['name']} ---")
        
        result = await calc.calculate_dual_price(
            test['from'], test['to'], test['type'], 
            weak_markup=0, discount_percent=test['discount']
        )
        
        if result['success']:
            print(f"✅ Расчет успешен")
            print(f"   Клиент платит: {result['client_total']:,} руб")
            print(f"   Бустер получит: {result['booster_total']:,} руб")
            print(f"   Комиссия владельца: {result['owner_commission']:,} руб")
            
            if test['discount'] > 0:
                dd = result['discount_details']
                print(f"\n   Скидка {dd['discount_percent']}%:")
                print(f"     - Вычтено из комиссии: {dd['discount_from_commission']:,} руб")
                if dd['discount_from_booster'] > 0:
                    print(f"     - Вычтено из оплаты бустера: {dd['discount_from_booster']:,} руб")
                print(f"   Итого:")
                print(f"     Клиент платит: {dd['final_client_price']:,} руб")
                print(f"     Бустер получит: {dd['final_booster_earnings']:,} руб")
                print(f"     Комиссия владельца: {dd['final_owner_commission']:,} руб")
        else:
            print(f"❌ Ошибка: {result.get('error')}")
    
    print("\n" + "="*60)
    print("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("="*60)


if __name__ == "__main__":
    # Запуск тестов
    import asyncio
    asyncio.run(test_dual_calculator())