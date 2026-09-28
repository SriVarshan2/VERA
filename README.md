<p align="center">
  <img src="assets/hero.svg" alt="VERA Hero">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon&logoColor=black" alt="Neon">
  <img src="https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
</p>

> **VERA** is a self-hosted, event-sourced hackathon submission and judging platform designed to eliminate bias and produce mathematically defensible ranks.
> 
> 🔴 **Live Demo:** [https://vera-three-self.vercel.app](https://vera-three-self.vercel.app)

## 🚀 Quick Links
- [How Scoring Works](#-how-scoring-works)
- [Quick Start](#-quick-start)
- [Deploy to Vercel + Neon](#-deploy-to-vercel--neon)
- [Role Isolation Matrix](#-role-isolation--authorization-matrix)
- [Demo Accounts](#-demo-accounts)

---

## ✨ Highlights

| Feature | Description |
| :--- | :--- |
| **Event-sourced Scoring** | All score evaluations are recorded to an append-only ledger for complete auditability. |
| **Variance Detection** | Automatically flags judges who give everything the same score (low variance / flatlining). |
| **Fatigue Detection** | Detects and flags when a judge rapidly submits evaluations without adequate review time. |
| **Confidence Weighting** | Anomalous or biased evaluations are mathematically down-weighted dynamically. |
| **Explain This Rank** | Exposes a fully defensible, step-by-step mathematical proof for every project's final rank. |
| **Server-side Role Isolation** | Hard boundaries enforced on the server. Judges can only access their assigned projects. |
| **1-Click Judge Assignment** | Round-robin load balancing of submissions to judges with a single click. |
| **CSV Export** | Export the entire event leaderboard, scores, and metadata with one click. |

---

## 🧠 How Scoring Works

<p align="center">
  <img src="assets/pipeline.svg" alt="VERA Pipeline">
</p>

When judges submit their raw evaluations, VERA processes them through a rigorous calibration engine to normalize the data and eliminate human bias.

```mermaid
graph TD
    A[Raw Judge Scores] --> B[Append-only Event Log]
    B --> C{Detect Bias & Fatigue}
    C -->|Flagged| D[Downweight Confidence]
    C -->|Normal| E[100% Weight]
    D --> F[Calculate Normalized Score]
    E --> F
    F --> G[Generate Rank & Mathematical Proof]
```

---

## ⚡ Quick Start

### Option A — npm (Local Development)

```bash
npm install
npm run setup   # generates Prisma client, pushes schema, seeds demo data
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Option B — Docker (Offline Evaluation)

```bash
docker compose up
```
The entrypoint script pushes the database schema and seeds demo data on first boot. Open [http://localhost:3000](http://localhost:3000).

### ⚙️ Environment Variables

Create a `.env` file at the root of the repository:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
NEXTAUTH_SECRET="vera-super-secret-local-key-2026"
NEXTAUTH_URL="http://localhost:3000"
```

### 🔧 Troubleshooting

| Issue | Cause / Solution |
| :--- | :--- |
| **500 Internal Server Error** | Missing or incorrect `DATABASE_URL` / `NEXTAUTH_SECRET`. Ensure `.env` is correct. |
| **Stale pages / weird UI bugs** | Corrupted `.next` cache. Run `rm -rf .next` and restart the server. |
| **Prisma client errors** | Schema changed or client missing. Run `npx prisma generate`. |
| **Port 3000 is busy** | Run `lsof -ti:3000 \| xargs kill -9` to free the port. |
| **Invalid login credentials** | Database might be empty. Run `npm run setup` (or `npx tsx prisma/seed.ts`). |

---

## ☁️ Deploy to Vercel + Neon

VERA is designed to be easily deployed to Vercel with a Neon Serverless Postgres database.

1. Create a free **PostgreSQL** database on [Neon](https://neon.tech).
2. Install the Vercel CLI: `npm i -g vercel`
3. Log in to Vercel: `vercel login`
4. Link your project: `vercel link`
5. Add your environment variables:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```
6. Deploy to production:
   ```bash
   vercel --prod
   ```

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Your Neon PostgreSQL connection string. |
| `NEXTAUTH_SECRET` | A secure randomly generated string for JWT encryption. |
| `NEXTAUTH_URL` | The production URL of your Vercel deployment. |

---

## 👥 Role Isolation & Authorization Matrix

Server-side role isolation is enforced in **every single API route** handler.

| Role | Access Permissions |
| :--- | :--- |
| 👁️ **`visitor`** | Public submission gallery, view project details, view "Explain This Rank" mathematical proofs. |
| 🚀 **`participant`** | Create team, join team via 6-character invite code, submit & edit project until event deadline. |
| ⚖️ **`judge`** | Access **ONLY** assigned submissions. Direct API calls attempting to view another judge's scores return `403 Forbidden`. |
| 📋 **`organizer`** | Create events, set tracks & rubric weights, dispatch 1-click round-robin judge assignments, monitor live judge variance/fatigue flags, trigger event recalibration, and export CSV reports. |
| 👑 **`admin`** | Full global read/write access to all events, submissions, scores, and append-only audit streams. |

---

## 🔑 Demo Accounts

Use the built-in **Role Switcher** in the top navigation bar or log in manually.

> [!WARNING]
> Change the default password before sharing a public link in production!

**Universal Password:** `password123`

| Account Type | Email |
| :--- | :--- |
| **Admin** | `admin@vera.eval` |
| **Organizer** | `organizer@vera.eval` |
| **Judge (Expert)** | `judge.sarah@vera.eval` |
| **Judge (Low Variance)** | `judge.marcus@vera.eval` |
| **Judge (Fatigue)** | `judge.elena@vera.eval` |
| **Participant** | `dev.alice@vera.eval` |
| **Visitor** | `visitor@vera.eval` |

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router), React 18 |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Styling** | Tailwind CSS |
| **Authentication**| NextAuth.js (Auth.js) |

## 📂 Project Structure

```text
VERA/
├── app/                  # Next.js App Router (Pages & API Routes)
├── assets/               # Animated SVG assets
├── components/           # Reusable React components
├── lib/                  # Core logic, Prisma client, and Auth
│   └── calibration.ts    # Mathematical scoring engine
├── prisma/               # Database schema and seed scripts
└── scripts/              # Validation and standalone tools
```

---

## ⚠️ Limitations & Roadmap

1. **Storage:** Demo images currently use static URLs or base64 data. Native S3 support is planned for the roadmap.
2. **Session Secret:** A local default secret is configured in `.env`. Replace `NEXTAUTH_SECRET` for production deployments.
3. **Advanced Auditing:** Future versions will export cryptographic proofs for ledger immutability verification.

---

<p align="center">
  <i>Engineered for mathematically defensible evaluations.</i><br/>
  <b>VERA</b> © 2026
</p>
