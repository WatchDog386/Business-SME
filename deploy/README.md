# Hosting

Everything runs on the company server (Proxmox VM 105) at
**https://sme.optimaswifi.co.ke**. There is no Vercel, Render or Supabase.

| Part | Where |
| --- | --- |
| Code | `/opt/business-sme` (a clone of this repository) |
| Web app | `frontend/dist`, served by Nginx (site `business-sme`) |
| API | NestJS on `127.0.0.1:4100`, systemd service `business-sme`, proxied at `/api` |
| Database | PostgreSQL on the same VM, database `kenya_sme` |
| Settings | `backend/.env` (see `env.production.example`) |
| Android app | Opens https://sme.optimaswifi.co.ke (`frontend/capacitor.config.ts`) |

## Updating the server

After changes are pushed, on the server:

```bash
cd /opt/business-sme && bash deploy/deploy.sh
```

This backs up the database, pulls, installs, builds the web app and API,
restarts the API and waits until it answers. Add a branch name to deploy a
branch other than the one the server is on.

### How the update reaches phones and browsers

The build writes its release id to `frontend/dist/version.json` and into the
app itself. Every open or installed app compares the two on start, whenever it
comes back to the front, and every two minutes:

- nobody signed in, or the app only just opened: it reloads into the new
  release by itself;
- someone is working: a "New version ready" pill appears and one tap switches,
  so nothing being typed is lost.

The service worker keeps no copy of the app on the device, so there is no old
release to fall back to. The sign-in page shows the release ("Version abc1234")
for checking which one a device is on.

## Checking it

```bash
sudo systemctl status business-sme      # API running?
sudo journalctl -u business-sme -n 100  # API logs
sudo nginx -t && sudo systemctl reload nginx
```
