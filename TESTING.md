# Linear Studio - Testing Guide

## Overview

Linear Studio uses a comprehensive three-tier testing strategy:

| Test Type | Framework | Location | Purpose |
|-----------|-----------|----------|---------|
| Unit Tests | Vitest | `test/unit/` | Test individual services with mocked dependencies |
| Integration Tests | VS Code Test | `test/integration/` | Test extension in real VS Code environment |
| E2E Tests | Playwright | `test/e2e/` | Test webview UI in browser |

## Test Commands

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit              # Run once
pnpm test:unit:watch        # Watch mode
pnpm test:unit:coverage     # With coverage report

# Integration tests
pnpm test:integration       # Requires VS Code

# E2E tests
pnpm test:e2e               # Requires Playwright browsers
```

## Unit Testing

### Setup

Unit tests use Vitest with a custom setup file that mocks the VS Code API:

```typescript
// test/unit/setup.ts
import { vi } from 'vitest';

vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        showInputBox: vi.fn(),
        createTreeView: vi.fn(() => ({ dispose: vi.fn() })),
        // ...
    },
    commands: {
        registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
        executeCommand: vi.fn(),
    },
    EventEmitter: MockEventEmitter,
    // ... full mock
}));

vi.mock('@linear/sdk', () => ({
    LinearClient: vi.fn(() => ({
        viewer: Promise.resolve({ id: 'user-1', name: 'Test User' }),
        // ...
    })),
}));
```

### Test Structure

Follow the Given-When-Then (BDD) pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AuthService', () => {
    let authService: AuthService;
    let mockCredentialManager: MockedObject<CredentialManager>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCredentialManager = createMockCredentialManager();
        authService = new AuthService(mockCredentialManager);
    });

    describe('authenticate', () => {
        it('should store API key and fire event on valid key', async () => {
            // Given
            vi.mocked(vscode.window.showInputBox).mockResolvedValue('lin_api_valid');
            mockLinearClient.viewer = Promise.resolve({ id: '1', name: 'John' });

            // When
            const result = await authService.authenticate();

            // Then
            expect(result).toBe(true);
            expect(mockCredentialManager.setApiKey).toHaveBeenCalledWith('lin_api_valid');
            expect(authService.isAuthenticated).toBe(true);
        });
    });
});
```

### Test Coverage

Unit tests organized by service:

| Service | Test File | Test Count |
|---------|-----------|------------|
| AuthService | `test/unit/auth/authService.test.ts` | ~8 |
| CredentialManager | `test/unit/auth/credentialManager.test.ts` | ~4 |
| LinearClientManager | `test/unit/linear/linearClientManager.test.ts` | ~6 |
| IssueService | `test/unit/linear/issueService.test.ts` | ~16 |
| GitService | `test/unit/git/gitService.test.ts` | ~10 |
| IssuesTreeProvider | `test/unit/views/issuesTreeProvider.test.ts` | ~16 |
| StartWorkCommand | `test/unit/commands/startWorkCommand.test.ts` | ~4 |
| IssueWebviewController | `test/unit/views/issueWebviewController.test.ts` | ~10 |
| IssueWebviewManager | `test/unit/views/issueWebviewManager.test.ts` | ~5 |

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
    },
}
```

## Key Test Scenarios

### AuthService Tests

```gherkin
Feature: AuthService Authentication Management

  Scenario: Initialize with no stored credentials
    Given no API key is stored in SecretStorage
    When the AuthService initializes
    Then isAuthenticated should be false

  Scenario: Initialize with valid stored credentials
    Given an API key "lin_api_valid123" is stored
    And the Linear API returns viewer data
    When the AuthService initializes
    Then isAuthenticated should be true
    And currentUser should be populated

  Scenario: Authenticate with valid API key
    Given user enters API key "lin_api_newkey" in input box
    And the Linear API validates successfully
    When authenticate() is called
    Then the API key should be stored
    And onDidChangeAuthentication should fire with true

  Scenario: Authenticate with invalid format
    Given user enters API key "invalid_format"
    When authenticate() is called
    Then validateInput should return error message
    And the API key should NOT be stored

  Scenario: Logout clears credentials
    Given the user is authenticated
    When logout() is called
    Then the API key should be deleted
    And onDidChangeAuthentication should fire with false
```

### IssueService Tests

```gherkin
Feature: IssueService Issue Fetching

  Scenario: Fetch assigned issues
    Given the Linear API returns issues
    When getMyAssignedIssues is called
    Then it should return IssueDTO objects

  Scenario: Cache hit within TTL
    Given issues were fetched 30 seconds ago
    When getMyAssignedIssues is called again
    Then cached results should be returned
    And Linear API should NOT be called

  Scenario: Cache miss after TTL
    Given issues were fetched 61 seconds ago
    When getMyAssignedIssues is called
    Then Linear API should be called
    And new results should be cached

  Scenario: Handle pagination
    Given Linear API returns more than 50 issues
    When getMyAssignedIssues is called
    Then all pages should be fetched
```

### GitService Tests

```gherkin
Feature: GitService Branch Creation

  Scenario: Create new branch
    Given no branch named "feature/eng-123" exists
    When createBranch("feature/eng-123") is called
    Then repo.createBranch should be called
    And success message should be shown

  Scenario: Checkout existing local branch
    Given branch "feature/eng-123" already exists locally
    When createBranch("feature/eng-123") is called
    Then repo.checkout should be called
    And repo.createBranch should NOT be called

  Scenario: No repository available
    Given no Git repository is open
    When createBranch is called
    Then error message should be shown
    And it should return false
