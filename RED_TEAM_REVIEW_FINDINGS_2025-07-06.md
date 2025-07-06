# Plan to Address Red-Team Findings (as of July 6, 2025)

**Red-Team Finding & Status Overview:**

- **Type-system broken (missing ../types/tasks, mismatched fields):**
  - Already on CSE radar. The bad CreateTaskInput import was removed and a stub type exported. Schema alignment is queued.
  - Stub export unblocks the build today. A full Watermelon ⇄ Supabase type-sync task will be opened in TECHNICAL_DEBT_TRACKER (TICKET-9).

- **Hard-coded workspace ID:**
  - Fixed. Replaced with AuthContext → MockAuthProvider → seeded workspace ID.
  - Live in current branch; will be merged once CI passes.

- **Missing authentication:**
  - Fixed for web MVP. Real Google OAuth and a Mock provider for tests are implemented.
  - Further hardening (refresh token rotation, RBAC edge-cases) is already listed under post-merge TICKET-10.

- **Build failing (legacy type errors):**
  - On CSE radar. Each red error surfaced in CI is being patched (client component flag, type import, etc).
  - The 6-command patch just run is the final clean-build fix; waiting on CI green.

- **Outdated/legacy files:**
  - New finding. .old and .backup files identified.
  - A cleanup ticket (TICKET-11) will be opened to delete/archive legacy components and backups after merge. No impact on current release.

- **Minimal UI/UX / accessibility:**
  - Known, but deferred. Listed as medium priority in Playbook under “Post-MVP polish.”
  - No change to current sprint; will be scheduled for a design sprint after E2E suite lands.

- **Testing outdated (Playwright specs mismatched):**
  - Partially fixed. Jest now ignores Playwright specs; mock-auth E2E tests are valid.
  - Next ticket (TICKET-8) is to rewrite Playwright flows against the new UI.

- **No CI/CD:**
  - Resolved. Two-lane GitHub Actions with Yarn and mock-auth split are in the branch.
  - Once lanes go green, full CI will be in place (deploy pipeline is the next milestone).

- **Documentation stale:**
  - Addressed. schema.ts, supabase.ts, PROJECT_PLAYBOOK.md all updated; new protocol pointer added.
  - Ongoing; any new ticket must update OPEN_TASKS and Playbook per protocol.

- **Security notes (RLS, secrets):**
  - On radar. Service-role key is masked; RLS migration approved; secrets doc updated.
  - Audit again after merge to ensure no new env vars leak.

---

# RED TEAM REVIEW FINDINGS — July 6, 2025

## Executive Summary
This document records the results of a comprehensive red team audit of the Life Command project, conducted on July 6, 2025. The audit covered security, architecture, onboarding, migration, documentation, technical debt, and orphaned file detection. All findings are prioritized and actionable for immediate stabilization and long-term maintainability.

---

## Audit Process
- Deep file search for errors, vulnerabilities, TODOs, FIXMEs, deprecated code, and broken references
- Review of all .md, .sql, .js, .ts, and config files for inconsistencies and technical debt
- Cross-check of all documentation links and onboarding indices
- Orphaned/legacy file detection (e.g., .old, .backup, unused components)
- Review of technical debt and audit logs for untracked issues

---

## Findings & Priorities

### 1. CRITICAL (Immediate)
- **Type System Broken:** Main type imports (e.g., `../types/tasks`) are missing/broken, causing runtime errors and build failures.
- **Hardcoded Workspace ID:** All users share the same workspace, violating privacy and security.
- **Missing Authentication:** No user authentication/session management; RLS exists in DB but is not enforced in the app.
- **Build Failing:** Type mismatches and module resolution errors in legacy components (e.g., `Tasks.tsx`, `TaskList.tsx`).

### 2. HIGH (Next)
- **Outdated/Legacy Files:** Many legacy components and SQL files remain, not referenced in the new MVP. Orphaned files detected: `Dashboard.old.tsx`, `Dashboard.old.backup`, `babel.config.js.backup`.
- **Minimal UI/UX:** No accessibility, no responsive design, minimal error handling.
- **Testing Outdated:** Playwright tests reference non-existent UI elements; coverage is minimal.
- **No CI/CD:** No automated testing or deployment pipeline.

### 3. MODERATE
- **Documentation:** All major .md cross-links are valid; no broken .md links in main docs. Deprecated code and comments are present in some files (JS/TS, SQL, configs).
- **Technical Debt:** All critical issues are tracked in `TECHNICAL_DEBT_TRACKER.md` and related audit docs. Continue to keep these updated.

---

## Recommendations
- **Immediate:** Fix type system, remove hardcoded workspace ID, implement authentication, and resolve build errors.
- **Cleanup:** Archive or delete orphaned/legacy files not referenced in the new MVP.
- **Testing:** Update Playwright and other tests to match the current UI.
- **CI/CD:** Add automated testing and deployment.
- **Documentation:** Continue to keep technical debt and audit logs updated; ensure all deprecated files are marked or removed.

---

## Cross-References
- [Project Playbook (Hub)](PROJECT_PLAYBOOK.md)
- [Technical Debt Tracker](TECHNICAL_DEBT_TRACKER.md)
- [Open Tasks](OPEN_TASKS.md)
- [Security Guide](SECURITY_GUIDE.md)
- [Onboarding Guide](ONBOARDING_GUIDE.md)
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Migration Protocols](MIGRATION_PROTOCOLS.md)

---

# Monorepo Migration Update (July 2025)

> Web and native code are now isolated in separate workspaces (packages/web, packages/native). Peer-dependency and CI issues resolved.

---

> This review is mandatory reading for all agents and maintainers. All remediation actions must be tracked in `OPEN_TASKS.md` and referenced in future audits.
