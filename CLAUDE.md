# Linear Studio - AI Assistant Guide

## Project Overview

Linear Studio is a VS Code extension that integrates with Linear issue tracker. It allows developers to view their assigned issues, create feature branches, and manage their workflow directly from VS Code.

**Tech Stack:**
- VS Code Extension API (TypeScript)
- Linear SDK (`@linear/sdk`)
- React 18 + Vite (webview UI)
- esbuild (bundling)
- Vitest (unit testing)
- Playwright (E2E testing)
- pnpm (package manager)

## Directory Structure

```
linear-studio/
├── src/                     # Extension source code
│   ├── auth/               # Authentication services
│   │   ├── authService.ts      # Login/logout, auth state management
│   │   └── credentialManager.ts # VS Code SecretStorage wrapper
│   ├── commands/           # VS Code command handlers
│   │   ├── index.ts           # Command registration
│   │   └── startWorkCommand.ts # Branch creation workflow
│   ├── git/                # Git integration
│   │   └── gitService.ts      # Branch creation, repository access
│   ├── linear/             # Linear API layer
│   │   ├── issueService.ts    # Issue fetching, caching, DTO conversion
│   │   ├── linearClientManager.ts # Client lifecycle management
│   │   └── types.ts           # DTO interfaces
│   ├── views/              # UI components
│   │   ├── issueWebview/      # React webview panel
│   │   │   ├── issueWebviewController.ts
│   │   │   └── issueWebviewManager.ts
│   │   └── issues/
│   │       └── issuesTreeProvider.ts  # Tree view data provider
│   ├── container.ts        # Dependency injection container
│   ├── constants.ts        # Command IDs, config keys, context keys
│   └── extension.ts        # Extension entry point
├── webview-ui/             # React webview application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.tsx         # Main webview component
│   │   └── types.ts        # Shared types with extension
│   ├── package.json        # Separate dependencies
│   └── vite.config.ts      # Vite bundler config
├── test/
│   ├── unit/               # Vitest unit tests
│   │   ├── setup.ts           # VS Code API mocks
│   │   └── **/*.test.ts
│   ├── integration/        # VS Code integration tests
│   └── e2e/                # Playwright E2E tests
├── .github/workflows/      # CI configuration
├── package.json            # Extension manifest and dependencies
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Unit test configuration
├── playwright.config.ts    # E2E test configuration
└── esbuild.js              # Build script
```

## Development Setup

```bash
# Install extension dependencies
pnpm install

# Install webview dependencies
cd webview-ui && pnpm install && cd ..

# Build everything
pnpm build
```

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build extension + webview for production |
| `pnpm build:extension` | Build only the extension |
| `pnpm build:webview` | Build only the webview UI |
| `pnpm watch` | Watch mode for extension development |
| `pnpm watch:webview` | Watch mode for webview development |
| `pnpm typecheck` | Run TypeScript type checking |

## Testing

### Test Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run unit + integration tests |
| `pnpm test:unit` | Run unit tests only (Vitest) |
| `pnpm test:unit:watch` | Run unit tests in watch mode |
| `pnpm test:unit:coverage` | Run unit tests with coverage |
| `pnpm test:integration` | Run VS Code integration tests |
| `pnpm test:e2e` | Run Playwright E2E tests |

### Test Structure

- **Unit tests** (`test/unit/`): Test individual services with mocked VS Code API
- **Integration tests** (`test/integration/`): Test extension in real VS Code environment
- **E2E tests** (`test/e2e/`): Test webview UI with Playwright

### Unit Test Conventions

Tests use Vitest with a custom `setup.ts` that mocks the VS Code API:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServiceName', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should describe expected behavior', async () => {
        // Given - setup
        // When - action
        // Then - assertions
    });
});
```

### Coverage Thresholds

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

## Architecture Patterns

### Dependency Injection Container

The `Container` class provides singleton access to all services:

```typescript
import { Container } from './container';

