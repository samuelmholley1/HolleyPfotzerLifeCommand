/**
 * FOR HUMANS: WHAT THIS FILE IS FOR
 *
 * This file defines the database and system structure. If you are not technical, you do not need to edit this file. For help, see the playbook or ask for a plain-language summary.
 */

/**
 * PROJECT FOUNDATION SCHEMA & SYSTEM MAP: Life Command
 *
 * =====================
 * ONBOARDING ORDER FOR NEW AGENTS (MANDATORY READING)
 * =====================
 *
 * 1. This file (`schema.ts`): Canonical schema, onboarding, and architecture notes.
 * 2. PROJECT_PLAYBOOK.md: Philosophy, SOP, next steps, onboarding protocol, and heuristics.
 * 3. A full database snapshot SQL (or its output, provided by the human if agent has no direct DB access): Actual DB implementation and schema drift detection.
 *
 * Every agent turn MUST update the "NEXT STEPS & OPEN TASKS" section in the playbook, and move completed steps to the "COMPLETED STEPS LOG" for full project auditability.
 * If a file is not found during a search, agents MUST consult the schema mapping (or update it if missing) to locate the correct file. The goal is that agents always know exactly where to search for any schema-related file based on this mapping.
 * For the most accurate live schema, agents should request a full database snapshot SQL (see playbook for example query) from the human if direct DB access is not available.
 *
 * All three must be read in order before making any changes or taking action.
 *
 * =====================
 * IMPORTANT: CONTEXT & NEXT STEPS
 * =====================
 *
 * For the full project background, philosophy, user context (ADHD, trauma, cognitive load),
 * and all open tasks/next steps, see: ../PROJECT_PLAYBOOK.md
 *
 * MANDATORY: All agents (AI or human) must read BOTH this file and the PROJECT_PLAYBOOK.md before making any changes or taking action. Both are required context sources for all next steps and project actions. Do not ask for confirmation for any pre-existing task or protocol documented in either file—proceed autonomously and document actions.
 *
 * After a context reset, always check this file first, then follow the pointer to the playbook.
 *
 * This schema is designed for:
 *   - ADHD/trauma-informed, user-centered design
 *   - Reducing cognitive load for both users and AI developers
 *   - Serving as a robust, extensible foundation for collaborative life management
 *
 * For all schema deletions, see: SCHEMA_DELETIONS_LOG.md
 *
 * =====================
 * PROJECT OVERVIEW & MODULE MAP
 * =====================
 *
 * - Database Schema: (this file) - All core tables, workspace/multi-tenant, cross-linking, analytics-ready.
 * - Contexts: `/contexts/` - React context providers for Auth, Workspace, Communication, etc.
 * - Services: `/services/` - Business logic for tasks, goals, projects, workspace, communication, analytics, etc.
 * - Components: `/components/` - All UI components (TaskList, Dashboard, DevLogin, ProfileMenu, etc.), web/native compatible.
 * - Hooks: `/hooks/` - Custom React hooks for data, workspace, communication state, etc.
 * - Types: `/types/` - TypeScript types for all major entities (Task, Goal, Project, Auth, etc.).
 * - Entry Points: `index.web.js`, `App.tsx` - Web/native app entry, root navigation, and context wiring.
 * - Config: `webpack.config.js`, `babel.config.js`, `tsconfig.json` - Build and transpile config for web/native.
 * - Supabase: `/supabase/` - SQL, RLS, and backend integration scripts.
 *
 * =====================
 * BUILD/RUN/TEST INSTRUCTIONS
 * =====================
 *
 * 1. Install dependencies (from project root):
 *    $ cd HolleyPfotzerLifeCommand
 *    $ npm install
 *
 * 2. Run the web app (from HolleyPfotzerLifeCommand):
 *    $ npm run web
 *    - Opens at http://localhost:3000
 *
 * 3. Run tests:
 *    $ npm test
 *
 * 4. For native (if configured):
 *    $ npm run ios   # or npm run android
 *
 * 5. Build for production:
 *    $ npm run build:web
 *
 * =====================
 * ONBOARDING & HANDOFF NOTES
 * =====================
 *
 * - All major flows (auth, tasks, goals, projects, communication, clarifications) are modular and extensible.
 * - AuthContext is the canonical source for authentication state and actions (see /contexts/AuthContext.tsx).
 * - Service layer is the only place for business logic (see /services/).
 * - UI is web/native compatible; use React Native Web for browser.
 * - All new features should be added as new modules/services/components, not by modifying the schema directly unless DB changes are needed.
 * - For security, see SECURITY_IMPLEMENTATION_GUIDE.md and RED_TEAM_CRITICAL_SECURITY_AUDIT.md.
 * - For DB/RLS, see /supabase/ and DATABASE_SETUP_INSTRUCTIONS.md.
 *
 * This file is the foundation for future AI or human maintainers. Update this header with any new modules or major changes.
 *
 * =====================
 * (Original schema documentation follows)
 * =====================
 */

