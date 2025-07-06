# Tooling & CI Policy

> Return to [PROJECT_PLAYBOOK.md](PROJECT_PLAYBOOK.md)

## Package Manager
- **Yarn 4 (Berry)** is the only supported package manager.
- The root `package.json` includes:
  ```json
  "packageManager": "yarn@4.9.2"
  ```
- `.yarnrc.yml` enforces:
  - `enableImmutableInstalls: true`
  - `nodeLinker: node-modules`
- Only `yarn.lock` is tracked. All `package-lock.json` files are deleted and ignored.

## CI/CD
- All GitHub Actions jobs use:
  ```yaml
  - name: Install deps (Yarn 4, immutable)
    run: |
      corepack enable
      yarn install --immutable
  ```
- No `corepack prepare` or `npm ci` is used anywhere in CI.
- Node version for CI: `20.x` (see `setup-node` in workflows).
- Dummy Supabase env vars are injected in CI if secrets are missing.
- Playwright E2E tests only run if test files exist.

## Lockfile Policy
- The repo uses **lockfile v6** (Yarn 4+). If you see YN0028 errors, update the lockfile locally and commit.
- All contributors must use Yarn 4.9.2+ and run `yarn install` after pulling changes.

## Migration History
- July 2025: Migrated from npm to Yarn 4, upgraded lockfile to v6, removed all `npm ci` from CI.

## Troubleshooting
- If `yarn install --immutable` fails in CI, run `yarn install` locally and commit the updated lockfile and any related config files.
- For peer dependency warnings, see the playbook and README for workspace-specific React versions.

---
For more, see `README.md` and `PROJECT_PLAYBOOK.md`.
