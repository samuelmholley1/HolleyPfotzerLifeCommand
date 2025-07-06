# Project Documentation Index

> For Yarn, lockfile, and CI/CD troubleshooting, see [TOOLING.md](TOOLING.md). Not mandatory for onboarding, but essential for anyone updating dependencies, fixing CI, or handling lockfile errors.

> NOTE: As of July 2025, this project is a Yarn Berry monorepo. All web code is in packages/web/, all native code in packages/native/. Update all references and onboarding accordingly.

## Monorepo & Dependency Management (2025-07)
- **Peer-dependency alignment:**
  - Native workspace (`packages/native`) must use `react@^18.2.0` and `react-dom@^18.2.0` to match `react-native@0.74.x` requirements. Do not use React 19+ until officially supported by React Native.
  - Web workspace (`packages/web`) may use React 18 or 19 as needed, but keep versions isolated per workspace.
  - Pin `yargs` to `^17.x` for Node 18 compatibility, or upgrade Node to 20+ in CI.
- **Lockfile policy:**
  - Only `yarn.lock` is tracked. All `package-lock.json` files must be deleted and ignored.
- **Node version for CI:**
  - All GitHub Actions CI must use `node-version: '20.x'` in setup-node.
- **ESLint/jest config:**
  - Use `eslint-plugin-jest` in web for test linting. Extend `plugin:jest/recommended` in `.eslintrc.json`.

Welcome to the Life Command project documentation. This is your starting point for all onboarding, architecture, schema, and process protocols. Every new agent (AI or human) must begin here and follow the links below in order.

## Mandatory Reading for All New Agents
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md) — High-level vision, agent protocols, and links to all other docs
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) — **Latest comprehensive audit, mandatory for all agents**
- [Onboarding Guide](ONBOARDING_GUIDE.md) — Step-by-step onboarding and handoff
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md) — System map, file mapping, and module relationships
- [Migration Protocols](MIGRATION_PROTOCOLS.md) — WatermelonDB, Supabase, and general migration steps
- [Security Guide](SECURITY_GUIDE.md) — Security, RLS, and environment file handling
- [Open Tasks](OPEN_TASKS.md) — Current priorities and next steps
- [Completed Steps Log](COMPLETED_STEPS_LOG.md) — Audit log of all actions and decisions
- [Manual vs. Automatic WatermelonDB Migration](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md)

## Schema & Types
- WatermelonDB schema: [`lib/db/schema.ts`](lib/db/schema.ts)
- Supabase types: [`src/types/supabase.ts`](src/types/supabase.ts)
- Database snapshots: `DATABASE_SNAPSHOT_*.sql`

---

> All process docs are linked above. Read in order for full context. For any protocol or process, see the dedicated doc. This index is included at the top of every major process file for agent onboarding and navigation.

---

# PROJECT PLAYBOOK: Holley-Pfotzer Life Command App

This is the high-level entry point for all project documentation, onboarding, and protocols. Use the Table of Contents below to quickly find what you need. Each section links to a focused, dedicated document.

## Table of Contents
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md)
- [Quick Start & Agent Checklist](ONBOARDING_GUIDE.md)
- [Architecture Overview & File Mapping](ARCHITECTURE_OVERVIEW.md)
- [Migration Protocols](MIGRATION_PROTOCOLS.md)
- [Security & Environment Protocols](SECURITY_GUIDE.md)
- [Open Tasks](OPEN_TASKS.md)
- [Completed Steps Log](COMPLETED_STEPS_LOG.md)
- [Manual vs. Automatic WatermelonDB Migration](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md)

---

## Philosophy & Project Vision

The Life Command App is designed for ADHD/trauma-informed, user-centered collaboration and productivity. All protocols, roles, and next steps are documented in the linked docs above. For any new process, add a new doc and link it here.

## Key Principles (Summary)
- Rapid MVP delivery, robust/flexible architecture, minimal user effort, and avoidance of debugging loops.
- Agent autonomy: agents act on all pre-existing tasks and protocols without repeated human confirmation.
- All logs, protocols, and next steps are kept concise, actionable, and up-to-date in the linked docs.

## Where to Find Details
- **Onboarding, agent protocols, and handoff:** See [ONBOARDING_GUIDE.md](ONBOARDING_GUIDE.md)
- **Architecture, file mapping, and system structure:** See [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)
- **Migration protocols (DB, WatermelonDB, Supabase):** See [MIGRATION_PROTOCOLS.md](MIGRATION_PROTOCOLS.md)
- **Security, RLS, and environment file handling:** See [SECURITY_GUIDE.md](SECURITY_GUIDE.md)
- **Open tasks and priorities:** See [OPEN_TASKS.md](OPEN_TASKS.md)
- **Completed steps and audit log:** See [COMPLETED_STEPS_LOG.md](COMPLETED_STEPS_LOG.md)
- **Manual vs. automatic migration:** See [WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md)

## For Schema, Types, and Snapshots
- WatermelonDB schema: `lib/db/schema.ts`
- Supabase types: `src/types/supabase.ts`
- Database snapshots: `DATABASE_SNAPSHOT_*.sql`

---

> All detailed logs, protocols, and checklists have been moved to their dedicated files. This playbook is now a hub for navigation and high-level context only. For any protocol or process, see the linked doc above.