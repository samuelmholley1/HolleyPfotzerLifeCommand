# Testing Documentation

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

All E2E tests use this pattern for mocking API responses.

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
