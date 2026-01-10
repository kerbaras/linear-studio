# Linear Studio - Architecture Guide

## System Overview

Linear Studio is a VS Code extension that integrates with Linear issue tracker. This document describes the system architecture, design patterns, and component interactions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VS Code Extension Host                              │
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────────┐│
│  │  extension.ts   │──▶│   Container     │──▶│       Commands Registry     ││
│  │  (entry point)  │   │   (DI/IoC)      │   │                             ││
│  └─────────────────┘   └────────┬────────┘   └─────────────────────────────┘│
│                                 │                                            │
│         ┌───────────────────────┼───────────────────────────┐               │
│         ▼                       ▼                           ▼               │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────────┐      │
│  │ Auth Layer   │      │  Linear API Layer │      │   UI Layer       │      │
│  │              │      │                   │      │                  │      │
│  │ AuthService  │◀────▶│ LinearClientMgr   │◀────▶│ IssuesTreeProv   │      │
│  │ CredMgr     │      │ IssueService      │      │ IssueWebviewMgr  │      │
│  └──────┬───────┘      └───────────────────┘      └──────────────────┘      │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐      ┌──────────────────┐                                 │
│  │SecretStorage │      │   Git Layer      │                                 │
│  │  (VS Code)   │      │   GitService     │                                 │
│  └──────────────┘      └──────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   Linear API    │
                          │   (@linear/sdk) │
                          └─────────────────┘
```

## Core Design Patterns

### 1. Dependency Injection Container

The `Container` class implements a static service locator pattern, providing singleton access to all services throughout the extension.

```typescript
// src/container.ts
export class Container {
    private static _authService: AuthService;
    private static _issueService: IssueService;
    // ... other services

    static async initialize(context: vscode.ExtensionContext): Promise<void> {
        // Initialize services in dependency order
        this._credentialManager = new CredentialManager(context.secrets);
        this._authService = new AuthService(this._credentialManager);
        await this._authService.initialize();
        // ...
    }

    static get authService(): AuthService { return this._authService; }
    static get issueService(): IssueService { return this._issueService; }
}
```

**Initialization Order:**
1. CredentialManager (depends on: SecretStorage)
2. AuthService (depends on: CredentialManager)
3. LinearClientManager (depends on: CredentialManager)
4. IssueService (depends on: LinearClientManager)
5. GitService (no dependencies)
6. IssueWebviewManager (depends on: IssueService)
7. IssuesTreeProvider (depends on: IssueService)

### 2. Event-Driven Architecture

Authentication state changes are propagated throughout the system using VS Code's EventEmitter pattern.

```typescript
// src/auth/authService.ts
export class AuthService {
    private _onDidChangeAuthentication = new vscode.EventEmitter<boolean>();
    readonly onDidChangeAuthentication = this._onDidChangeAuthentication.event;

    async logout(): Promise<void> {
        await this.credentialManager.deleteApiKey();
        this._isAuthenticated = false;
        this._onDidChangeAuthentication.fire(false);  // Broadcast change
    }
}

