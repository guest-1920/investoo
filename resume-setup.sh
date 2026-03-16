#!/bin/bash
set -e

BACKEND_DIR="/var/www/investoo/wallet-system-backend"
cd "$BACKEND_DIR"
pm2 delete investo-backend 2>/dev/null || true
pm2 start dist/src/main.js --name investo-backend
pm2 save

echo ""
echo "[Frontend] Building investo-web..."
FRONTEND_DIR="/var/www/investoo/investo-web"
cd "$FRONTEND_DIR"

cat > .env << 'ENVEOF'
VITE_API_URL=https://api.investoo.net/api/v1
VITE_WALLET_TRC20=TFspwPRH12yQXXbHgzJRt9adRR33afLcxx
VITE_WALLET_BEP20=0x66F65804ba37f63d88Fc328d39DBAEEBbbff081F
VITE_WALLET_ERC20=0x66F65804ba37f63d88Fc328d39DBAEEBbbff081F
VITE_FRONTEND_URL=https://investoo.net
ENVEOF

npm ci --silent
npm run build
echo "  Frontend build complete → dist/"

echo ""
echo "[Admin] Building wallet-system-admin..."
ADMIN_DIR="/var/www/investoo/wallet-system-admin"
cd "$ADMIN_DIR"

cat > .env << 'ENVEOF'
VITE_API_URL=https://api.investoo.net/api/v1
ENVEOF

npm ci --silent
npm run build
echo "  Admin build complete → dist/"

echo ""
echo "[Nginx] Writing virtual host configs..."

# investoo.net
cat > /etc/nginx/sites-available/investoo.net << 'NGINXEOF'
server {
    listen 80;
    server_name investoo.net www.investoo.net;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name investoo.net www.investoo.net;
    ssl_certificate     /etc/ssl/cloudflare/investoo.net.pem;
    ssl_certificate_key /etc/ssl/cloudflare/investoo.net.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    root /var/www/investoo/investo-web/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;
}
NGINXEOF

# api.investoo.net
cat > /etc/nginx/sites-available/api.investoo.net << 'NGINXEOF'
server {
    listen 80;
    server_name api.investoo.net;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name api.investoo.net;
    ssl_certificate     /etc/ssl/cloudflare/investoo.net.pem;
    ssl_certificate_key /etc/ssl/cloudflare/investoo.net.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 10M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

# adminhnmadmin.investoo.net
cat > /etc/nginx/sites-available/adminhnmadmin.investoo.net << 'NGINXEOF'
server {
    listen 80;
    server_name adminhnmadmin.investoo.net;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name adminhnmadmin.investoo.net;
    ssl_certificate     /etc/ssl/cloudflare/investoo.net.pem;
    ssl_certificate_key /etc/ssl/cloudflare/investoo.net.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    root /var/www/investoo/wallet-system-admin/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_vary on;
}
NGINXEOF

# Enable sites
ln -sf /etc/nginx/sites-available/investoo.net /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.investoo.net /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/adminhnmadmin.investoo.net /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t && systemctl reload nginx || echo "Nginx config error, continuing..."

echo ""
echo "[Firewall] Configuring UFW..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo "  Firewall active. Ports open: 22, 80, 443"

echo "======================================================="
echo " SETUP COMPLETE!"
echo "======================================================="
