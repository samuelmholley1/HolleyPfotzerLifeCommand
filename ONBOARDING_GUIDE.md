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

# Onboarding Guide

Welcome! Follow these steps to get started as a new agent or maintainer:

1. Read `PROJECT_PLAYBOOK.md` (hub) and this guide.
2. Review the [Architecture Overview](ARCHITECTURE_OVERVIEW.md) for file mapping and system structure.
3. Follow [Migration Protocols](MIGRATION_PROTOCOLS.md) for any DB or schema changes.
4. Review [Security Guide](SECURITY_GUIDE.md) for environment and RLS protocols.
5. Check [OPEN_TASKS.md](OPEN_TASKS.md) for current priorities. Log all actions in [COMPLETED_STEPS_LOG.md](COMPLETED_STEPS_LOG.md).
6. For WatermelonDB migration details, see [WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md](WATERMELONDB_MIGRATION_MANUAL_VS_AUTOMATIC.md).

If you are unsure, ask in the logs or consult the relevant doc.
