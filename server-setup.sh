#!/bin/bash
# =============================================================
# Investoo Platform — Full VPS Setup Script
# Server: 178.16.52.195 (Virtualine.net)
# Run as: root
# =============================================================

set -e  # Exit on any error

echo "======================================================="
echo " INVESTOO PLATFORM — SERVER SETUP"
echo "======================================================="

# -------------------------------------------------------
# PHASE 1: System Update & Base Packages
# -------------------------------------------------------
echo ""
echo "[1/8] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

echo "[1/8] Installing base tools..."
apt-get install -y -qq curl wget git ufw unzip

# -------------------------------------------------------
# PHASE 2: Node.js 20 LTS
# -------------------------------------------------------
echo ""
echo "[2/8] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs
echo "  Node: $(node -v) | npm: $(npm -v)"

# -------------------------------------------------------
# PHASE 3: Nginx
# -------------------------------------------------------
echo ""
echo "[3/8] Installing Nginx..."
apt-get install -y -qq nginx
systemctl enable nginx
echo "  Nginx: $(nginx -v 2>&1)"

# -------------------------------------------------------
# PHASE 4: PostgreSQL 16
# -------------------------------------------------------
echo ""
echo "[4/8] Installing PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

echo "  Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE investodb;" 2>/dev/null || echo "  (DB already exists)"
sudo -u postgres psql -c "CREATE USER investoo_user WITH ENCRYPTED PASSWORD 'C7ZLkyI4hdCH4M7HRpLVVQX8';" 2>/dev/null || echo "  (User already exists)"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE investodb TO investoo_user;" 2>/dev/null
sudo -u postgres psql -d investodb -c "GRANT ALL ON SCHEMA public TO investoo_user;" 2>/dev/null
echo "  PostgreSQL ready. DB: investodb | User: investoo_user"

# -------------------------------------------------------
# PHASE 5: Redis
# -------------------------------------------------------
echo ""
echo "[5/8] Installing Redis..."
apt-get install -y -qq redis-server
systemctl enable redis-server
systemctl start redis-server
echo "  Redis ping: $(redis-cli ping)"

# -------------------------------------------------------
# PHASE 6: PM2
# -------------------------------------------------------
echo ""
echo "[6/8] Installing PM2..."
npm install -g pm2 --silent
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
echo "  PM2: $(pm2 -v)"

# -------------------------------------------------------
# PHASE 7: Directory Structure & Repo Clone
# -------------------------------------------------------
echo ""
echo "[7/8] Setting up application directories..."
mkdir -p /var/www/investoo
mkdir -p /etc/ssl/cloudflare

# Clone or update the repo
REPO_URL="https://github.com/guest-1920/investoo.git"

if [ -d "/var/www/investoo/.git" ]; then
  echo "  Repo already exists — pulling latest..."
  cd /var/www/investoo && git pull origin main
else
  echo "  Cloning repo..."
  git clone "$REPO_URL" /var/www/investoo
fi

# -------------------------------------------------------
# PHASE 8: Backend Build & Start
# -------------------------------------------------------
echo ""
echo "[8/8] Building and starting backend..."

BACKEND_DIR="/var/www/investoo/wallet-system-backend"
cd "$BACKEND_DIR"

# Write production .env
cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USER=investoo_user
DB_PASS=C7ZLkyI4hdCH4M7HRpLVVQX8
DB_NAME=investodb
DB_POOL_SIZE=200
ALLOWED_ORIGINS=https://investoo.net,https://www.investoo.net,https://adminhnmadmin.investoo.net
JWT_SECRET=06kYVvRTmqYGKsrZvGndRMoKnuXU8RIk-EDcRSDKxJKIdOLCh45WFnpSNditrZn4
JWT_EXPIRES_IN=1h
JWT_COOKIE_MAX_AGE=3600000
AUTH_VERIFICATION_TOKEN_TTL=3600
AUTH_OTP_TTL=300
AUTH_RESET_TOKEN_TTL=900
REDIS_HOST=localhost
REDIS_PORT=6379
DAILY_RETURNS_CRON=0 1 * * *
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=brisa.wolff46@ethereal.email
SMTP_PASS=ZE8pGnQAeSNF14FsXG
SMTP_SECURITY=STARTTLS
SMTP_TLS=STARTTLS
SMTP_FROM="Investoo Support <support@investoo.net>"
FRONTEND_URL=https://investoo.net/
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
ENVEOF

echo "  Installing backend dependencies..."
npm ci --silent

echo "  Building backend..."
npm run build

echo "  Running database migrations..."
npm run migration:run

echo "  Starting backend with PM2..."
pm2 delete investo-backend 2>/dev/null || true
pm2 start dist/src/main.js --name investo-backend
pm2 save

# -------------------------------------------------------
# PHASE 9: Frontend Build
# -------------------------------------------------------
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

# -------------------------------------------------------
# PHASE 10: Admin Panel Build
# -------------------------------------------------------
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

# -------------------------------------------------------
# PHASE 11: Nginx Configuration
# -------------------------------------------------------
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
nginx -t && systemctl reload nginx
echo "  Nginx configured and reloaded."

# -------------------------------------------------------
# PHASE 12: Firewall
# -------------------------------------------------------
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

# -------------------------------------------------------
# DONE
# -------------------------------------------------------
echo ""
echo "======================================================="
echo " SETUP COMPLETE!"
echo "======================================================="
echo ""
echo " PM2 Status:"
pm2 status
echo ""
echo " NEXT STEPS:"
echo " 1. Add Cloudflare Origin SSL cert to /etc/ssl/cloudflare/"
echo "    - investoo.net.pem   (certificate)"
echo "    - investoo.net.key   (private key)"
echo " 2. Then run: nginx -t && systemctl reload nginx"
echo " 3. Set DNS A records in Cloudflare to: 178.16.52.195"
echo " 4. Create first admin user: cd /var/www/investoo/wallet-system-backend && node dist/cli/create-admin.js"
echo ""
echo " URLS:"
echo "   https://investoo.net"
echo "   https://api.investoo.net/api/v1/health"
echo "   https://adminhnmadmin.investoo.net"
echo "======================================================="
