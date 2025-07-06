# Holley Pfotzer Life Command - Monorepo

> See also: [TOOLING.md](TOOLING.md) for Yarn, lockfile, and CI/CD policy.
> Return to [PROJECT_PLAYBOOK.md](PROJECT_PLAYBOOK.md)

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

## Running E2E tests

### Default (auto-server)
```bash
yarn workspace web e2e
```

### On a custom port
```bash
yarn workspace web e2e:3001
```

Or:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3002 yarn workspace web e2e
```

- The E2E setup uses Playwright’s flexible `PLAYWRIGHT_BASE_URL` and `webServer` config.
- Scripts are provided for common ports for convenience.
- Playwright will spin up the dev server automatically if one isn’t running, or reuse an existing server if available.
