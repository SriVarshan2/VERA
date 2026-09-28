# VERA — Verifiable Evaluation & Ranking Assistant

**VERA** is a self-hosted, offline-first hackathon submission and judging platform built with Next.js 14 (App Router), TypeScript, Prisma, and SQLite. 

Designed for local execution with zero cloud dependencies, VERA introduces an **append-only event-sourced scoring engine** that automatically detects judge variance bias, flags judge fatigue, applies confidence weights, and exposes a fully defensible, step-by-step **"Explain This Rank"** proof for every project.

---

## Running VERA

### Option A — Docker (recommended, matches offline evaluation)

```bash
docker compose up
```

The entrypoint script automatically pushes the database schema and seeds demo data on first boot. Open http://localhost:3000.

### Option B — npm (local development)

```bash
npm install
npm run setup   # generates Prisma client, pushes schema, seeds demo data
npm run dev
```

Open http://localhost:3000.

### Before running — quick checklist

1. Fresh state (if re-running after changes):
```bash
   # npm path
   rm -f prisma/dev.db && rm -rf node_modules && npm install

   # Docker path
   docker compose down -v
```

2. `.env` file must exist at the repo root with the required variables:
   - `DATABASE_URL="file:./dev.db"`
   - `NEXTAUTH_SECRET="vera-super-secret-local-key-2026"`
   - `NEXTAUTH_URL="http://localhost:3000"`

3. Port 3000 free — check with `lsof -i :3000` if the app won't start.

4. Node 18.17+ required — check with `node -v`.

---

## 👥 Role Isolation & Authorization Matrix

Server-side role isolation is enforced in **every single API route** handler (not just hidden in the UI):

| Role | Access Permissions |
| :--- | :--- |
| **`visitor`** | Public submission gallery, view project details, view "Explain This Rank" mathematical proofs. |
| **`participant`** | Create team, join team via 6-character invite code, submit & edit project until event deadline. *(Server rejects writes after deadline).* |
| **`judge`** | Access **ONLY** assigned submissions (`/api/judge/assignments` & `/api/judge/scores`). Direct API calls attempting to view another judge's scores or assignments return `403 Forbidden`. |
| **`organizer`** | Create events, set tracks & rubric weights, dispatch 1-click round-robin judge assignments, monitor live judge variance/fatigue flags, trigger event recalibration, and export CSV reports. |
| **`admin`** | Full global read/write access to all events, submissions, scores, and append-only audit streams. |

---

## 🔑 Demo Accounts (Quick Switcher)

Use the built-in **Role Switcher** in the top navigation bar or log in with password `password123`:

- **Admin:** `admin@vera.eval`
- **Organizer:** `organizer@vera.eval`
- **Judge (Dr. Sarah Chen):** `judge.sarah@vera.eval`
- **Judge (Marcus Vance - Low Variance Demo):** `judge.marcus@vera.eval`
- **Judge (Elena Rostova - Fatigue Demo):** `judge.elena@vera.eval`
- **Participant:** `dev.alice@vera.eval`
- **Visitor:** `visitor@vera.eval`

---

## 🛠️ Tech Stack & Constraints

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS (Modern dark mode, glassmorphism, responsive design)
- **Database & ORM:** Prisma ORM with file-based local SQLite (`prisma/dev.db`)
- **Authentication:** Auth.js / NextAuth (Credentials provider + JWT session strategy)
- **Zero External Dependencies:** No Docker, no external OAuth, no cloud databases, no remote API calls.

---

## ⚠️ Current Limitations & Roadmap

1. **Local SQLite File:** Designed for single-machine deployment or local network hosting. For multi-node distributed setups, SQLite WAL mode or local sync can be enabled.
2. **File Storage:** Demo images use static URLs or base64 data. Local uploads are stored relative to public asset folders.
3. **Session Secret:** Local default secret configured in `.env`. Replace `NEXTAUTH_SECRET` for production deployments.