/**
 * PROJECT FOUNDATION SCHEMA: Life Command
 *
 * This schema defines the core data model for the Life Command system, designed for personal and collaborative productivity,
 * goal management, project execution, and healthy communication. It is architected for extensibility, analytics, and secure
 * crossweaving of all user data (tasks, goals, projects, events, clarifications, and communication).
 *
 * TABLE OVERVIEW:
 *
 * - events:         Immutable event log for all user/system actions (for analytics, audit, and cross-linking).
 * - tasks:          Actionable items, can be recurring, cross-linked, and organized by project/goal/category.
 * - goals:          High-level objectives, can be nested, tracked, and linked to projects/tasks.
 * - projects:       Collections of tasks and milestones, linked to goals, with progress tracking.
 * - workspaces:     Collaboration spaces (e.g., couples, teams, solo), each with its own data context.
 * - workspace_members: Membership table for users in workspaces (for permissions, sharing, etc).
 * - clarifications: Structured assumptions and agreements to reduce miscommunication and track decisions.
 * - clarification_responses: Individual responses to clarifications (for consensus, audit, and learning).
 * - communication_modes: Tracks the current communication state (e.g., normal, emergency break) for safety and UX.
 *
 * KEY ARCHITECTURAL PRINCIPLES:
 * - All tables are workspace-scoped for privacy and multi-tenancy.
 * - All major entities (tasks, goals, projects, events) support cross-linking for analytics and future features (e.g., symptom tracking).
 * - Designed for secure, encrypted payloads and future zero-knowledge extensions.
 * - Extensible for future modules: symptom tracking, journaling, advanced analytics, etc.
 * - All timestamps are Unix epoch (ms) for consistency.
 * - All tables support sync status for offline/online operation.
 *
 * This schema is the "house foundation"—all future features ("furnishings") build on this structure.
 *
 * For a visual map, see: events (timeline) <-> tasks <-> goals <-> projects <-> workspaces
 * Communication and clarifications are first-class, not afterthoughts.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 11, // Bump version for migration
  tables: [
    tableSchema({
      name: 'events',
      columns: [
        { name: 'event_type', type: 'string' },
        { name: 'timestamp', type: 'number' }, // Unix timestamp for performance
        { name: 'is_synced', type: 'boolean' },
        { name: 'encrypted_payload', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'event_uuid', type: 'string', isOptional: true },
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending', 'in_progress', 'completed', 'cancelled'
        { name: 'priority', type: 'string' }, // 'low', 'medium', 'high', 'urgent'
        { name: 'category', type: 'string' }, // 'work', 'health', 'personal', 'strategy'
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true }, // minutes
        { name: 'actual_duration', type: 'number', isOptional: true },
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'parent_task_id', type: 'string', isOptional: true }, // for subtasks
        { name: 'project_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'task_uuid', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'recurrence', type: 'string', isOptional: true }, // JSON: { freq, interval, byweekday, until, count, ... }
        { name: 'cross_links', type: 'string', isOptional: true }, // JSON array for crossweaving (symptoms, events, etc)
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'slug', type: 'string', isOptional: true, isIndexed: true },
        // Added for future extensibility (arbitrary JSON)
        { name: 'extra', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'draft', 'active', 'on_hold', 'completed', 'cancelled'
        { name: 'priority', type: 'string' }, // 'low', 'medium', 'high', 'critical'
        { name: 'category', type: 'string' }, // 'health', 'career', 'financial', 'personal', 'relationships', 'learning'
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'completion_percentage', type: 'number' }, // 0-100
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'parent_goal_id', type: 'string', isOptional: true }, // for sub-goals
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'metrics', type: 'string', isOptional: true }, // JSON object for tracking progress
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'goal_uuid', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'slug', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'planning', 'active', 'on_hold', 'completed', 'cancelled'
        { name: 'priority', type: 'string' }, // 'low', 'medium', 'high', 'urgent'
        { name: 'category', type: 'string' }, // 'work', 'personal', 'health', 'learning', 'side_project'
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'target_completion_date', type: 'number', isOptional: true },
        { name: 'actual_completion_date', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true }, // total estimated hours
        { name: 'actual_duration', type: 'number', isOptional: true }, // total actual hours
        { name: 'completion_percentage', type: 'number' }, // 0-100
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true }, // link to parent goal
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'milestones', type: 'string', isOptional: true }, // JSON array of milestone objects
        { name: 'resources', type: 'string', isOptional: true }, // JSON array of resource links/notes
        { name: 'is_synced', type: 'boolean' },
        { name: 'project_uuid', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'slug', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'workspaces',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'owner_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'slug', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'workspace_members',
      columns: [
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'label', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'clarifications',
      columns: [
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'proposer_id', type: 'string' },
        { name: 'topic', type: 'string' },
        { name: 'assumptions', type: 'string' }, // JSON string of assumptions array
        { name: 'status', type: 'string' }, // 'pending', 'agreed', 'needs_discussion', 'cancelled'
        { name: 'is_synced', type: 'boolean' },
        { name: 'clarification_uuid', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'label', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'clarification_responses',
      columns: [
        { name: 'clarification_id', type: 'string', isIndexed: true },
        { name: 'responder_id', type: 'string' },
        { name: 'assumption_index', type: 'number' },
        { name: 'response_status', type: 'string' }, // 'agree', 'disagree', 'needs_discussion'
        { name: 'is_synced', type: 'boolean' },
        { name: 'response_uuid', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'label', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    tableSchema({
      name: 'communication_modes',
      columns: [
        { name: 'workspace_id', type: 'string', isIndexed: true },
        { name: 'current_mode', type: 'string' }, // 'normal', 'careful', 'emergency_break', 'mediated'
        { name: 'state_display', type: 'string' }, // 'calm', 'tense', 'paused'
        { name: 'state_color', type: 'string' }, // 'green', 'yellow', 'red'
        { name: 'active_topic', type: 'string', isOptional: true },
        { name: 'timeout_end', type: 'number', isOptional: true },
        { name: 'last_break_timestamp', type: 'number', isOptional: true },
        { name: 'break_count_today', type: 'number' },
        { name: 'partner_acknowledged', type: 'boolean' },
        { name: 'auto_detection_enabled', type: 'boolean' },
        { name: 'pattern_confidence', type: 'number' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Human-friendly identifier for debugging, admin UI, and cross-referencing
        { name: 'label', type: 'string', isOptional: true, isIndexed: true },
      ]
    }),
    // ...add similar for any future/join tables...
  ]
});

/*
 * =====================
 * HUMAN-FRIENDLY IDENTIFIERS (slugs/labels)
 * =====================
 * - Every table has a `slug` or `label` for developer/ADHD-friendly debugging, review, and UI.
 * - Format: <table>-<meaningful>-<id> (e.g., 'sample-task-1', 'alice-dev', 'workspace-member-<id>')
 * - Always unique and indexed. Used for admin/debug panels, URLs, and cross-table joins.
 * - See add_human_friendly_identifiers.sql for migration and conventions.
 * - All new records must have a human-friendly slug/label. Run the post-seed validation SQL to ensure no missing slugs/labels.
 */