```

## Integration Testing

### Setup

Integration tests run in a real VS Code environment:

```typescript
// test/integration/index.ts
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
    });
}
```

### Integration Test Scenarios

```gherkin
Feature: Extension Activation

  Scenario: Extension is present
    When querying for extension "linear-studio.linear-studio"
    Then the extension should be found

  Scenario: Extension activates
    When the extension activates
    Then ext.isActive should be true

  Scenario: Commands are registered
    When getting all registered commands
    Then all 10 Linear Studio commands should exist

  Scenario: Tree view is registered
    When focusing view "linearStudio.issues"
    Then no error should be thrown
```

## E2E Testing

### Playwright Setup

E2E tests run the webview UI in a browser:

```typescript
// playwright.config.ts
export default defineConfig({
    testDir: './test/e2e',
    use: {
        baseURL: 'http://localhost:5173',
    },
    webServer: {
        command: 'cd webview-ui && pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
    },
});
```

### E2E Test Scenarios

```gherkin
Feature: Issue Webview Rendering

  Scenario: Issue header displays correctly
    Given the webview is loaded with mock issue data
    Then issue title should be visible
    And issue identifier should be visible
    And status badge should be visible

  Scenario: Comments are displayed
    Given issue has 3 comments
    Then 3 comment elements should be visible
    And each should show author and body

  Scenario: Start Working button triggers action
    When clicking the "Start Working" button
    Then postMessage should be sent with type "startWork"

  Scenario: Loading state
    Given webview receives loading message
    Then loading indicator should be visible

  Scenario: Error state with retry
    Given webview receives error message
    Then error message should be displayed
    And retry button should be visible
```

## CI/CD Integration

GitHub Actions workflow runs all tests:

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage

  integration-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: xvfb-run -a pnpm test:integration  # Linux
        if: matrix.os == 'ubuntu-latest'
      - run: pnpm test:integration              # macOS/Windows
        if: matrix.os != 'ubuntu-latest'

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: cd webview-ui && pnpm install
      - run: pnpm exec playwright install chromium --with-deps
      - run: pnpm test:e2e
```

## Writing New Tests

### Adding Unit Tests

1. Create test file in `test/unit/<category>/<service>.test.ts`
2. Import from Vitest: `import { describe, it, expect, vi, beforeEach } from 'vitest'`
3. Mock dependencies using `vi.mock()` or manual mocks
4. Follow Given-When-Then pattern
5. Run with `pnpm test:unit`

### Adding Integration Tests

1. Create test file in `test/integration/<feature>.test.ts`
2. Use Mocha syntax (VS Code test framework)
3. Test against real VS Code APIs
4. Run with `pnpm test:integration`

### Adding E2E Tests

1. Create test file in `test/e2e/<feature>.spec.ts`
2. Use Playwright's test syntax
3. Add mock data in `test/e2e/fixtures/`
4. Run with `pnpm test:e2e`

## Debugging Tests

### Unit Tests

```bash
# Run single test file
pnpm test:unit test/unit/auth/authService.test.ts

# Run tests matching pattern
pnpm test:unit -t "authenticate"

# Debug with breakpoints
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### Integration Tests

1. Open VS Code in the project
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Extension Tests"
4. Press F5

### E2E Tests

```bash
# Run with browser visible
pnpm test:e2e --headed

# Run single test
pnpm test:e2e test/e2e/webview.spec.ts

# Debug mode
pnpm test:e2e --debug
```

## Test Data and Fixtures

### Mock Issue Data

```typescript
// test/e2e/fixtures/mockData.ts
export const mockIssue: IssueDetailsDTO = {
    id: 'issue-1',
    identifier: 'ENG-142',
    title: 'Add user avatar component',
    description: '# Overview\nImplement avatar component...',
    state: {
        id: 'state-1',
        name: 'In Progress',
        type: 'started',
        color: '#f2c94c',
    },
    priority: 2,
    priorityLabel: 'High',
    labels: [{ id: 'label-1', name: 'frontend', color: '#5e6ad2' }],
    comments: [
        {
            id: 'comment-1',
            body: 'Looking good!',
            createdAt: '2024-01-15T10:00:00Z',
            user: { id: 'user-1', name: 'Sarah', email: 'sarah@test.com' },
        },
    ],
    // ...
};
```

## Common Testing Patterns

### Mocking VS Code API

```typescript
// Mock showInputBox
vi.mocked(vscode.window.showInputBox).mockResolvedValue('user input');

// Mock showQuickPick
vi.mocked(vscode.window.showQuickPick).mockResolvedValue({ label: 'Option 1' });

// Mock commands
vi.mocked(vscode.commands.executeCommand).mockResolvedValue(undefined);
```

### Mocking Linear Client

```typescript
const mockClient = {
    viewer: Promise.resolve({
        id: 'user-1',
        name: 'Test User',
        assignedIssues: vi.fn().mockResolvedValue({
            nodes: [mockIssue],
            pageInfo: { hasNextPage: false },
        }),
    }),
};
vi.mocked(LinearClient).mockImplementation(() => mockClient as any);
```

### Testing EventEmitters

```typescript
it('should fire event on authentication', async () => {
    const listener = vi.fn();
    authService.onDidChangeAuthentication(listener);

    await authService.authenticate();

    expect(listener).toHaveBeenCalledWith(true);
});
```
