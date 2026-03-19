# Horizon 3DX — Project Delivery Platform

A production-ready client-facing project delivery platform built on the **3DX Framework**: Diagnose · Design · Deploy · Execute.

---

## Overview

Horizon 3DX is a multi-tenant project management platform designed for delivery teams and their clients. Internal Pod Leads manage projects end-to-end; clients log in to a clean portal and see exactly what they need — current status, phase progress, timelines, required actions, and completed work.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js v5 (JWT, Credentials) |
| Gantt | Custom SVG/HTML (no library dependency) |

---

## Features

### Authentication & Roles
- **Admin** — Full access to all clients, projects, and system data
- **Pod Lead** — Create/manage projects and timelines
- **Client** — Read-only portal showing only their own projects

### Project Management
- Full CRUD for clients and projects
- 4-phase project model: Diagnose → Design → Deploy → Execute
- Per-phase tasks checklist, deliverables, client dependencies, internal/client notes
- Phase status tracking: Not Started / In Progress / Blocked / Complete
- Overall project progress tracking

### Dynamic Timeline Rescheduling
- When a phase is delayed, downstream phases automatically shift forward
- Supports manual date overrides per phase
- Change Request log records every timeline adjustment with reason, author, impacted phases, and new projected completion

### Gantt Chart
- Visual timeline showing all projects and their phase breakdowns
- Today marker, planned vs. actual bars
- Phase color-coded by type (Diagnose=purple, Design=blue, Deploy=orange, Execute=green)

### Dashboards
- **Internal**: Stats (active, completed, at risk, on hold), recent projects, upcoming deadlines, recent updates
- **Client**: Welcome banner, active projects, action items required from client, completed archive, Gantt timeline

### Client Portal
- Clean, simple interface — no technical jargon
- Shows only the client's own projects
- Highlights what is needed from the client (blocking items)
- Update feed showing all project communications

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Clone and install

```bash
git clone <repo-url>
cd 3DX-Framework
npm install
```

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/horizon3dx"
NEXTAUTH_SECRET="generate-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
npm run db:push       # Push schema to database
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed demo data
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@horizon3dx.com | admin123 |
| Pod Lead | sarah@horizon3dx.com | pod123 |
| Pod Lead | marcus@horizon3dx.com | pod123 |
| Client (TechVision) | james@techvision.com | client123 |
| Client (GreenLeaf) | lisa@greenleaf.com | client123 |
| Client (NexaRetail) | david@nexaretail.com | client123 |

---

## Project Structure

```
src/
├── app/
│   ├── admin/               # Internal admin pages
│   │   ├── page.tsx         # Admin dashboard
│   │   ├── projects/        # Project list, new project, detail
│   │   ├── clients/         # Client list + add client
│   │   └── timeline/        # Full Gantt view
│   ├── client/              # Client portal pages
│   │   ├── page.tsx         # Client dashboard
│   │   ├── projects/        # Project list + detail
│   │   ├── timeline/        # Client Gantt view
│   │   └── updates/         # Feed of all updates
│   ├── login/               # Auth page
│   └── api/                 # REST API routes
│       ├── auth/            # NextAuth handlers
│       ├── clients/         # Client CRUD
│       ├── projects/        # Project CRUD + sub-routes
│       │   └── [id]/
│       │       ├── phases/          # Phase editing + rescheduling
│       │       ├── comments/        # Add comments/updates
│       │       └── change-requests/ # Log change requests
│       ├── phases/[id]/tasks/       # Task management
│       ├── dashboard/               # Dashboard stats
│       └── users/                   # Internal user list
├── components/
│   ├── layout/              # Sidebar, AppShell (auth guard)
│   ├── ui/                  # Badge, Card, StatCard, ProgressBar
│   ├── projects/            # ProjectCard, ProjectDetailView
│   └── gantt/               # GanttChart
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── db.ts                # Prisma client singleton
│   └── utils.ts             # Helpers + rescheduling engine
└── types/
    └── next-auth.d.ts       # Session type extensions

prisma/
├── schema.prisma            # Full data model
└── seed.ts                  # Demo data (5 projects, 3 clients, 6 users)
```

---

## Database Schema

### Entities
- **User** — name, email, hashed password, role (ADMIN / POD_LEAD / CLIENT)
- **Client** — company, contact info, linked User for portal access
- **Project** — name, description, status, priority, progress, dates, phases
- **Phase** — type (4 types), dates (planned + actual), status, tasks, notes (internal + client)
- **Task** — checklist item per phase, completion state
- **ChangeRequest** — audit trail for all timeline adjustments
- **Comment** — project updates, flagged internal vs client-visible

---

## Rescheduling Engine

Located in `src/lib/utils.ts` → `computeShiftedDates()`.

When a phase is extended by N days, all downstream phases (sorted by order) that don't have `isManualOverride=true` are shifted forward by N days. The project's `targetEndDate` updates automatically.

Also exposed via the Change Request API: creating a change request with `daysAdded` and a `triggerPhaseId` auto-cascades to downstream phases.

---

## Production Deployment

1. Set environment variables (see `.env.example`)
2. Run `npm run db:push && npm run db:generate`
3. Run `npm run build`
4. Start with `npm start` or deploy to Vercel/Railway/Render

**Recommended**: Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for managed PostgreSQL.

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run db:push      # Sync schema to DB (no migration files)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:seed      # Load demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
```
