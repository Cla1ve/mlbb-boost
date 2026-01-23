#!/bin/bash
# Скрипт быстрой настройки HTTPS для API сервера
# Использование: sudo bash setup-https.sh api.yourdomain.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Использование: sudo bash setup-https.sh api.yourdomain.com"
    exit 1
fi

echo "=== Настройка HTTPS для $DOMAIN ==="

# Обновление системы
echo "Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
echo "Установка Nginx и Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Создание конфигурации Nginx
echo "Создание конфигурации Nginx..."
cat > /etc/nginx/sites-available/api <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type" always;
        
        if (\$request_method = OPTIONS) {
            return 204;
        }
    }
}
EOF

# Активация конфигурации
ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
echo "Проверка конфигурации Nginx..."
nginx -t

# Перезапуск Nginx
echo "Перезапуск Nginx..."
systemctl restart nginx

# Получение SSL сертификата
echo "Получение SSL сертификата от Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Настройка автообновления сертификата
echo "Настройка автообновления сертификата..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Проверка статуса
echo ""
echo "=== Настройка завершена! ==="
echo "Проверьте статус Nginx: systemctl status nginx"
echo "Проверьте сертификат: certbot certificates"
echo ""
echo "Ваш API теперь доступен по адресу: https://$DOMAIN"
