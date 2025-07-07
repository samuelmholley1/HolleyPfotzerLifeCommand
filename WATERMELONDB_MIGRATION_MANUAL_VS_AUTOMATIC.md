# WatermelonDB Migration Execution: Manual vs. Automatic (MONOREPO VERSION)

**Note:** This document is for reference only. The current protocol is automatic migration at app startup. If the team ever needs to revisit or change to manual migration, use this as a decision and design reference.

---

## Automatic Migration at App Startup (Current Protocol)

**Pros:**
- Zero manual steps: No CLI or script to run; migration is always applied when the app starts.
- Consistency: Ensures all users/devices are migrated as soon as they launch the updated app.
- No risk of forgetting: Developers and users can’t skip the migration step.
- Simplicity: No need to maintain or document extra scripts or commands.

**Cons:**
- Harder to debug migration errors: If a migration fails, the app may crash or misbehave at startup, and errors are only visible in logs.
- No dry-run: Can’t preview or test the migration in isolation before running it on real data.
- No rollback: If a migration is destructive and fails, recovery is more difficult.
- Less control: Can’t selectively apply migrations to certain environments or users.

---

## Manual Migration via CLI/Script

**Pros:**
- Explicit control: Developers can run, test, and debug migrations before deploying to users.
- Dry-run/testing: Easier to validate migration logic and catch issues before affecting real data.
- Rollback/backup: Can script backups or rollbacks as part of the migration process.
- Selective application: Can target specific environments or user groups.

**Cons:**
- Human error: Developers may forget to run the migration, leading to schema drift or runtime errors.
- Onboarding friction: New devs or CI/CD must learn and remember the extra step.
- Inconsistent state: If not all users/devices run the migration, data may become inconsistent.
- More maintenance: Need to maintain and document migration scripts and their usage.

---

**Summary:**
Automatic migrations at app startup are safer and simpler for most mobile/local-first apps, ensuring all users are always up to date. Manual migrations offer more control and safety for complex or destructive changes, but require more discipline and process.

---

**MONOREPO NOTE:** All migration protocols now apply to the Yarn Berry monorepo structure. See [MIGRATION_PROTOCOLS.md](MIGRATION_PROTOCOLS.md) for current process and file locations.
