# SoftGlow

Beauty app where clients try makeup looks on their own photo and send them to
their makeup artist, who quotes, books and tracks costs.

| Part | Folder | Runs on |
|---|---|---|
| Mobile app (clients + artists) | `apps/mobile` | Expo Go on your phone |
| Admin dashboard | `apps/admin` | http://localhost:5174 |
| API (FastAPI + Postgres) | `apps/api` | http://localhost:8000 ([docs](http://localhost:8000/docs)) |

The database, API and admin run in **Docker**. The mobile app runs **directly on
your computer** with Expo (running Expo inside Docker is unreliable, so it's off
by default).

---

## 1. Install these first (once)

| Tool | Version | Check with |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | any recent | `docker compose version` |
| [Node.js](https://nodejs.org/) | **22** (20 also works) | `node -v` |
| pnpm | 11 | `pnpm -v` |
| [Expo Go](https://expo.dev/go) on your phone | latest from the App Store / Play Store (**Expo SDK 57**) | App Store / Play Store |

pnpm comes with Node; turn it on with:

```bash
corepack enable
```

> **The project uses Expo SDK 57.** Expo Go only opens projects built for its
> own SDK, and iPhones can only install the newest Expo Go. If Expo Go says the
> project is "incompatible", update Expo Go from the store. No Mac or simulator
> is needed: a phone with Expo Go is enough.

## 2. One-time setup

From the project folder:

```bash
cp apps/api/.env.example apps/api/.env
```

Open `apps/api/.env` and set `GEMINI_API_KEY` (get one at
https://aistudio.google.com/apikey). Everything else works as-is for local use.
Without the key the app runs, but AI previews fail.

Then install the JavaScript packages (needed for the mobile app):

```bash
pnpm install
```

## 3. Start everything

**a. Start Docker Desktop** and wait until it says it's running.

**b. Start the database, API and admin:**

```bash
docker compose up -d --build
```

The first build takes a few minutes. The API applies database migrations on
start. Check it's up (should print `{"status":"ok"}`):

```bash
curl http://localhost:8000/healthz
```

**c. Load demo accounts and products** (first time only, safe to re-run):

```bash
docker compose exec api python -m app.scripts.seed_demo
```

**d. Start the mobile app:**

```bash
pnpm --filter @softglow/mobile start
```

A QR code appears. **Your phone and computer must be on the same Wi-Fi.**
Scan the QR code with the iPhone Camera app (or the Expo Go app on Android).
The app finds the API automatically.

**e. Open the admin dashboard:** http://localhost:5174

## Demo accounts

All demo passwords are `softglow123`.

| Role | Email |
|---|---|
| Client | `client@softglow.demo` |
| Artist | `amara@softglow.demo` |
| Admin (dashboard only) | `admin@softglow.demo` |

Or sign up in the app as a client or artist. Admins can't sign up; create one with:

```bash
docker compose exec api python -m app.scripts.create_admin you@example.com "Your Name"
```

---

## If something doesn't work

### Docker

| Problem | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running. Open it and wait for it to finish starting. |
| `port is already allocated` / `address already in use` for **5433** | Another program uses that port. Create a file named `.env` in the project folder containing `DB_HOST_PORT=5434`, then run `docker compose up -d` again. (We deliberately don't use 5432, which a locally installed Postgres usually takes.) |
| Port **8000** or **5174** in use | Stop whatever uses it (often another project's Docker containers: `docker ps`), or stop this project's old containers with `docker compose down`. |
| API keeps restarting | Read its log: `docker compose logs api --tail 50`. Most often `apps/api/.env` is missing (step 2). |
| Sign-up or login gives a server error | Make sure you have the latest code, then rebuild: `docker compose up -d --build api`. |
| Want a completely fresh database | `docker compose down -v` (**deletes all data**), then step 3b and 3c again. |

### Expo / phone

| Problem | Fix |
|---|---|
| Phone says "Could not connect to the development server" | Phone and computer must be on the **same Wi-Fi**, with no VPN. Office or guest Wi-Fi often blocks devices from seeing each other: use a phone hotspot, or run `pnpm --filter @softglow/mobile start --tunnel` instead. |
| Mac/Windows firewall prompt | Allow **Node** to accept incoming connections. |
| App opens but says it can't reach SoftGlow / logins fail | The API isn't reachable from the phone. Check `curl http://localhost:8000/healthz` on the computer. If you used `--tunnel`, set `EXPO_PUBLIC_API_URL=http://<your computer's Wi-Fi IP>:8000/api/v1` in `apps/mobile/.env.local` and restart Expo. (Find the IP: Mac `ipconfig getifaddr en0`, Windows `ipconfig`.) |
| Stuck at "Bundling 99.9%" or strange red errors after pulling | Restart Expo with a clean cache: `pnpm --filter @softglow/mobile start --clear` |
| "Incompatible with this version of Expo Go" | Update Expo Go from the store (the project needs SDK 57). |
| `command not found: pnpm` | Run `corepack enable` (step 1). |
| Expo prints "packages should be updated for best compatibility" | Safe to ignore for testing. |

### Windows notes

- Run the commands in **PowerShell** or **Windows Terminal**. Use
  `copy apps\api\.env.example apps\api\.env` instead of `cp`.
- `curl` works in PowerShell 7+; otherwise open http://localhost:8000/healthz in a browser.
- Allow Node through Windows Defender Firewall when asked, or phones can't connect.

---

## Everyday commands

| What | Command |
|---|---|
| Stop everything (keeps data) | `docker compose down` |
| See what's running | `docker compose ps` |
| API logs | `docker compose logs -f api` |
| Rebuild after pulling new code | `docker compose up -d --build` |
| API tests | `cd apps/api && uv run pytest` |
| Typecheck all JS/TS | `pnpm typecheck` |

The database is reachable from your computer at `localhost:5433`
(user/password/db `softglow`), e.g. for TablePlus or `psql`.

## Project layout

```
apps/
  api/      FastAPI app (app/modules/<feature>), Alembic migrations, tests
  admin/    React + Vite admin dashboard
  mobile/   Expo (React Native) app — app/ = screens, src/ = logic
packages/   Shared design tokens, UI components and types
docker-compose.yml
```
