# Testing Documentation

---

## SESSION SUMMARY (2025-07-06)

**Major Infrastructure Upgrades:**
- Implemented Supabase CLI for robust, version-controlled database schema management and migrations.
- Added database management scripts to the root `package.json` for migrations and local resets.
- Pulled the current schema from the live Supabase project and generated the initial migration.
- Consolidated all E2E and unit testing documentation, code quality automation, and migration instructions into this file (`TESTING.md`).
- Removed the now-redundant `E2E_TESTING_GUIDE.md` and updated all references across foundational docs.

**Documentation and Onboarding:**
- All onboarding orders, file mappings, and SOPs in `schema.ts` and `PROJECT_PLAYBOOK.md` now reference this file as the canonical source for E2E/unit testing and migration documentation.
- All links and references to E2E/testing/migration docs are up to date and correct.

**Best Practices:**
- Always use the documented Supabase CLI workflow for schema changes and migrations.
- Refer to this file for all testing, code quality, and database management protocols.

## Quick Start

To run the end-to-end (E2E) test suite:

```bash
yarn test:e2e
```

This command will execute all Playwright E2E tests in the project. Ensure your development server is running and all environment variables are set before running the tests.

## Architecture

The E2E testing infrastructure uses Playwright with a fully client-side mocking strategy. Early attempts at server-side mocking proved unreliable due to Next.js and Vercel edge runtime limitations. The final, robust solution uses Playwright's `page.route()` to intercept and mock API requests directly in the browser context. This approach ensures:

- Complete isolation from backend state
- Deterministic, fast, and reliable tests
- No dependency on server-side test hooks or network conditions

**All E2E tests now use client-side API mocking. Server-side mocks and `/api/e2e-mock` routes are deprecated and have been removed.**

### Criticisms / Improvements
- **Test Coverage:** Ensure your mocks handle all HTTP verbs (GET, POST, DELETE, PUT) that your UI might use, or tests may fail unexpectedly.
- **Reset State:** If you want each test to start with a clean slate, consider resetting mock state at the start of each test (see `mockTaskApi`).
- **Type Safety:** For production, consider typing mocks with your real `Task` type for better safety and maintainability.
- **Documentation:** This file is the canonical source for E2E mocking and testing protocols.

## How to Add a New Test

1. Create a new spec file in `packages/web/e2e/` (e.g., `new-feature.spec.ts`).
2. Import the `mockTaskApi` helper from `e2e/mocks/task-api-mock.ts`.
3. In your test's `beforeEach` block, call `mockTaskApi(page)` to set up the client-side API mocks.
4. Write your test following the pattern in `auth.spec.ts`.

All new tests should use the stateful client-side mock for consistency and reliability.

## Database Migrations

This project uses the [Supabase CLI](https://supabase.com/docs/guides/cli) for robust, version-controlled database schema management and migrations.

### Migration Workflow

- **Pull current schema from production:**
  ```bash
  yarn db:pull
  ```
  This command pulls the latest schema from the linked Supabase project and generates a migration if there are changes.

- **Create a new migration:**
  ```bash
  yarn db:new-migration <migration_name>
  ```
  This creates a new migration file in `supabase/migrations/`.

- **Apply migrations to local dev database:**
  ```bash
  yarn db:push
  ```
  This applies all pending migrations to your local database.

- **Reset local database:**
  ```bash
  yarn db:reset-local
  ```
  This force-resets your local database and reapplies all migrations from scratch.

### Best Practices
- Always pull the latest schema before creating new migrations.
- Review generated migration SQL before pushing to production.
- Commit all migration files and the `supabase/config.toml` to version control.

See the [Supabase CLI docs](https://supabase.com/docs/guides/cli) for advanced usage.

# RED TEAM REPORT: July 6/7, 2025

## Summary

This session focused on eliminating all E2E test infrastructure issues, normalizing test and mock function naming, and ensuring all foundational documentation and onboarding protocols are up to date and fully linked. All changes are now committed and pushed to GitHub.

## Key Actions
- Resolved Playwright/TypeScript module resolution conflicts by removing duplicate/empty mock files and correcting import paths.
- Normalized all E2E mock function names to `mockTaskApi` for clarity and consistency.
- Fixed a critical TypeScript error in `app/page.tsx` (missing `workspace_id` in task creation).
- Updated `tsconfig.json` to include the `e2e` directory for type checking.
- Verified and updated all foundational documentation links in `PROJECT_PLAYBOOK.md` and `lib/db/schema.ts` to reference `packages/web/TESTING.md` as the canonical E2E/testing/migration doc.
- Confirmed all onboarding orders, file mappings, and SOPs are correct and up to date.
- All changes are committed and pushed to GitHub.

## Security/Process Notes
- All E2E tests now use Playwright with client-side mocking only (no server-side test hooks).
- All onboarding and handoff protocols are current and referenced in both `PROJECT_PLAYBOOK.md` and `schema.ts`.
- No uncommitted changes remain; repository is fully synchronized.

## Next Steps
- Continue to use `packages/web/TESTING.md` as the single source of truth for all E2E/unit testing and migration documentation.
- All new agents must follow the onboarding order: `schema.ts` → `PROJECT_PLAYBOOK.md` → `TESTING.md` → DB snapshot.
- For any future E2E or test infrastructure changes, update all three foundational docs and commit immediately.

---

**Session complete. All E2E and foundational documentation is now robust, up to date, and fully linked.**
