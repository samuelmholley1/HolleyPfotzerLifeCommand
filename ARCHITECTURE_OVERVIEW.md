# Architecture Overview & File Mapping

## Monorepo Structure

This project follows a Yarn Berry monorepo structure optimized for web and future native development.

### Root Level
```
HolleyPfotzerLifeCommand_Monorepo/
├── packages/
│   └── web/                 # Next.js web application
├── lib/                     # Shared utilities and schema
├── supabase/               # Database migrations and configuration
├── yarn.lock               # Yarn Berry lockfile (tracked)
├── package.json            # Root package.json with workspaces
└── [Documentation].md      # Project documentation
```

### Web Application (`packages/web/`)
```
packages/web/
├── src/
│   ├── app/                # Next.js app router
│   ├── components/         # React components
│   ├── contexts/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Business logic and API calls
│   └── types/             # TypeScript type definitions
├── e2e/                   # Playwright E2E tests
├── public/                # Static assets
├── next.config.js         # Next.js configuration
├── playwright.config.ts   # Playwright configuration
├── .env.test             # E2E environment variables
└── package.json          # Web workspace dependencies
```

## Key Architectural Decisions

### Authentication Architecture
- **Real Auth**: `AuthContext.tsx` - Production Supabase authentication
- **Mock Auth**: `MockAuthContext.tsx` - E2E testing authentication
- **Unified Types**: `types/auth.ts` - Shared type definitions
- **Environment Toggle**: `NEXT_PUBLIC_USE_MOCK_AUTH` controls which context loads

### E2E Testing Architecture
- **Client-Side Mocking**: Playwright `page.route()` for stateful API mocking
- **Environment Isolation**: `.env.test` with E2E-specific variables
- **Robust Selectors**: `data-testid` attributes for reliable element selection
- **Mock State Management**: In-memory mock data per test run

### Service Layer
- **API Services**: `services/` contain all business logic
- **Type Safety**: Full TypeScript coverage with strict types
- **Error Handling**: Consistent error handling patterns
- **Database Integration**: Supabase client with RLS (Row Level Security)

## Core Modules

### Authentication & User Management
- **Location**: `packages/web/src/contexts/AuthContext.tsx`
- **Mock Version**: `packages/web/src/contexts/MockAuthContext.tsx`
- **Types**: `packages/web/src/types/auth.ts`
- **Features**: Google OAuth, user profiles, workspace management

### Task Management
- **Service**: `packages/web/src/services/taskService.ts`
- **Components**: `packages/web/src/components/TaskForm.tsx`, `TaskList.tsx`
- **Types**: `packages/web/src/types/tasks.ts`
- **Features**: CRUD operations, priority/status management, workspace scoping

### Database Schema
- **Location**: `lib/db/schema.ts`
- **Type Generation**: `packages/web/src/types/supabase.ts`
- **Migrations**: `supabase/migrations/`
- **Features**: Multi-tenant, workspace-scoped, audit logging

### E2E Testing
- **Location**: `packages/web/e2e/`
- **Configuration**: `packages/web/playwright.config.ts`
- **Documentation**: `packages/web/TESTING.md`
- **Features**: Mock authentication, API mocking, robust selectors

## Development Workflow

### Local Development
```bash
# Install dependencies
yarn install

# Start web development server
yarn workspace web dev

# Run unit tests
yarn workspace web test

# Run E2E tests
yarn workspace web test:e2e
```

### Environment Variables
- **Development**: `packages/web/.env.local`
- **E2E Testing**: `packages/web/.env.test`
- **Next.js Config**: `packages/web/next.config.js` propagates variables

### Testing Strategy
- **Unit Tests**: Jest with React Testing Library
- **E2E Tests**: Playwright with client-side mocking
- **Type Safety**: TypeScript strict mode
- **Security Tests**: XSS protection, input validation

## File Patterns to Avoid
- Any file or folder named 'admin' or 'debug'
- Components outside of `packages/web/src/components/`
- Services outside of `packages/web/src/services/`
- Direct database access outside of services layer

## Integration Points
- **Supabase**: Database, authentication, RLS
- **Next.js**: App router, API routes, SSR/SSG
- **Playwright**: E2E testing, browser automation
- **Yarn Berry**: Package management, workspace orchestration

## Security Considerations
- **RLS Policies**: Database-level security
- **Environment Isolation**: Separate configs for different environments
- **Mock Safety**: Production guards prevent mock auth in production
- **Input Validation**: XSS protection and sanitization

## Future Expansion
- **Native Package**: `packages/native/` for React Native
- **Shared Libraries**: Additional packages in `packages/`
- **Microservices**: Potential backend services
- **CI/CD**: GitHub Actions with monorepo optimization
