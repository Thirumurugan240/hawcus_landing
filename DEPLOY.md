# Deploying Hawcus to the VPS

Target: `hawcus.com` on the existing VPS. The old site there is a static HTML
site served directly by the web server. This one is a Node application with a
Postgres database, so the web server becomes a reverse proxy in front of it.

Run everything below **on the server**, as root or with `sudo`.

---

## 0. Back up the old site first

The site currently at `hawcus.com` has blog articles that are almost certainly
indexed by Google. Do not delete anything until this backup exists and you have
copied it somewhere off the server.

```bash
mkdir -p /root/backups
tar -czf /root/backups/hawcus-old-$(date +%F).tar.gz /var/www/hawcus.com 2>/dev/null \
  || tar -czf /root/backups/hawcus-old-$(date +%F).tar.gz /usr/share/nginx/html
cp -r /etc/nginx/sites-available /root/backups/nginx-sites-$(date +%F)
ls -lh /root/backups/
```

Adjust the paths if the old site lives somewhere else. Find it with:

```bash
grep -R "root " /etc/nginx/sites-enabled/
```

---

## 1. Install what the app needs

```bash
apt update
apt install -y curl git nginx

# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v          # expect v22.x

# Docker, for Postgres
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

---

## 2. Get the code

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Thirumurugan240/hawcus_landing.git hawcus
cd hawcus
npm ci --omit=dev
```

---

## 3. Create the secrets file

`.env` is deliberately not in the repository. Create it on the server:

```bash
cd /var/www/hawcus
cat > .env <<'EOF'
PORT=8080
SITE_ORIGIN=https://hawcus.com

PGHOST=localhost
PGPORT=5433
PGUSER=hawcus
PGDATABASE=hawcus
PGPASSWORD=CHANGE_ME_STRONG_DB_PASSWORD

SESSION_SECRET=CHANGE_ME_RUN_THE_COMMAND_BELOW
SESSION_HOURS=12

ADMIN_EMAIL=admin@hawcus.com
ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=hello@hawcus.com
SMTP_PASS=CHANGE_ME_GMAIL_APP_PASSWORD
LEAD_TO=hello@hawcus.com
EOF

chmod 600 .env
openssl rand -hex 32      # paste this as SESSION_SECRET
```

Then edit `.env` and replace every `CHANGE_ME` value. The same
`PGPASSWORD` must be set in `docker-compose.yml`.

---

## 4. Start Postgres and seed

```bash
cd /var/www/hawcus
docker compose up -d
sleep 10
docker compose ps          # expect healthy
npm run seed               # creates the admin user and imports the articles
```

---

## 5. Run the app as a service

```bash
cat > /etc/systemd/system/hawcus.service <<'EOF'
[Unit]
Description=Hawcus website
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/var/www/hawcus
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now hawcus
systemctl status hawcus --no-pager
curl -I http://127.0.0.1:8080/      # expect 200
```

---

## 6. Point nginx at it

This is the step that switches hawcus.com from the old site to this one.

```bash
# take the old site out of service
rm -f /etc/nginx/sites-enabled/hawcus.com /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/hawcus.com <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name hawcus.com www.hawcus.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 5m;   # author picture uploads
}
EOF

ln -sf /etc/nginx/sites-available/hawcus.com /etc/nginx/sites-enabled/hawcus.com
nginx -t && systemctl reload nginx
```

---

## 7. HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d hawcus.com -d www.hawcus.com
```

Certbot rewrites the nginx config to serve TLS and redirect HTTP.

---

## 8. Check it

```bash
curl -I https://hawcus.com/
curl -s https://hawcus.com/sitemap.xml | head
systemctl status hawcus --no-pager
```

Then in a browser: the homepage, `/pricing.html`, `/book-a-demo.html`, `/blog/`,
and sign in at `/admin`. Submit the demo form once and confirm the email arrives
at hello@hawcus.com.

---

## 9. Remove the old site

**Only after everything above works**, and only once you have the backup from
step 0 stored somewhere other than this server:

```bash
rm -rf /var/www/hawcus.com          # or wherever the old files were
```

---

## Updating later

```bash
cd /var/www/hawcus
git pull
npm ci --omit=dev
systemctl restart hawcus
```

## Redirects worth adding

The old site had pages this one does not. Without redirects, every link and
search result pointing at them will 404. Add these inside the nginx `server`
block, mapping each old URL to the closest new one:

```nginx
location = /about-us.html      { return 301 /; }
location = /contact.html       { return 301 /book-a-demo.html; }
location = /privacy-policy.html { return 301 /privacy.html; }
location = /refund-policy.html { return 301 /terms.html; }
```

The six old blog articles have no equivalent here. Either port their content
into the new blog through `/admin`, or redirect them to `/blog/`.
