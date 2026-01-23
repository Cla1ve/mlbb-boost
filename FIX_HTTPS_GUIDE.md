# Руководство по исправлению HTTPS для cla1veisapi.ru

## Проблема

При обращении к `https://cla1veisapi.ru` возвращается сертификат `*.google-analytics.com` и ошибка 404 от Google. Это означает, что запросы идут не на ваш сервер.

## Диагностика

### Шаг 1: Запустите диагностику на сервере

```bash
# Подключитесь к серверу
ssh root@46.149.68.193

# Скачайте и запустите диагностику
curl -O https://raw.githubusercontent.com/YOUR_REPO/diagnose-https.sh
bash diagnose-https.sh

# Или скопируйте файл diagnose-https.sh на сервер и запустите
```

### Шаг 2: Проверьте DNS вручную

На сервере:
```bash
# Проверка через разные DNS серверы
nslookup cla1veisapi.ru 8.8.8.8
nslookup cla1veisapi.ru 1.1.1.1
dig cla1veisapi.ru @8.8.8.8 +short
```

**Ожидаемый результат:** IP должен быть `46.149.68.193`

Если IP отличается — проблема в DNS настройках на Timeweb.

### Шаг 3: Проверьте панель Timeweb

1. Войдите в панель управления Timeweb Cloud
2. Перейдите в раздел "Домены" → cla1veisapi.ru
3. Проверьте DNS записи:
   - **A запись**: `@` → `46.149.68.193`
   - **A запись**: `www` → `46.149.68.193` (опционально)
4. **ВАЖНО**: Проверьте, нет ли включённого прокси/CDN
5. Отключите любой "Защита от DDoS" или "CDN" временно

### Шаг 4: Проверьте что Nginx слушает на 443

```bash
# Должен показать nginx на порту 443
ss -tlnp | grep 443
# Ожидаемый вывод: LISTEN ... 0.0.0.0:443 ... nginx

# Проверка конфигурации
nginx -t

# Просмотр активных сайтов
ls -la /etc/nginx/sites-enabled/
```

## Решение проблем

### Если DNS указывает на неправильный IP

1. Войдите в панель Timeweb Cloud
2. Домены → cla1veisapi.ru → DNS записи
3. Удалите все записи кроме:
   - `A` | `@` | `46.149.68.193`
4. Подождите 5-15 минут для распространения

### Если есть прокси/CDN (Timeweb DDoS защита)

1. Войдите в панель Timeweb
2. Найдите настройки защиты/прокси
3. Отключите их или настройте правильно
4. Если используется CDN Timeweb — нужно загрузить SSL сертификат туда

### Если Nginx не слушает на 443

```bash
# Замените конфигурацию
sudo nano /etc/nginx/sites-available/api
# Вставьте содержимое из nginx-cla1veisapi.conf

# Проверьте
sudo nginx -t

# Перезапустите
sudo systemctl restart nginx
```

### Если сертификат не найден

```bash
# Проверьте наличие сертификата
ls -la /etc/letsencrypt/live/cla1veisapi.ru/

# Если нет - получите заново
sudo certbot certonly --nginx -d cla1veisapi.ru

# Или через standalone (остановите nginx)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d cla1veisapi.ru
sudo systemctl start nginx
```

### Если firewall блокирует

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Полная переустановка HTTPS

Если ничего не помогает, выполните полную переустановку:

```bash
# 1. Удалите старую конфигурацию
sudo rm /etc/nginx/sites-enabled/api
sudo rm /etc/nginx/sites-available/api

# 2. Удалите старый сертификат
sudo certbot delete --cert-name cla1veisapi.ru

# 3. Создайте минимальную HTTP конфигурацию
cat << 'EOF' | sudo tee /etc/nginx/sites-available/api
server {
    listen 80;
    server_name cla1veisapi.ru;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 4. Активируйте
sudo ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/api
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Перезапустите nginx
sudo nginx -t && sudo systemctl restart nginx

# 6. Проверьте HTTP доступ (с вашего компьютера)
# curl http://cla1veisapi.ru/docs

# 7. Получите SSL сертификат
sudo certbot --nginx -d cla1veisapi.ru --non-interactive --agree-tos --email your@email.com

# 8. Проверьте HTTPS
# curl https://cla1veisapi.ru/docs
```

## Проверка после исправления

С вашего компьютера (не на сервере):

```bash
# Windows PowerShell
curl.exe https://cla1veisapi.ru/docs

# Или в браузере
# https://cla1veisapi.ru/docs
```

Должна открыться страница Swagger UI.

## Контрольный список

- [ ] DNS A-запись указывает на 46.149.68.193
- [ ] Нет активного CDN/прокси на Timeweb
- [ ] Nginx слушает на портах 80 и 443
- [ ] SSL сертификат существует для cla1veisapi.ru
- [ ] Firewall разрешает порты 80 и 443
- [ ] API запущен и слушает на 127.0.0.1:8001
- [ ] curl https://cla1veisapi.ru/docs возвращает 200 OK

## Поддержка Timeweb

Если проблема связана с их инфраструктурой:
- Техподдержка Timeweb: https://timeweb.cloud/support
- Спросите: "Почему DNS для cla1veisapi.ru резолвится не на IP моего сервера 46.149.68.193?"