/**
 * =====================
 * PROJECT ROLES & RESPONSIBILITIES
 * =====================
 *
 * COO: Sets business priorities, defines minimum viable goals, and directs the CTO. Ensures the product delivers value and aligns with user needs.
 * CTO: Owns technical execution, maintains schema integrity, documents all changes, and ensures all schema/architecture work is traceable and auditable. Follows COO direction and keeps this file as the single source of truth.
 * AI/Human Agents: Must read this section before making changes. Always update this file with new goals, roles, and next steps. Never make undocumented changes.
 *
 * =====================
 * PROJECT GOALS & RAISON D’ÊTRE
 * =====================
 *
 * Raison d’être: Build a robust, extensible, and human-friendly productivity and collaboration platform (Life Command) that supports personal and team workflows, healthy communication, and analytics-ready data. All schema and architecture must be clear, auditable, and easy for both AI and human maintainers to extend.
 *
 * Short-Term Minimum Viable Goal: Complete and enforce the universal slug/label convention across all tables, utilities, and admin tools. Ensure all schema changes are documented here, and all deletions are logged in SCHEMA_DELETIONS_LOG.md. Expose slugs/labels in the admin UI and automate validation.
 *
 * =====================
 * NEXT STEPS / OPEN TASKS
 * =====================
 *
 * 1. Maintain slug/label convention for all tables (see below for details).
 * 2. Log all schema deletions in SCHEMA_DELETIONS_LOG.md.
 * 3. Standardize slug/label generation utility and document usage.
 * 4. Expose slugs/labels in admin/debug UI.
 * 5. Automate validation and add CI checks for slugs/labels.
 * 6. Keep this section updated with new goals and priorities as directed by the COO.
 *
 * (Update this section as project priorities evolve.)
 * =====================
 * FILE PATHWAY & SCHEMA MAPPING (MANDATORY)
 * =====================
 *
 * All actual UI/admin/debugging files are located in:
 *   - HolleyPfotzerLifeCommand/components/ (UI components)
 *   - HolleyPfotzerLifeCommand/services/ (business logic)
 *   - HolleyPfotzerLifeCommand/types/ (TypeScript types)
 *   - HolleyPfotzerLifeCommand/lib/db/ (utilities, schema, slug utils)
 *   - .env, .env.*, and .gitignore files in HolleyPfotzerLifeCommand/ (canonical root, not tracked by git, must be provided by user if needed)
 *
 * The following file/path patterns DO NOT exist and should be avoided in searches and code:
 *   - Any file or folder named 'admin' or 'debug'.
 *   - Any file or folder named 'components' outside of HolleyPfotzerLifeCommand/components/.
 *   - Any file or folder named 'ui' (unless explicitly added in the future).
 *
 * If a file is not found, consult this mapping and update it if the structure changes. If a config or environment file is missing, check .gitignore and prompt the user to provide it.
 */

