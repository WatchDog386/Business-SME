#!/usr/bin/env bash
# Update the server to the latest code. Run it for every release:
#   cd /opt/business-sme && bash deploy/deploy.sh            # the branch the server is on
#   cd /opt/business-sme && bash deploy/deploy.sh <branch>   # a named branch
# Phones and browsers move to the new release by themselves within two minutes.
set -euo pipefail
cd "$(dirname "$0")/.."
BRANCH="${1:-}"

echo "==> Backing up the database"
sudo -u postgres pg_dump -Fc kenya_sme > "$HOME/before-update.dump"

echo "==> Getting the code"
if [ -n "$BRANCH" ]; then git pull --ff-only origin "$BRANCH"; else git pull --ff-only; fi

echo "==> Installing and building"
npm ci
npm run build

echo "==> Restarting the API"
sudo systemctl restart business-sme

echo "==> Waiting for the API"
ok=""
for _ in $(seq 1 30); do
  # Any answer at all (401 without a session) means the API is up
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4100/api/v1/auth/me || true)"
  if [ "$code" != "000" ]; then ok=1; break; fi
  sleep 2
done
if [ -z "$ok" ]; then
  echo "!!  The API did not start. Last log lines:" >&2
  sudo journalctl -u business-sme -n 60 --no-pager >&2
  exit 1
fi

BUILD="$(sed -n 's/.*"build":"\([^"]*\)".*/\1/p' frontend/dist/version.json)"
echo "==> Live: release $BUILD"
echo "    The sign-in page shows \"Version $BUILD\" on a phone or browser that has the update."
