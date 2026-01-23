# Инструкция по настройке HTTPS для API сервера

## Проблема
GitHub Pages работает по HTTPS, а ваш API на `http://46.149.68.193:8001` работает по HTTP. Браузеры блокируют запросы с HTTPS сайта к HTTP API (mixed content).

## Решение 1: С доменом (РЕКОМЕНДУЕТСЯ) ✅

### Шаг 1: Покупка домена на Timeweb Cloud

1. Зайдите в панель управления Timeweb Cloud
2. Перейдите в раздел "Домены" → "Заказать домен"
3. Выберите и купите домен (например, `api.yourdomain.com` или `yourdomain.com`)
4. Дождитесь активации домена (обычно несколько минут)

### Шаг 2: Настройка DNS записи

1. В панели Timeweb Cloud перейдите в "Домены" → выберите ваш домен
2. Перейдите в "DNS-записи"
3. Добавьте A-запись:
   - **Тип**: A
   - **Имя**: `api` (или `@` для основного домена)
   - **Значение**: `46.149.68.193`
   - **TTL**: 3600

### Шаг 3: Установка Nginx как reverse proxy

Подключитесь к серверу по SSH и выполните:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Nginx
sudo apt install nginx -y

# Установка Certbot для Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
```

### Шаг 4: Настройка Nginx

Создайте конфигурационный файл:

```bash
sudo nano /etc/nginx/sites-available/api
```

Вставьте следующую конфигурацию (замените `api.yourdomain.com` на ваш домен):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки (если нужно)
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
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t  # Проверка конфигурации
sudo systemctl restart nginx
```

### Шаг 5: Получение SSL сертификата

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Certbot автоматически:
- Получит SSL сертификат от Let's Encrypt
- Настроит автоматическое перенаправление HTTP → HTTPS
- Настроит автообновление сертификата

### Шаг 6: Обновление кода

После настройки HTTPS обновите URL в `js/calculator.js`:

```javascript
const getApiUrl = () => {
  if (window.location.protocol === 'https:') {
    return 'https://api.yourdomain.com/calculate';  // Замените на ваш домен
  }
  return 'http://api.yourdomain.com/calculate';
};
```

---

## Решение 2: Без домена (временное решение) ⚠️

Если домен пока не куплен, можно использовать самоподписанный сертификат. **Внимание**: браузеры будут показывать предупреждение о безопасности!

### Шаг 1: Установка OpenSSL

```bash
sudo apt update
sudo apt install openssl -y
```

### Шаг 2: Создание самоподписанного сертификата

```bash
# Создайте директорию для сертификатов
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Создайте сертификат (действителен 365 дней)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/api-selfsigned.key \
  -out /etc/ssl/certs/api-selfsigned.crt \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=MLBB Boost/CN=46.149.68.193"
```

### Шаг 3: Настройка Uvicorn с SSL

Остановите текущий процесс uvicorn и запустите с SSL:

```bash
# Остановите текущий процесс (Ctrl+C или kill)
# Затем запустите с SSL:
uvicorn api_server:app --host 0.0.0.0 --port 8001 \
  --ssl-keyfile /etc/ssl/private/api-selfsigned.key \
  --ssl-certfile /etc/ssl/certs/api-selfsigned.crt
```

### Шаг 4: Настройка автозапуска (systemd)

**ВАЖНО**: Сначала узнайте правильные пути на вашем сервере:

```bash
# Узнайте путь к uvicorn
which uvicorn
# Обычно это: /home/your_username/venv_api/bin/uvicorn или /usr/local/bin/uvicorn

# Узнайте путь к вашему API проекту
pwd
# Обычно это: /home/your_username/boostmlbb или /root/boostmlbb

# Узнайте имя пользователя
whoami
# Обычно это: root или ваш username
```

Создайте файл сервиса:

```bash
sudo nano /etc/systemd/system/mlbb-api.service
```

**ПРАВИЛЬНАЯ конфигурация для Timeweb Cloud** (замените пути на ваши):

```ini
[Unit]
Description=MLBB Boost API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/boostmlbb
Environment="PATH=/root/venv_api/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/root/venv_api/bin/uvicorn api_server:app --host 0.0.0.0 --port 8001 --ssl-keyfile /etc/ssl/private/api-selfsigned.key --ssl-certfile /etc/ssl/certs/api-selfsigned.crt
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Если у вас другой путь к venv, используйте:**

```ini
[Unit]
Description=MLBB Boost API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/boostmlbb
Environment="PATH=/root/venv_api/bin"
ExecStart=/root/venv_api/bin/python -m uvicorn api_server:app --host 0.0.0.0 --port 8001 --ssl-keyfile /etc/ssl/private/api-selfsigned.key --ssl-certfile /etc/ssl/certs/api-selfsigned.crt
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Проверка и активация:**

```bash
# Проверьте синтаксис файла
sudo systemctl daemon-reload
sudo systemctl status mlbb-api.service

# Если есть ошибки, проверьте логи
sudo journalctl -u mlbb-api.service -n 50

# Активируйте автозапуск
sudo systemctl enable mlbb-api.service

# Запустите сервис
sudo systemctl start mlbb-api.service

# Проверьте статус
sudo systemctl status mlbb-api.service
```

**Диагностика проблем systemd:**

Если сервис не запускается, выполните:

```bash
# 1. Проверьте логи ошибок
sudo journalctl -u mlbb-api.service -n 100 --no-pager

# 2. Проверьте, что пути правильные
ls -la /root/venv_api/bin/uvicorn
ls -la /root/boostmlbb/api_server.py

# 3. Проверьте, что файлы сертификатов существуют
ls -la /etc/ssl/private/api-selfsigned.key
ls -la /etc/ssl/certs/api-selfsigned.crt

# 4. Попробуйте запустить вручную (замените пути на ваши)
cd /root/boostmlbb
source /root/venv_api/bin/activate
uvicorn api_server:app --host 0.0.0.0 --port 8001 --ssl-keyfile /etc/ssl/private/api-selfsigned.key --ssl-certfile /etc/ssl/certs/api-selfsigned.crt

# Если работает вручную, значит проблема в systemd файле - проверьте пути в /etc/systemd/system/mlbb-api.service
```

### Шаг 5: Обновление кода

В `js/calculator.js` измените URL на HTTPS:

```javascript
const getApiUrl = () => {
  if (window.location.protocol === 'https:') {
    return 'https://46.149.68.193:8001/calculate';
  }
  return 'http://46.149.68.193:8001/calculate';
};
```

**Важно**: При первом обращении браузер покажет предупреждение о небезопасном сертификате. Пользователям нужно будет нажать "Дополнительно" → "Перейти на сайт".

---

## Проверка работы

После настройки проверьте:

1. **С доменом**:
   ```bash
   curl https://api.yourdomain.com/calculate
   ```

2. **Без домена**:
   ```bash
   curl -k https://46.149.68.193:8001/calculate
   ```

---

## Рекомендации

1. **Используйте домен** - это самое правильное решение
2. **Настройте CORS** на сервере для безопасности
3. **Используйте Nginx** как reverse proxy даже с доменом - это даст больше контроля
4. **Настройте firewall** - откройте только необходимые порты (80, 443)

---

## Дополнительная настройка CORS на сервере

Если используете FastAPI, добавьте в `api_server.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-github-username.github.io", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Замените `your-github-username` и `yourdomain.com` на ваши реальные домены.
