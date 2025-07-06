<<<<<<< HEAD
# Holley Pfotzer Life Command - Monorepo

This is a Yarn Berry monorepo containing both web and native applications for the Holley Pfotzer Life Command project.

## Project Structure

```
├── packages/
│   ├── web/        # Next.js web application (React 18)
│   └── native/     # Expo React Native application (React 19)
├── package.json    # Root workspace configuration
└── .yarnrc.yml     # Yarn Berry configuration
```

## Getting Started

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Run the web application:**
   ```bash
   yarn dev:web
   ```

3. **Run the native application:**
   ```bash
   yarn dev:native
   ```

## Available Scripts

- `yarn dev:web` - Start the Next.js development server
- `yarn build:web` - Build the web application for production
- `yarn dev:native` - Start the Expo development server
- `yarn lint` - Run linting for all workspaces
- `yarn test` - Run tests for all workspaces
- `yarn ci` - Run CI checks for all workspaces

## Workspace Commands

To run commands in specific workspaces:

```bash
# Web workspace
yarn workspace web <command>

# Native workspace
yarn workspace native <command>
```

## Migration from Single Repo

This monorepo structure resolves the React version conflicts that occurred when web (React 18) and native (React 19) dependencies were mixed in a single package.json. Each workspace now maintains its own dependencies and React version.

## Development

- The web application uses React 18 and Next.js 14
- The native application uses React 19 and Expo 51
- Both workspaces share common utilities and configurations where appropriate
=======
# Holley-Pfotzer Life Command App

A Next.js/React Native Web hybrid application for collaborative life management, designed with ADHD/trauma-informed principles.

## Current Status (Updated: 2025-07-05)

**✅ BUILD STATUS**: Production builds working, all TypeScript errors resolved  
**✅ PLATFORM SPLIT**: Native and web code properly separated  
**✅ SECURITY**: Signal Protocol end-to-end encryption implemented  
**✅ TYPE SYSTEM**: Comprehensive TypeScript types in place  
**✅ DATA MODELS**: Task, Project, and Goal interfaces strictly defined with workspaceId for multi-workspace support  
**✅ REPOSITORY**: Published to GitHub, main branch synchronized  

## Tech Stack

- **Next.js 14.2.3** - Primary web framework
- **React Native Web 0.20.0** - Cross-platform UI
- **WatermelonDB 0.28.0** - Local database
- **Supabase 2.50.2** - Backend/sync
- **Signal Protocol 0.76.3** - End-to-end encryption
- **TypeScript 5.8.3** - Type safety
- **Playwright** - Testing framework

## Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Git

### Installation & Setup

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/samuelmholley1/HolleyPfotzerLifeCommand.git
   cd HolleyPfotzerLifeCommand
   yarn install
   ```

2. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Configure Supabase credentials
   - Set up Google OAuth credentials

3. **Run the development server**:
   ```bash
   yarn dev
   ```
   Opens at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test:e2e` - Run Playwright end-to-end tests
- `yarn test:ct` - Run component tests
- `yarn tsc --noEmit` - Type checking only

## Architecture

### Key Architectural Decisions

1. **Platform Splitting**: 
   - `.native.ts` files for React Native
   - `.web.ts` files for browser-specific code
   - Shared interfaces for platform-agnostic code
   - `tsconfig.json` excludes `*.native.ts` from web builds

2. **Type Safety**:
   - Centralized types in `/types/` directory
   - **Core models (`Task`, `Project`, `Goal`) strictly typed and include `workspaceId` for multi-workspace support**
   - Global type declarations for browser APIs
   - Definite assignment for WatermelonDB decorated properties

3. **Security**:
   - Signal Protocol for end-to-end encryption
   - Guard clauses for browser-only APIs
   - Service layer handles all crypto operations

4. **Data Layer**:
   - WatermelonDB for local storage
   - Supabase for remote sync and authentication
   - Row-level security (RLS) for data isolation

### Directory Structure

```
├── components/          # UI components (web/native compatible)
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Core utilities and database
│   ├── db/             # WatermelonDB models and schema
│   ├── signal/         # Signal Protocol encryption
│   └── supabase.ts     # Supabase client
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── pages/              # Next.js pages
└── public/             # Static assets
```

## Development Guidelines

### For New Agents/Developers

**MANDATORY READING ORDER**:
1. `lib/db/schema.ts` - System architecture and onboarding
2. `PROJECT_PLAYBOOK.md` - Development philosophy and protocols
3. Latest database snapshot files

### Key Patterns

1. **Platform-Specific Code**:
   ```typescript
   // services/feature.ts (shared interface)
   // services/feature.native.ts (React Native)
   // services/feature.web.ts (Web browser)
   ```

2. **Type Definitions**:
   ```typescript
   // types/feature.ts - Domain types
   // types/global.d.ts - Browser globals
   // types/tasks.ts - Task model (strict, includes workspaceId)
   // types/projects.ts - Project model (strict, includes workspaceId)
   // types/goals.ts - Goal model (strict, includes workspaceId)
   ```

3. **Service Layer**:
   ```typescript
   // All business logic in /services/
   // Components only handle UI logic
   ```

## Security

- **End-to-End Encryption**: Signal Protocol implementation
- **Authentication**: Google OAuth via Supabase
- **Data Protection**: Row-level security with Supabase
- **Browser Safety**: Guard clauses for window/document access

## ADHD/Trauma-Informed Design

This project is specifically designed to support users with ADHD, trauma, and cognitive load challenges:

- **Clear Documentation**: Step-by-step onboarding and protocols
- **Minimal Cognitive Load**: Automated validation and clear error messages
- **Explicit Mapping**: File organization and patterns are documented
- **Agent Autonomy**: Pre-defined protocols minimize need for repeated clarification

## Contributing

1. Follow the mandatory reading order (see schema.ts)
2. Update logs in PROJECT_PLAYBOOK.md for all changes
3. Test both web and native compatibility
4. Maintain type safety and security patterns
5. Document architectural decisions

## Support

For technical questions, see:
- `lib/db/schema.ts` - Architecture overview
- `PROJECT_PLAYBOOK.md` - Development protocols
- GitHub issues for bug reports

---

**Note**: This is a personal productivity application designed for collaborative life management. The architecture prioritizes user privacy, security, and accessibility for neurodiverse users.
>>>>>>> daf697366a51adb59803f0c238783883a47ac460
