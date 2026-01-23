# Краткое руководство: Настройка HTTPS с доменом

## Шаг 1: Покупка домена на Timeweb Cloud

1. Зайдите в панель Timeweb Cloud: https://timeweb.cloud
2. Перейдите в раздел **"Домены"** → **"Заказать домен"**
3. Выберите домен (например: `api-mlbb.ru` или `mlbb-api.ru`)
4. Завершите покупку и дождитесь активации (обычно 5-15 минут)

---

## Шаг 2: Настройка DNS записи

1. В панели Timeweb Cloud: **"Домены"** → выберите ваш домен
2. Перейдите в **"DNS-записи"**
3. Добавьте **A-запись**:
   - **Тип**: `A`
   - **Имя**: `@` (для основного домена `cla1veisapi.ru`)
   - **Значение**: `46.149.68.193`
   - **TTL**: `3600`
4. Сохраните изменения
5. Подождите 5-10 минут для распространения DNS

**Проверка DNS:**
```bash
# На вашем компьютере выполните:
nslookup cla1veisapi.ru
# Должен вернуть: 46.149.68.193
```

---

## Шаг 3: Установка Nginx

Подключитесь к серверу по SSH и выполните:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Nginx
sudo apt install nginx -y

# Установка Certbot для Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Проверка статуса Nginx
sudo systemctl status nginx
```

---

## Шаг 4: Настройка Nginx как reverse proxy

Создайте конфигурационный файл:

```bash
sudo nano /etc/nginx/sites-available/api
```

**Вставьте следующее** (для вашего домена `cla1veisapi.ru`):

```nginx
server {
    listen 80;
    server_name cla1veisapi.ru;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}
```

Активируйте конфигурацию:

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

---

## Шаг 5: Остановка старого сервиса с самоподписанным сертификатом

```bash
# Остановить старый systemd сервис
sudo systemctl stop mlbb-api.service
sudo systemctl disable mlbb-api.service

# Или если запущен вручную, найдите процесс:
ps aux | grep uvicorn
# И остановите его: kill <PID>
```

---

## Шаг 6: Получение SSL сертификата от Let's Encrypt

```bash
# Получить сертификат для вашего домена
sudo certbot --nginx -d cla1veisapi.ru
```

**Во время установки Certbot спросит:**
- Email для уведомлений (введите ваш email)
- Согласие с условиями (нажмите `Y`)
- Подписку на новости (можно `N`)

Certbot автоматически:
- ✅ Получит SSL сертификат
- ✅ Настроит Nginx для HTTPS
- ✅ Настроит редирект HTTP → HTTPS
- ✅ Настроит автообновление сертификата

---

## Шаг 7: Запуск API без SSL (Nginx будет обрабатывать HTTPS)

Создайте новый systemd сервис **БЕЗ SSL параметров**:

```bash
sudo nano /etc/systemd/system/mlbb-api.service
```

**Вставьте:**

```ini
[Unit]
Description=MLBB Boost API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/boostmlbb
Environment="PATH=/root/boostmlbb/venv_api/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/root/boostmlbb/venv_api/bin/uvicorn api_server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Важно:** 
- `--host 127.0.0.1` (не `0.0.0.0`) - только локальный доступ
- Нет параметров `--ssl-keyfile` и `--ssl-certfile` - SSL обрабатывает Nginx

Активируйте сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mlbb-api.service
sudo systemctl start mlbb-api.service
sudo systemctl status mlbb-api.service
```

---

## Шаг 8: Обновление кода на сайте

В файле `js/calculator.js` измените URL на ваш домен:

```javascript
// Базовые URL API
const API_BASE_HTTP = 'http://cla1veisapi.ru';
const API_BASE_HTTPS = 'https://cla1veisapi.ru';
```

---

## Шаг 9: Проверка работы

```bash
# Проверка HTTP (должен редиректить на HTTPS)
curl -I http://cla1veisapi.ru/calculate

# Проверка HTTPS
curl https://cla1veisapi.ru/calculate

# Проверка статуса сервисов
sudo systemctl status nginx
sudo systemctl status mlbb-api.service
```

**В браузере:**
1. Откройте `https://cla1veisapi.ru/docs`
2. Должна открыться документация FastAPI **без предупреждений**
3. Проверьте сайт на GitHub Pages - калькулятор должен работать быстро

---

## Устранение проблем

### Если Nginx не запускается:
```bash
sudo nginx -t  # Проверка конфигурации
sudo journalctl -u nginx -n 50  # Логи ошибок
```

### Если API не отвечает:
```bash
# Проверьте, что API слушает на 127.0.0.1:8001
netstat -tlnp | grep 8001

# Проверьте логи API
sudo journalctl -u mlbb-api.service -n 50
```

### Если DNS не работает:
```bash
# Подождите до 24 часов для полного распространения DNS
# Или проверьте DNS записи в панели Timeweb Cloud
```

---

## Итог

✅ Домен куплен и настроен  
✅ DNS записи добавлены  
✅ Nginx установлен и настроен  
✅ SSL сертификат получен от Let's Encrypt  
✅ Старый самоподписанный сертификат отключен  
✅ API работает через Nginx  
✅ Код обновлен на новый домен  

**Результат:**
- ✅ Нет предупреждений о небезопасном сайте
- ✅ Быстрые запросы (без задержек 30 секунд)
- ✅ Автоматическое обновление SSL сертификата
