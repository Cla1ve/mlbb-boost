#!/bin/bash
# =====================================================
# Скрипт диагностики HTTPS проблем для cla1veisapi.ru
# Запустите на сервере: bash diagnose-https.sh
# =====================================================

DOMAIN="cla1veisapi.ru"
SERVER_IP="46.149.68.193"

echo "=========================================="
echo "  ДИАГНОСТИКА HTTPS ДЛЯ $DOMAIN"
echo "=========================================="
echo ""

# 1. Проверка DNS
echo "=== 1. ПРОВЕРКА DNS ==="
echo ""
echo "Резолвинг через Google DNS (8.8.8.8):"
nslookup $DOMAIN 8.8.8.8 2>/dev/null || dig $DOMAIN @8.8.8.8 +short
echo ""
echo "Резолвинг через Cloudflare DNS (1.1.1.1):"
nslookup $DOMAIN 1.1.1.1 2>/dev/null || dig $DOMAIN @1.1.1.1 +short
echo ""
echo "Локальный резолвинг:"
nslookup $DOMAIN 2>/dev/null || dig $DOMAIN +short
echo ""

# 2. Проверка что сервер слушает на правильных портах
echo "=== 2. ПРОВЕРКА ПОРТОВ ==="
echo ""
echo "Порт 80 (HTTP):"
ss -tlnp | grep ':80 ' || netstat -tlnp | grep ':80 '
echo ""
echo "Порт 443 (HTTPS):"
ss -tlnp | grep ':443 ' || netstat -tlnp | grep ':443 '
echo ""
echo "Порт 8001 (API):"
ss -tlnp | grep ':8001 ' || netstat -tlnp | grep ':8001 '
echo ""

# 3. Проверка сервисов
echo "=== 3. СТАТУС СЕРВИСОВ ==="
echo ""
echo "Nginx:"
systemctl status nginx --no-pager | head -20
echo ""
echo "API сервис:"
systemctl status mlbb-api.service --no-pager | head -20 2>/dev/null || echo "Сервис не найден"
echo ""

# 4. Проверка конфигурации Nginx
echo "=== 4. КОНФИГУРАЦИЯ NGINX ==="
echo ""
echo "Тест конфигурации:"
nginx -t 2>&1
echo ""
echo "Активные сайты:"
ls -la /etc/nginx/sites-enabled/
echo ""
echo "Содержимое конфига API:"
cat /etc/nginx/sites-enabled/api 2>/dev/null || echo "Файл не найден"
echo ""

# 5. Проверка SSL сертификатов
echo "=== 5. SSL СЕРТИФИКАТЫ ==="
echo ""
echo "Список сертификатов Let's Encrypt:"
certbot certificates 2>/dev/null || echo "Certbot не установлен или нет сертификатов"
echo ""
echo "Проверка файлов сертификата:"
ls -la /etc/letsencrypt/live/$DOMAIN/ 2>/dev/null || echo "Директория сертификатов не найдена"
echo ""

# 6. Проверка локального подключения
echo "=== 6. ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ ==="
echo ""
echo "Тест API напрямую (localhost:8001):"
curl -s -o /dev/null -w "HTTP код: %{http_code}\n" http://127.0.0.1:8001/docs
echo ""
echo "Тест через Nginx HTTP (localhost):"
curl -s -o /dev/null -w "HTTP код: %{http_code}\n" --resolve $DOMAIN:80:127.0.0.1 http://$DOMAIN/docs 2>/dev/null || echo "Ошибка"
echo ""
echo "Тест через Nginx HTTPS (localhost):"
curl -s -o /dev/null -w "HTTP код: %{http_code}\n" -k --resolve $DOMAIN:443:127.0.0.1 https://$DOMAIN/docs 2>/dev/null || echo "Ошибка"
echo ""

# 7. Проверка внешнего подключения
echo "=== 7. ВНЕШНЕЕ ТЕСТИРОВАНИЕ ==="
echo ""
echo "Тест HTTPS напрямую по IP (должен вернуть ошибку SNI или работать):"
curl -v -k --connect-to $DOMAIN:443:$SERVER_IP:443 https://$DOMAIN/docs 2>&1 | head -30
echo ""

# 8. Проверка сертификата
echo "=== 8. ПРОВЕРКА СЕРТИФИКАТА НА ПОРТУ 443 ==="
echo ""
echo "Сертификат на localhost:443:"
echo | openssl s_client -connect 127.0.0.1:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null || echo "Не удалось получить сертификат"
echo ""

# 9. Логи
echo "=== 9. ЛОГИ (последние 20 строк) ==="
echo ""
echo "Nginx access log:"
tail -20 /var/log/nginx/access.log 2>/dev/null || echo "Лог не найден"
echo ""
echo "Nginx error log:"
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Лог не найден"
echo ""

# 10. Firewall
echo "=== 10. FIREWALL ==="
echo ""
echo "UFW статус:"
ufw status 2>/dev/null || echo "UFW не установлен"
echo ""
echo "iptables (порты 80, 443):"
iptables -L INPUT -n 2>/dev/null | grep -E '(80|443|ACCEPT)' | head -10 || echo "Нет доступа к iptables"
echo ""

echo "=========================================="
echo "  ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "=========================================="
echo ""
echo "СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Проверьте, совпадает ли IP в DNS с $SERVER_IP"
echo "2. Если DNS правильный, проверьте нет ли прокси/CDN между клиентом и сервером"
echo "3. Проверьте логи на предмет ошибок"
echo ""
