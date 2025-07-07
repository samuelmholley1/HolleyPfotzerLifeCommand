# Project Documentation Index

**⚠️ MONOREPO VERSION:** This is the official monorepo documentation. All web code is in `packages/web/`, and this is the single source of truth as of July 2025.

Welcome to the Life Command project documentation. This is your starting point for all onboarding, architecture, schema, and process protocols. Every new agent (AI or human) must begin here and follow the links below in order.

## Mandatory Reading for All New Agents (UPDATED FOR MONOREPO)
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md) — High-level vision, agent protocols, and links to all other docs  
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) — **Latest comprehensive audit, mandatory for all agents**
- [Onboarding Guide](ONBOARDING_GUIDE.md) — Step-by-step onboarding and handoff
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md) — System map, file mapping, and module relationships
- [Migration Protocols](MIGRATION_PROTOCOLS.md) — This document
- [Security Guide](SECURITY_GUIDE.md) — Security, RLS, and environment file handling
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

# Migration Protocols (MONOREPO VERSION)

## Yarn Berry Monorepo Migration
- **Status:** COMPLETE. This is now the single development repository.
- All web application code is in `packages/web/`
- Native code will be in `packages/native/` when implemented
- Use `yarn` commands from root, workspace-specific commands from within workspace directories

## WatermelonDB (Client-side Database)
- See [WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md) for details.
- Migrations are automatic at app startup. Bump schema version and add migration file in `lib/db/migrations/`.
- Schema definition: [`lib/db/schema.ts`](lib/db/schema.ts)

## Supabase (Server-side Database)
- All SQL migrations are in `supabase/migrations/`.
- For RLS and backend, see `/supabase/` and `DATABASE_SETUP_INSTRUCTIONS.md`.
- Types are auto-generated in [`packages/web/src/types/supabase.ts`](packages/web/src/types/supabase.ts)

## Testing Migrations
- E2E tests use client-side mocking (see [`packages/web/TESTING.md`](packages/web/TESTING.md))
- No server-side test mocks; all testing is client-side stateful mocking via Playwright

## General Protocol
- Always document protocol changes here and in the PROJECT_PLAYBOOK.md hub.
- For E2E/CI details, see [`packages/web/src/types/supabase.ts`](packages/web/src/types/supabase.ts) and the playbook.
- All changes must update OPEN_TASKS.md and log completed actions in COMPLETED_STEPS_LOG.md