/**
 * =====================
 * DATABASE SNAPSHOT FILES: EXPLANATION & AGENT PROTOCOL
 * =====================
 *
 * There are now multiple types of database snapshot files, each with a specific purpose:
 *
 * 1. DATABASE_SNAPSHOT_DDL.sql
 *    - Full schema (DDL) snapshot for migrations, schema diffs, and recreating the database structure.
 *    - Generated with: pg_dump --schema-only --no-owner --no-privileges $DATABASE_URL > DATABASE_SNAPSHOT_DDL.sql
 *
 * 2. DATABASE_SNAPSHOT_COLUMNS.sql
 *    - Human-readable table/column summary for onboarding, quick reference, and agent context.
 *    - Generated with: SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
 *
 * 3. DATABASE_SNAPSHOT_RELATIONSHIPS_PART1.sql
 *    - Foreign key relationships snapshot: shows how tables are linked (source_table.column -> target_table.column).
 *    - Generated with the foreign key query (see file for details).
 *
 * 4. DATABASE_SNAPSHOT_RELATIONSHIPS_PART2.sql
 *    - Primary key columns snapshot: shows the main ID for every table.
 *    - Generated with the primary key query (see file for details).
 *
 * =====================
 * AGENT ONBOARDING PROTOCOL (AFTER CONTEXT RESET)
 * =====================
 *
 * 1. Request the human to run and provide the output of:
 *    - DATABASE_SNAPSHOT_COLUMNS.sql (for table/column summary)
 *    - DATABASE_SNAPSHOT_RELATIONSHIPS_PART1.sql (for foreign key relationships)
 *    - DATABASE_SNAPSHOT_RELATIONSHIPS_PART2.sql (for primary key columns)
 *
 * 2. Use these outputs to:
 *    - Map all relationships and write/validate any SQL or migration scripts.
 *    - Ensure all validation, admin, and onboarding tools are accurate and up-to-date.
 *
 * 3. Only request the DDL snapshot if a full migration or schema diff is needed.
 */