// Listeners react to auth changes
authService.onDidChangeAuthentication((isAuthenticated) => {
    linearClientManager.reset();
    issuesTreeProvider.refresh();
    vscode.commands.executeCommand('setContext', 'linear-studio.authenticated', isAuthenticated);
});
```

### 3. Data Transfer Objects (DTO)

Linear SDK entities are converted to plain DTOs for serialization to webviews and avoiding SDK class complexity.

```typescript
// src/linear/types.ts
export interface IssueDTO {
    id: string;
    identifier: string;
    title: string;
    description?: string;
    priority: number;
    priorityLabel: string;
    url: string;
    branchName: string;
    state: {
        id: string;
        name: string;
        type: string;
        color: string;
    };
    cycle?: {
        id: string;
        name: string;
        startsAt?: string;
        endsAt?: string;
    };
    labels: Array<{ id: string; name: string; color: string }>;
    assignee?: { id: string; name: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface IssueDetailsDTO extends IssueDTO {
    comments: CommentDTO[];
}
```

### 4. Caching Strategy

IssueService implements a time-based cache to reduce API calls.

```typescript
// src/linear/issueService.ts
export class IssueService {
    private _issueCache = new Map<string, { data: IssueDTO[]; timestamp: number }>();
    private readonly CACHE_TTL_MS = 60_000; // 1 minute

    async getMyAssignedIssues(filter?: IssueFilter): Promise<IssueDTO[]> {
        const cacheKey = JSON.stringify(filter || {});
        const cached = this._issueCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.data;
        }
        // Fetch from API...
    }
}
```

**Cache Characteristics:**
- TTL: 60 seconds
- Key: Serialized filter object
- Invalidation: Manual via `clearCache()` or TTL expiry
- Scope: Per-filter (different filters have separate cache entries)

## Component Details

### Authentication Layer

| Component | Responsibility |
|-----------|----------------|
| `CredentialManager` | Wraps VS Code SecretStorage for API key persistence |
| `AuthService` | Manages auth state, validates keys, emits auth events |

**Flow:**
1. User triggers `linear-studio.authenticate` command
2. `AuthService.authenticate()` shows input box
3. Validates key format (`lin_api_*`)
4. Validates key by calling Linear API
5. Stores key via `CredentialManager`
6. Fires `onDidChangeAuthentication` event

### Linear API Layer

| Component | Responsibility |
|-----------|----------------|
| `LinearClientManager` | Lazy-initializes and caches LinearClient instance |
| `IssueService` | Fetches issues, handles pagination, caching, DTO conversion |

**LinearClientManager Pattern:**
```typescript
async getClient(): Promise<LinearClient> {
    if (!this._client) {
        const apiKey = await this.credentialManager.getApiKey();
        if (!apiKey) throw new Error('Not authenticated');
        this._client = new LinearClient({ apiKey });
    }
    return this._client;
}
```

### UI Layer

| Component | Responsibility |
|-----------|----------------|
| `IssuesTreeProvider` | Implements `TreeDataProvider` for sidebar tree view |
| `IssueWebviewManager` | Manages lifecycle of issue detail webview panels |
| `IssueWebviewController` | Controls individual webview panel content and messaging |

**Tree View Structure:**
```
linearStudio.issues (Tree View)
├── Sprint 1 (CycleNode)
│   ├── ENG-101: Fix login bug (IssueNode)
│   └── ENG-102: Add dashboard (IssueNode)
├── Sprint 2 (CycleNode)
│   └── ENG-103: Refactor API (IssueNode)
└── Backlog (CycleNode)
    └── ENG-104: Technical debt (IssueNode)
```

### Webview Communication

Extension and webview communicate via `postMessage`:

```typescript
// Extension → Webview
panel.webview.postMessage({ type: 'update', payload: issueData });
panel.webview.postMessage({ type: 'loading', payload: { isLoading: true } });
panel.webview.postMessage({ type: 'error', payload: { message: 'Failed' } });

// Webview → Extension
vscode.postMessage({ type: 'ready' });
vscode.postMessage({ type: 'startWork', payload: { issueId: '...' } });
vscode.postMessage({ type: 'openInBrowser', payload: { url: '...' } });
vscode.postMessage({ type: 'refresh' });
```

### Git Layer

| Component | Responsibility |
|-----------|----------------|
| `GitService` | Wraps VS Code Git extension API for branch operations |

**Multi-Repository Support:**
```typescript
getRepository(): Repository | undefined {
    const git = this.getGitAPI();
    if (!git?.repositories.length) return undefined;

    // Single repo: return it
    if (git.repositories.length === 1) return git.repositories[0];

    // Multiple repos: find one containing active file
    const activeUri = vscode.window.activeTextEditor?.document.uri;
    if (activeUri) {
        return git.repositories.find(repo =>
            activeUri.fsPath.startsWith(repo.rootUri.fsPath)
        );
    }

    // Default: first repo
    return git.repositories[0];
}
```

## VS Code Integration Points

### Commands

All commands are defined in `package.json` and registered in `src/commands/index.ts`:

| Command ID | Description |
|------------|-------------|
| `linear-studio.authenticate` | Trigger authentication flow |
| `linear-studio.logout` | Clear stored credentials |
| `linear-studio.viewIssue` | Open issue in webview panel |
| `linear-studio.startWork` | Create branch for issue |
| `linear-studio.refreshIssues` | Refresh issues tree view |
| `linear-studio.filterByCycle` | Filter by sprint/cycle |
| `linear-studio.filterByProject` | Filter by project |
| `linear-studio.clearFilters` | Clear all filters |
| `linear-studio.copyIssueLink` | Copy issue URL to clipboard |
| `linear-studio.openInBrowser` | Open issue in browser |

### Context Keys

Context keys enable conditional UI visibility:

| Key | Description |
|-----|-------------|
| `linear-studio.authenticated` | True when user is logged in |

Usage in `package.json`:
```json
{
    "when": "linear-studio.authenticated"
}
```

### Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `linear-studio.autoRefreshInterval` | number | 300 | Auto-refresh interval in seconds |
| `linear-studio.defaultTeam` | string | "" | Default team ID for filtering |

## Security Considerations

1. **API Key Storage**: Uses VS Code's SecretStorage (OS keychain integration)
2. **Key Validation**: Format validation (`lin_api_*`) + API validation before storage
3. **Webview CSP**: Content Security Policy with nonces for script execution
4. **No Sensitive Data in Logs**: API keys never logged

## Error Handling Strategy

1. **Authentication Errors**: Clear invalid credentials, prompt re-authentication
2. **API Errors**: Show user-friendly messages, maintain cached data
3. **Git Errors**: Surface git error messages to user
4. **Network Errors**: Graceful degradation with cached data

## Extension Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                      Extension Lifecycle                          │
│                                                                   │
│  activate()                                                       │
│      │                                                            │
│      ├──▶ Container.initialize()                                  │
│      │        ├──▶ Initialize services                            │
│      │        ├──▶ Restore auth state from SecretStorage          │
│      │        └──▶ Register tree view                             │
│      │                                                            │
│      ├──▶ registerCommands()                                      │
│      │                                                            │
│      └──▶ Set initial context (authenticated state)               │
│                                                                   │
│  [Running...]                                                     │
│      │                                                            │
│      └──▶ Handle commands, update views, manage webviews          │
│                                                                   │
│  deactivate()                                                     │
│      │                                                            │
│      └──▶ Container.dispose()                                     │
│               └──▶ Dispose webview manager                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Linear API Notes

- **Terminology**: Linear "Workspace" = organization, Linear "Team" = workspace subdivision
- **Pagination**: Linear API returns max 50 items per request; use `fetchNext()` for more
- **Branch Names**: Linear generates branch names via `issue.branchName` property
- **Rate Limits**: Linear has API rate limits; caching helps avoid hitting them