// Access services
Container.authService.isAuthenticated
Container.issueService.getMyAssignedIssues()
Container.gitService.createBranch(name)
```

### Event-Driven Authentication

Authentication state changes are broadcast via VS Code EventEmitter:

```typescript
// Listen for auth changes
Container.authService.onDidChangeAuthentication((isAuthenticated) => {
    // React to auth state changes
});
```

### DTO Pattern

Linear SDK entities are converted to plain DTOs for serialization to webviews:

- `IssueDTO` - Basic issue data for tree view
- `IssueDetailsDTO` - Extended with comments for detail view
- `CommentDTO` - Comment data

### Webview Communication

Extension <-> Webview communication uses `postMessage`:

```typescript
// Extension to Webview
panel.webview.postMessage({ type: 'update', payload: issueData });

// Webview to Extension
vscode.postMessage({ type: 'startWork', issueId: '...' });
```

## Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Extension entry point, initializes Container |
| `src/container.ts` | Service container and initialization |
| `src/constants.ts` | Command IDs, config keys, context keys |
| `src/auth/authService.ts` | Authentication flow and state |
| `src/linear/issueService.ts` | Issue fetching with caching |
| `src/commands/index.ts` | All command registrations |
| `package.json` | Extension manifest (`contributes` section) |
| `test/unit/setup.ts` | VS Code API mocks for unit tests |

## VS Code Extension Concepts

### Commands

Commands are defined in `package.json` under `contributes.commands` and registered in `src/commands/index.ts`:

```typescript
vscode.commands.registerCommand('linear-studio.authenticate', async () => {
    await Container.authService.authenticate();
});
```

### Context Keys

Context keys control conditional UI visibility:

```typescript
// Set context
await vscode.commands.executeCommand('setContext', 'linear-studio.authenticated', true);

// Use in package.json
"when": "linear-studio.authenticated"
```

### Tree View

The issues tree view uses a `TreeDataProvider`:

```typescript
class IssuesTreeProvider implements vscode.TreeDataProvider<IssueDTO> {
    getTreeItem(element: IssueDTO): vscode.TreeItem { ... }
    getChildren(element?: IssueDTO): IssueDTO[] { ... }
}
```

## Configuration

Extension settings defined in `package.json`:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `linear-studio.autoRefreshInterval` | number | 300 | Auto-refresh interval in seconds (0 to disable) |
| `linear-studio.defaultTeam` | string | "" | Default team ID filter |

## Common Tasks

### Adding a New Command

1. Add command ID to `src/constants.ts`
2. Add command definition to `package.json` under `contributes.commands`
3. Register handler in `src/commands/index.ts`
4. Add menu entries in `package.json` if needed

### Adding a New Service

1. Create service class in appropriate directory
2. Add to `Container` class with getter
3. Initialize in `Container.initialize()`

### Modifying Issue Data

1. Update DTO in `src/linear/types.ts`
2. Update conversion in `IssueService.toIssueDTO()`
3. Update webview types in `webview-ui/src/types.ts`

## CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`):

1. **Lint & Type Check** - Runs on all pushes
2. **Unit Tests** - Runs on Ubuntu, macOS, Windows with coverage
3. **Integration Tests** - Runs VS Code tests on all platforms
4. **E2E Tests** - Runs Playwright on Ubuntu

## Git Integration

The extension uses VS Code's built-in Git extension API:

```typescript
// Get Git API
const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
const git = gitExtension.exports.getAPI(1);

// Access repositories
const repo = git.repositories[0];
await repo.createBranch(branchName, checkout);
```

## Credentials

API keys are stored securely using VS Code's SecretStorage:

```typescript
// Store
await context.secrets.store('linear-studio.apiKey', apiKey);

// Retrieve
const apiKey = await context.secrets.get('linear-studio.apiKey');
```

## Important Notes

- The extension requires VS Code 1.85.0+
- Depends on `vscode.git` extension for Git operations
- Webview UI is built separately and bundled into the extension
- Linear API keys must start with `lin_api_`
- The extension uses a 1-minute cache for issue data
