# Bitácora

> Save first. Understand later.

Bitácora is an open-source, self-hostable knowledge harbor. Drop links, jot notes, and let the system quietly map the connections between your ideas. No AI, no lock-in — just a calm place where everything you save finds its place.

## What is Bitácora?

A personal knowledge tool designed around a single flow: capture → organize → discover. You save things — links, thoughts, fragments — and Bitácora extracts metadata, assigns keywords, and builds a relationship graph automatically. Over time, patterns emerge without effort.

## Features

- **Quick Capture** — paste a URL or type a note; metadata is extracted instantly
- **Automatic Graph** — edges between related blocks are generated using rule-based scoring
- **Channels & Collections** — organize content at your own pace
- **Tags & Keywords** — auto-extracted keywords plus manual tags
- **Graph Visualization** — explore connections visually with force-directed layout
- **Full-text Search** — find anything by title, content, or keywords
- **PWA-ready** — installable on mobile and desktop
- **Single-user, self-hosted** — your data stays yours

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Turso (libSQL) |
| ORM | Drizzle |
| Auth | Cookie-based sessions (bcrypt) |
| Visualization | react-force-graph-2d |
| Testing | Vitest + fast-check |

## Quick Start

```bash
# Clone
git clone https://github.com/your-username/bitacora.git
cd bitacora

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values (see below)

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials from your `.env.local`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Turso database connection URL | Yes |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Yes |
| `ADMIN_EMAIL` | Email for the admin user (created on first run) | Yes |
| `ADMIN_PASSWORD` | Password for the admin user | Yes |
| `SESSION_SECRET` | Secret for signing session cookies (`openssl rand -base64 32`) | Yes |

## Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard
4. Deploy — Vercel handles the build automatically

Turso's free tier works well for single-user deployments.

## License

MIT
