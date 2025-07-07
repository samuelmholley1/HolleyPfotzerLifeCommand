# Project Documentation Index

**⚠️ MONOREPO VERSION:** This is the official monorepo documentation. All web code is in `packages/web/`, and this is the single source of truth as of July 2025.

Welcome to the Life Command project documentation. This is your starting point for all onboarding, architecture, schema, and process protocols. Every new agent (AI or human) must begin here and follow the links below in order.

## Mandatory Reading for All New Agents (UPDATED FOR MONOREPO)
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md) — High-level vision, agent protocols, and links to all other docs  
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) — **Latest comprehensive audit, mandatory for all agents**
- [Onboarding Guide](ONBOARDING_GUIDE.md) — This document
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md) — System map, file mapping, and module relationships
- [Migration Protocols](MIGRATION_PROTOCOLS.md) — WatermelonDB, Supabase, and general migration steps
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

# Onboarding Guide

Welcome! Follow these steps to get started as a new agent or maintainer:

1. **CRITICAL:** Understand this is a Yarn Berry monorepo. All web code is in `packages/web/`.
2. Read `PROJECT_PLAYBOOK.md` (hub) and this guide for strategic context.
3. Review the [Architecture Overview](ARCHITECTURE_OVERVIEW.md) for file mapping and monorepo structure.
4. Check [`packages/web/TESTING.md`](packages/web/TESTING.md) for E2E testing and code quality protocols.
5. Review the [Red Team Review Findings](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) for current project status and strategic recommendations.
6. Follow [Migration Protocols](MIGRATION_PROTOCOLS.md) for any DB or schema changes.
7. Review [Security Guide](SECURITY_GUIDE.md) for environment and RLS protocols.
8. Check [OPEN_TASKS.md](OPEN_TASKS.md) for current priorities. Log all actions in [COMPLETED_STEPS_LOG.md](COMPLETED_STEPS_LOG.md).
9. For WatermelonDB migration details, see [WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md).

## Key Monorepo Commands
```bash
# Navigate to web workspace
cd packages/web

# Install dependencies (from root)
yarn install

# Run development server
yarn dev

# Run E2E tests
yarn test:e2e

# Build for production
yarn build
```

If you are unsure, ask in the logs or consult the relevant doc.
