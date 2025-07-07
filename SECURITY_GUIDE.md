# Project Documentation Index

**⚠️ MONOREPO VERSION:** This is the official monorepo documentation. All web code is in `packages/web/`, and this is the single source of truth as of July 2025.

Welcome to the Life Command project documentation. This is your starting point for all onboarding, architecture, schema, and process protocols. Every new agent (AI or human) must begin here and follow the links below in order.

## Mandatory Reading for All New Agents (UPDATED FOR MONOREPO)
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md) — High-level vision, agent protocols, and links to all other docs  
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) — **Latest comprehensive audit, mandatory for all agents**
- [Onboarding Guide](ONBOARDING_GUIDE.md) — Step-by-step onboarding and handoff
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md) — System map, file mapping, and module relationships
- [Migration Protocols](MIGRATION_PROTOCOLS.md) — WatermelonDB, Supabase, and general migration steps
- [Security Guide](SECURITY_GUIDE.md) — This document
- [Open Tasks](OPEN_TASKS.md) — Current priorities and next steps
- [Completed Steps Log](COMPLETED_STEPS_LOG.md) — Audit log of all actions and decisions
- [Manual vs. Automatic WatermelonDB Migration](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md)

## Schema & Types (MONOREPO PATHS)
- WatermelonDB schema: [`lib/db/schema.ts`](lib/db/schema.ts)
- Supabase types: [`packages/web/src/types/supabase.ts`](packages/web/src/types/supabase.ts)
- Database snapshots: `DATABASE_SNAPSHOT_*.sql`
- Web testing docs: [`packages/web/TESTING.md`](packages/web/TESTING.md)

---

> **IMPORTANT:** This project has transitioned to a Yarn Berry monorepo. All web application code is in `packages/web/`. Update all references and onboarding accordingly. The main repo should be considered deprecated.

---

# Security Guide (MONOREPO VERSION)

- `.env` and secrets must never be committed. See project root for canonical `.env` and `.gitignore`.
- RLS and security protocols are in `/supabase/` and `DATABASE_SETUP_INSTRUCTIONS.md`.
- For red team and audit, see `RED_TEAM_CRITICAL_SECURITY_AUDIT.md`.
- Restore `.gitignore` before any commit if renamed.
- For onboarding, see the playbook and this guide.
- All security changes must be logged in COMPLETED_STEPS_LOG.md and referenced in OPEN_TASKS.md.
- **Yarn Berry monorepo:** All security protocols apply to `packages/web/` and any future workspaces.