/*
 * =====================
 * ENVIRONMENT FILES & GITIGNORE PROTOCOL
 * =====================
 *
 * - The app requires a `.env` file with Supabase and other secrets. This file must exist in HolleyPfotzerLifeCommand/ (the canonical project root). If running the web app from a different folder, ensure `.env` is present there as well.
 * - `.env` and related files are always listed in `HolleyPfotzerLifeCommand/.gitignore` (or `.gitignore bak` if temporarily renamed for local-only work). Never commit `.env` or secrets to git or GitHub.
 * - If you see `.gitignore bak`, you MUST rename it back to `.gitignore` before any commit, push, or linking to GitHub. This prevents accidental exposure of secrets.
 * - To search for `.env` or `.gitignore` files, look in HolleyPfotzerLifeCommand/ (the canonical root).
 * - For onboarding, see PROJECT_PLAYBOOK.md for step-by-step instructions on environment setup and secure file handling.
 */

/*
 * =====================
 * GITIGNORE/ENV FILE PROTOCOL
 * =====================
 * - If `.gitignore` is renamed, commented out, or otherwise disabled for local work, it is a MANDATORY step to restore it to its original state before any commit, push, or linking to GitHub.
 * - Agents must check the state of `.gitignore` before any git operation and prompt the user to restore it if needed.
 * - Never allow `.env` or other sensitive files to be committed or pushed to a remote repository.
 */

/**
 * DOCKER COMPOSE CONFIGURATION
 *
 * The canonical docker-compose.yml for this project is located at:
 *   HolleyPfotzerLifeCommand/docker-compose.yml
 *
 * This file is used for local development, automation, and E2E/component testing.
 * Do NOT search for docker-compose.yml in parent folders or outside HolleyPfotzerLifeCommand/; always use the file above as the canonical source.
 *
 * If you need to run Playwright or other test suites, use:
 *   docker-compose -f "HolleyPfotzerLifeCommand/docker-compose.yml" run --rm playwright
 */

// AUDIT: SCHEMA & FILE MAPPING (2025-07-04)
//
// This schema reflects the full project audit as of July 4, 2025. All table/file nomenclature, relationships, and protocols are up-to-date and match the current database and onboarding state.
//
// - All core tables (events, tasks, goals, projects, workspaces, workspace_members, clarifications, clarification_responses, communication_modes) are present and mapped.
// - All tables have human-friendly `slug` or `label` columns for admin/debugging, as per universal convention.
// - All relationships (foreign keys, primary keys) are documented in the snapshot files and reflected in this schema.
// - File mapping and onboarding order are up-to-date and match the playbook.
// - No undocumented or orphaned tables, columns, or files exist as of this audit.
// - All agent and onboarding protocols are current and enforced.
//
// If any new tables, relationships, or files are added, update this section and the playbook accordingly.

/**
 * QUICK START / AGENT CHECKLIST
 *
 * 1. Read this file, then PROJECT_PLAYBOOK.md, then the latest database snapshot files (DDL, columns, relationships).
 * 2. Confirm file mapping and onboarding order match across all docs.
 * 3. Before making changes, check the "NEXT STEPS & OPEN TASKS" and log all actions/decisions.
 * 4. After any change, update logs and mapping, and run validation scripts.
 * 5. If you are unsure, add a question to the logs and proceed with caution.
 * 6. For non-technical users: see the "For Humans" section in the playbook for help.
 */

/*
 * =====================
 * AUTOMATED SCHEMA DRIFT & FK VALIDATION (2025-07-04)
 * =====================
 *
 * - Use `scripts/validateSchemaDrift.ts` to compare live DB FKs to canonical DDL after any migration or when drift is suspected.
 * - This is a required part of the onboarding and audit protocol.
 */
