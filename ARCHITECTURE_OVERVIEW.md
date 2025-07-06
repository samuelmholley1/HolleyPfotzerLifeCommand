# Project Documentation Index

Welcome to the Life Command project documentation. This is your starting point for all onboarding, architecture, schema, and process protocols. Every new agent (AI or human) must begin here and follow the links below in order.

## Mandatory Reading for All New Agents
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md)
- [Red Team Review Findings (2025-07-06)](RED_TEAM_REVIEW_FINDINGS_2025-07-06.md) — **Latest comprehensive audit, mandatory for all agents**
- [Onboarding Guide](ONBOARDING_GUIDE.md)
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Migration Protocols](MIGRATION_PROTOCOLS.md)
- [Security Guide](SECURITY_GUIDE.md)
- [Open Tasks](OPEN_TASKS.md)
- [Completed Steps Log](COMPLETED_STEPS_LOG.md)
- [Manual vs. Automatic WatermelonDB Migration](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md)

## Schema & Types
- WatermelonDB schema: [`lib/db/schema.ts`](lib/db/schema.ts)
- Supabase types: [`src/types/supabase.ts`](src/types/supabase.ts)
- Database snapshots: `DATABASE_SNAPSHOT_*.sql`

---

> All process docs are linked above. Read in order for full context. For any protocol or process, see the dedicated doc. This index is included at the top of every major process file for agent onboarding and navigation.

---

# Architecture Overview & File Mapping

- All core modules, file locations, and system relationships are mapped here.
- For schema, see `lib/db/schema.ts`.
- For Supabase types, see `src/types/supabase.ts`.
- For UI, see `components/`.
- For business logic, see `services/`.
- For custom hooks, see `hooks/`.
- For types, see `types/`.
- For DB utilities, see `lib/db/`.
- For environment and config, see project root.

See the playbook for canonical mapping and update this file with any new modules or major changes.
