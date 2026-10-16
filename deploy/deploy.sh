#!/usr/bin/env bash
#
# Kenya SME Platform - server bootstrap / deploy
#
# Run ON THE SERVER as root, from the cloned repo:
#   sudo bash deploy/deploy.sh
#
# Optional: pass the public hostname so TLS is requested automatically.
#   sudo bash deploy/deploy.sh app.example.co.ke
#
# Idempotent: safe to re-run after a `git pull`.

set -euo pipefail

APP_DIR=/opt/kenya-sme
DOMAIN="${1:-}"
API_PORT=4100
SERVICE=kenya-api
NODE_MAJOR=22

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!!!  %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mxxx  %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root: sudo bash deploy/deploy.sh"

# Resolve the repo root even if invoked from deploy/
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log "repo detected at $REPO_DIR"

########################################
log "1/9  system packages"
########################################
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg nginx git ufw rsync

########################################
log "2/9  swap guard (builds need headroom)"
########################################
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  warn "added 2G swap"
fi

########################################
log "3/9  Node.js ${NODE_MAJOR}"
########################################
if ! command -v node >/dev/null || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 20 ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi
node -v && npm -v

########################################
log "4/9  sync code to ${APP_DIR}"
########################################
mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'backend/data' \
  --exclude 'frontend/dist' \
  --exclude 'backend/dist' \
  --exclude '*.apk' \
  "$REPO_DIR"/ "$APP_DIR"/

# node_modules lives outside the code so rebuilds are cheap
if [[ -d "$REPO_DIR/node_modules" && ! -d "$APP_DIR/node_modules" ]]; then
  cp -al "$REPO_DIR/node_modules" "$APP_DIR/node_modules" 2>/dev/null \
    || cp -r "$REPO_DIR/node_modules" "$APP_DIR/node_modules"
fi

########################################
log "5/9  service user and backend environment"
########################################
if ! id -u kenya >/dev/null 2>&1; then
  useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin kenya
  log "created service user 'kenya'"
fi

if [[ ! -f "$APP_DIR/backend/.env" ]]; then
  if [[ -f "$APP_DIR/deploy/env.production.example" ]]; then
    cp "$APP_DIR/deploy/env.production.example" "$APP_DIR/backend/.env"
    warn "created backend/.env from template - EDIT IT, then re-run this script"
  else
    die "missing backend/.env and deploy/env.production.example"
  fi
fi
chmod 600 "$APP_DIR/backend/.env"

# Reproduce the exact failure the app hits at boot: a DATABASE_URL that
# Node's URL parser rejects (usually an unencoded '@' or '!' in the password).
if ! node -e '
  const fs = require("fs");
  const m = fs.readFileSync(process.argv[1], "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!m || !m[1].trim()) { console.error("DATABASE_URL is empty"); process.exit(1); }
  let u;
  try { u = new URL(m[1].trim()); } catch { console.error("DATABASE_URL is not a parseable URL"); process.exit(1); }
  if (!u.hostname || !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) {
    console.error("DATABASE_URL has no valid host");
    process.exit(1);
  }
  console.log("DATABASE_URL parses -> host " + u.hostname + ":" + (u.port || 5432));
' "$APP_DIR/backend/.env"; then
  die "fix DATABASE_URL: percent-encode reserved chars in the password (@ -> %40, ! -> %21, # -> %23) and add ?sslmode=require"
fi

grep -q '^DB_SSL=true' "$APP_DIR/backend/.env" \
  || warn "DB_SSL is not true - Supabase will reject the connection"

mkdir -p "$APP_DIR/backend/data"
chown -R kenya:kenya "$APP_DIR/backend"
# Frontend is served read-only by nginx.
chown -R root:root "$APP_DIR/frontend/dist" 2>/dev/null || true
chmod 755 /opt/kenya-sme /opt/kenya-sme/frontend /opt/kenya-sme/frontend/dist 2>/dev/null || true

########################################
log "6/9  install dependencies and build"
########################################
cd "$APP_DIR"
npm ci --no-audit --no-fund
npm run build
test -f "$APP_DIR/backend/dist/main.js" || die "backend build produced no dist/main.js"
test -f "$APP_DIR/frontend/dist/index.html" || die "frontend build produced no dist/index.html"
log "build ok"

########################################
log "7/9  systemd service"
########################################
install -m 644 "$APP_DIR/deploy/kenya-api.service" "/etc/systemd/system/${SERVICE}.service"
systemctl daemon-reload
systemctl enable --now "$SERVICE"
sleep 4
systemctl --no-pager --lines=20 status "$SERVICE" || true
curl -fsS "http://127.0.0.1:${API_PORT}/docs" >/dev/null \
  && log "API responding on 127.0.0.1:${API_PORT}" \
  || { warn "API not responding - check: journalctl -u ${SERVICE} -n 50"; exit 1; }

########################################
log "8/9  nginx"
########################################
install -m 644 "$APP_DIR/deploy/nginx/kenya.conf" /etc/nginx/sites-available/kenya
ln -sf /etc/nginx/sites-available/kenya /etc/nginx/sites-enabled/kenya
rm -f /etc/nginx/sites-enabled/default
# SPA + dist are read-only to nginx; backend needs no write access.
nginx -t && systemctl reload nginx

ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80/tcp  >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

########################################
log "9/9  TLS"
########################################
if [[ -n "$DOMAIN" ]]; then
  apt-get install -y -qq certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
    --redirect --register-unsafely-without-email || warn "certbot failed - run it manually"
  warn "set FRONTEND_URL and CORS_ORIGIN to https://$DOMAIN in backend/.env, then:"
  warn "  systemctl restart ${SERVICE}"
else
  warn "no domain given - skipping certbot. Re-run with: sudo bash deploy/deploy.sh your.domain"
fi

cat <<EOF

$(printf '\033[1;32m')DEPLOY COMPLETE$(printf '\033[0m')

  web  : http://<server-ip>${DOMAIN:+/}   (or https://${DOMAIN} if TLS was issued)
  api  : http://127.0.0.1:${API_PORT}/api/v1
  docs : http://127.0.0.1:${API_PORT}/docs

Next:
  1. Edit ${APP_DIR}/backend/.env  (DATABASE_URL, JWT_SECRET, FRONTEND_URL, CORS_ORIGIN)
  2. systemctl restart ${SERVICE}
  3. journalctl -u ${SERVICE} -f
  4. For the Android APK set frontend/.env:
       VITE_API_BASE_URL=https://${DOMAIN:-YOUR-DOMAIN}/api/v1

EOF