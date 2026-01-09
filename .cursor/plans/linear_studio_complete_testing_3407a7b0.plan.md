---
name: Linear Studio Complete Testing
overview: Complete the Linear Studio VS Code extension by implementing comprehensive testing infrastructure with detailed BDD specifications for unit, integration, and E2E tests, plus CI/CD pipeline and remaining features.
todos:
  - id: unit-auth-init-no-creds
    content: "AuthService: test initialize() with no stored credentials returns isAuthenticated=false"
    status: completed
  - id: unit-auth-init-valid
    content: "AuthService: test initialize() with valid stored key sets isAuthenticated=true and currentUser"
    status: completed
  - id: unit-auth-init-invalid
    content: "AuthService: test initialize() with invalid stored key deletes key and sets isAuthenticated=false"
    status: completed
  - id: unit-auth-authenticate-valid
    content: "AuthService: test authenticate() with valid key stores key, fires event, shows success message"
    status: completed
  - id: unit-auth-authenticate-invalid-format
    content: "AuthService: test authenticate() rejects keys not starting with lin_api_"
    status: completed
  - id: unit-auth-authenticate-cancel
    content: "AuthService: test authenticate() returns false when user cancels input box"
    status: completed
  - id: unit-auth-authenticate-api-error
    content: "AuthService: test authenticate() shows error message when Linear API rejects key"
    status: completed
  - id: unit-auth-logout
    content: "AuthService: test logout() deletes key, fires event, clears currentUser, shows message"
    status: completed
  - id: validate-auth-tests
    content: Run pnpm test:unit and verify all 8 AuthService tests pass
    status: in_progress
    dependencies:
      - unit-auth-init-no-creds
      - unit-auth-init-valid
      - unit-auth-init-invalid
      - unit-auth-authenticate-valid
      - unit-auth-authenticate-invalid-format
      - unit-auth-authenticate-cancel
      - unit-auth-authenticate-api-error
      - unit-auth-logout
  - id: unit-cred-store
    content: "CredentialManager: test setApiKey calls secrets.store with correct key"
    status: completed
  - id: unit-cred-retrieve
    content: "CredentialManager: test getApiKey returns stored value from SecretStorage"
    status: completed
  - id: unit-cred-retrieve-empty
    content: "CredentialManager: test getApiKey returns undefined when no key stored"
    status: completed
  - id: unit-cred-delete
    content: "CredentialManager: test deleteApiKey calls secrets.delete"
    status: completed
  - id: validate-cred-tests
    content: Run pnpm test:unit and verify all 4 CredentialManager tests pass
    status: in_progress
    dependencies:
      - unit-cred-store
      - unit-cred-retrieve
      - unit-cred-retrieve-empty
      - unit-cred-delete
  - id: unit-client-get-authenticated
    content: "LinearClientManager: test getClient returns LinearClient when API key exists"
    status: completed
  - id: unit-client-get-cached
    content: "LinearClientManager: test getClient returns cached instance on subsequent calls"
    status: completed
  - id: unit-client-get-unauthenticated
    content: "LinearClientManager: test getClient throws error when no API key"
    status: completed
  - id: unit-client-has-creds-true
    content: "LinearClientManager: test hasCredentials returns true when key exists"
    status: completed
  - id: unit-client-has-creds-false
    content: "LinearClientManager: test hasCredentials returns false when no key"
    status: completed
  - id: unit-client-reset
    content: "LinearClientManager: test reset clears cached client"
    status: completed
  - id: validate-client-tests
    content: Run pnpm test:unit and verify all 6 LinearClientManager tests pass
    status: in_progress
    dependencies:
      - unit-client-get-authenticated
      - unit-client-get-cached
      - unit-client-get-unauthenticated
      - unit-client-has-creds-true
      - unit-client-has-creds-false
      - unit-client-reset
  - id: unit-issue-fetch-no-filter
    content: "IssueService: test getMyAssignedIssues without filter returns all issues as DTOs"
    status: completed
  - id: unit-issue-fetch-cycle-filter
    content: "IssueService: test getMyAssignedIssues with cycleId filter passes correct API filter"
    status: completed
  - id: unit-issue-fetch-project-filter
    content: "IssueService: test getMyAssignedIssues with projectId filter passes correct API filter"
    status: completed
  - id: unit-issue-fetch-team-filter
    content: "IssueService: test getMyAssignedIssues with teamId filter passes correct API filter"
    status: completed
  - id: unit-issue-fetch-combined-filters
    content: "IssueService: test getMyAssignedIssues with multiple filters combines them correctly"
    status: completed
  - id: unit-issue-cache-hit
    content: "IssueService: test cache returns data within 60s TTL without API call"
    status: completed
  - id: unit-issue-cache-miss-ttl
    content: "IssueService: test cache expired after 60s triggers new API call"
    status: completed
  - id: unit-issue-cache-different-keys
    content: "IssueService: test different filters use separate cache entries"
    status: completed
  - id: unit-issue-pagination
    content: "IssueService: test pagination fetches all pages when hasNextPage is true"
    status: completed
  - id: unit-issue-clear-cache
    content: "IssueService: test clearCache empties the cache map"
    status: completed
  - id: unit-issue-to-dto
    content: "IssueService: test toIssueDTO maps all properties including dates as ISO strings"
    status: completed
  - id: unit-issue-with-comments
    content: "IssueService: test getIssueWithComments returns issue with comments array"
    status: completed
  - id: unit-issue-comments-pagination
    content: "IssueService: test getIssueWithComments paginates comments over 50"
    status: completed
  - id: unit-issue-branch-name
    content: "IssueService: test getBranchName returns issue.branchName from API"
    status: completed
  - id: unit-issue-get-cycles
    content: "IssueService: test getActiveCycles returns array of cycle objects"
    status: completed
  - id: unit-issue-get-projects
    content: "IssueService: test getProjects returns array of project objects"
    status: completed
  - id: validate-issue-tests
    content: Run pnpm test:unit and verify all 16 IssueService tests pass
    status: in_progress
    dependencies:
      - unit-issue-fetch-no-filter
      - unit-issue-fetch-cycle-filter
      - unit-issue-fetch-project-filter
      - unit-issue-fetch-team-filter
      - unit-issue-fetch-combined-filters
      - unit-issue-cache-hit
      - unit-issue-cache-miss-ttl
      - unit-issue-cache-different-keys
      - unit-issue-pagination
      - unit-issue-clear-cache
      - unit-issue-to-dto
      - unit-issue-with-comments
      - unit-issue-comments-pagination
      - unit-issue-branch-name
      - unit-issue-get-cycles
      - unit-issue-get-projects
  - id: unit-git-get-single-repo
    content: "GitService: test getRepository returns repo when single repo exists"
    status: completed
  - id: unit-git-get-no-repo
    content: "GitService: test getRepository returns undefined when no repos"
    status: completed
  - id: unit-git-get-multi-repo-active
    content: "GitService: test getRepository returns repo containing active file"
    status: completed
  - id: unit-git-get-multi-repo-no-active
    content: "GitService: test getRepository returns first repo when no active file"
    status: completed
  - id: unit-git-extension-unavailable
    content: "GitService: test getRepository returns undefined when git extension missing"
    status: completed
  - id: unit-git-create-new-branch
    content: "GitService: test createBranch creates new branch and shows success message"
    status: completed
  - id: unit-git-checkout-local
    content: "GitService: test createBranch checks out existing local branch"
    status: completed
  - id: unit-git-checkout-remote
    content: "GitService: test createBranch checks out existing remote branch"
    status: completed
  - id: unit-git-create-fails
    content: "GitService: test createBranch returns false and shows error on Git failure"
    status: completed
  - id: unit-git-no-repo-error
    content: "GitService: test createBranch shows error when no repository"
    status: completed
  - id: validate-git-tests
    content: Run pnpm test:unit and verify all 10 GitService tests pass
    status: in_progress
    dependencies:
      - unit-git-get-single-repo
      - unit-git-get-no-repo
      - unit-git-get-multi-repo-active
      - unit-git-get-multi-repo-no-active
      - unit-git-extension-unavailable
      - unit-git-create-new-branch
      - unit-git-checkout-local
      - unit-git-checkout-remote
      - unit-git-create-fails
      - unit-git-no-repo-error
  - id: unit-tree-group-by-cycle
    content: "TreeProvider: test getChildren groups issues by cycle into CycleNodes"
    status: completed
  - id: unit-tree-cycle-sort
    content: "TreeProvider: test cycles are sorted alphabetically with Backlog last"
    status: completed
  - id: unit-tree-cycle-children
    content: "TreeProvider: test getChildren(CycleNode) returns its IssueNode children"
    status: completed
  - id: unit-tree-issue-children
    content: "TreeProvider: test getChildren(IssueNode) returns empty array"
    status: completed
  - id: unit-tree-empty-issues
    content: "TreeProvider: test empty issues array returns empty array (welcome view handles it)"
    status: completed
  - id: unit-tree-fetch-error
    content: "TreeProvider: test error fetching issues shows error message and returns empty"
    status: completed
  - id: unit-tree-set-filter-cycle
    content: "TreeProvider: test setFilter with cycleId clears cache and fires event"
    status: completed
  - id: unit-tree-set-filter-project
    content: "TreeProvider: test setFilter with projectId passes filter to IssueService"
    status: completed
  - id: unit-tree-clear-filters
    content: "TreeProvider: test setFilter({}) clears all filters"
    status: completed
  - id: unit-tree-refresh-no-cache
    content: "TreeProvider: test refresh(false) fires event without clearing cache"
    status: completed
  - id: unit-tree-refresh-with-cache
    content: "TreeProvider: test refresh(true) clears cache and fires event"
    status: completed
  - id: unit-tree-issuenode-props
    content: "IssueNode: test label, description, id, contextValue, command are set correctly"
    status: completed
  - id: unit-tree-issuenode-icon-completed
    content: "IssueNode: test completed state shows 'pass' icon with green color"
    status: completed
  - id: unit-tree-issuenode-icon-started
    content: "IssueNode: test started state shows 'play-circle' icon with blue color"
    status: completed
  - id: unit-tree-issuenode-icon-unstarted
    content: "IssueNode: test unstarted state shows 'circle-outline' icon"
    status: completed
  - id: unit-tree-cyclenode-props
    content: "CycleNode: test label includes date range, description shows issue count"
    status: completed
  - id: validate-tree-tests
    content: Run pnpm test:unit and verify all 16 TreeProvider tests pass
    status: in_progress
    dependencies:
      - unit-tree-group-by-cycle
      - unit-tree-cycle-sort
      - unit-tree-cycle-children
      - unit-tree-issue-children
      - unit-tree-empty-issues
      - unit-tree-fetch-error
      - unit-tree-set-filter-cycle
      - unit-tree-set-filter-project
      - unit-tree-clear-filters
      - unit-tree-refresh-no-cache
      - unit-tree-refresh-with-cache
      - unit-tree-issuenode-props
      - unit-tree-issuenode-icon-completed
      - unit-tree-issuenode-icon-started
      - unit-tree-issuenode-icon-unstarted
      - unit-tree-cyclenode-props
  - id: unit-startwork-create-branch
    content: "StartWork: test user confirms 'Create Branch' calls GitService.createBranch"
    status: completed
  - id: unit-startwork-create-copy
    content: "StartWork: test 'Create Branch & Copy' also copies branch name to clipboard"
    status: completed
  - id: unit-startwork-cancel
    content: "StartWork: test user canceling dialog does not call createBranch"
    status: completed
  - id: unit-startwork-fail
    content: "StartWork: test branch creation failure does not copy to clipboard"
    status: completed
  - id: validate-startwork-tests
    content: Run pnpm test:unit and verify all 4 StartWork tests pass
    status: in_progress
    dependencies:
      - unit-startwork-create-branch
      - unit-startwork-create-copy
      - unit-startwork-cancel
      - unit-startwork-fail
  - id: unit-webview-ctrl-panel-config
    content: "WebviewController: test panel created with correct viewType, title, options"
    status: completed
  - id: unit-webview-ctrl-title-truncate
    content: "WebviewController: test long titles are truncated with ellipsis"
    status: completed
  - id: unit-webview-ctrl-show-reveal
    content: "WebviewController: test show() calls panel.reveal()"
    status: completed
  - id: unit-webview-ctrl-ready-msg
    content: "WebviewController: test 'ready' message triggers getIssueWithComments and posts update"
    status: completed
  - id: unit-webview-ctrl-startwork-msg
    content: "WebviewController: test 'startWork' message executes startWork command"
    status: completed
  - id: unit-webview-ctrl-browser-msg
    content: "WebviewController: test 'openInBrowser' message opens external URL"
    status: completed
  - id: unit-webview-ctrl-refresh-msg
    content: "WebviewController: test 'refresh' message reloads issue data"
    status: completed
  - id: unit-webview-ctrl-error
    content: "WebviewController: test error loading issue posts error message to webview"
    status: completed
  - id: unit-webview-ctrl-dispose
    content: "WebviewController: test disposal calls onDisposeCallback and cleans up"
    status: completed
  - id: unit-webview-ctrl-csp
    content: "WebviewController: test HTML includes CSP with nonce and correct sources"
    status: completed
  - id: validate-webview-ctrl-tests
    content: Run pnpm test:unit and verify all 10 WebviewController tests pass
    status: in_progress
    dependencies:
      - unit-webview-ctrl-panel-config
      - unit-webview-ctrl-title-truncate
      - unit-webview-ctrl-show-reveal
      - unit-webview-ctrl-ready-msg
      - unit-webview-ctrl-startwork-msg
      - unit-webview-ctrl-browser-msg
      - unit-webview-ctrl-refresh-msg
      - unit-webview-ctrl-error
      - unit-webview-ctrl-dispose
      - unit-webview-ctrl-csp
  - id: unit-webview-mgr-new-issue
    content: "WebviewManager: test showIssue creates new controller for new issue"
    status: completed
  - id: unit-webview-mgr-reuse
    content: "WebviewManager: test showIssue reuses existing controller for same issue"
    status: completed
  - id: unit-webview-mgr-different
    content: "WebviewManager: test showIssue creates separate controllers for different issues"
    status: completed
  - id: unit-webview-mgr-dispose-removes
    content: "WebviewManager: test controller disposal removes it from controllers map"
    status: completed
  - id: unit-webview-mgr-dispose-all
    content: "WebviewManager: test manager dispose cleans up all controllers"
    status: completed
  - id: validate-webview-mgr-tests
    content: Run pnpm test:unit and verify all 5 WebviewManager tests pass
    status: in_progress
    dependencies:
      - unit-webview-mgr-new-issue
      - unit-webview-mgr-reuse
      - unit-webview-mgr-different
      - unit-webview-mgr-dispose-removes
      - unit-webview-mgr-dispose-all
  - id: validate-all-unit-tests
    content: Run pnpm test:unit and verify all ~81 unit tests pass with coverage thresholds met
    status: in_progress
    dependencies:
      - validate-auth-tests
      - validate-cred-tests
      - validate-client-tests
      - validate-issue-tests
      - validate-git-tests
      - validate-tree-tests
      - validate-startwork-tests
      - validate-webview-ctrl-tests
      - validate-webview-mgr-tests
  - id: integration-setup-config
    content: Create .vscode-test.js with test runner configuration
    status: completed
  - id: integration-setup-index
    content: Create test/integration/index.ts as test entry point
    status: completed
  - id: integration-ext-present
    content: "Integration: test extension linear-studio.linear-studio is present"
    status: completed
  - id: integration-ext-activates
    content: "Integration: test extension activates without errors"
    status: completed
  - id: integration-commands-registered
    content: "Integration: test all 10 commands are registered"
    status: completed
  - id: integration-treeview-registered
    content: "Integration: test linearStudio.issues tree view exists"
    status: completed
  - id: integration-auth-context
    content: "Integration: test context linear-studio.authenticated is set correctly"
    status: completed
  - id: integration-auth-command
    content: "Integration: test authenticate command can be executed without error"
    status: completed
  - id: validate-integration-tests
    content: Run pnpm test:integration and verify all 6 integration tests pass
    status: pending
    dependencies:
      - integration-setup-config
      - integration-setup-index
      - integration-ext-present
      - integration-ext-activates
      - integration-commands-registered
      - integration-treeview-registered
      - integration-auth-context
      - integration-auth-command
  - id: e2e-setup-playwright
    content: Create playwright.config.ts with Chrome config and webServer setup
    status: completed
  - id: e2e-setup-fixtures
    content: Create test/e2e/fixtures/mockData.ts with mock IssueDetailsDTO
    status: completed
  - id: e2e-webview-header
    content: "E2E: test issue header displays title, identifier, status badge"
    status: completed
  - id: e2e-webview-description
    content: "E2E: test description section renders markdown content"
    status: completed
  - id: e2e-webview-comments
    content: "E2E: test comments display with author and body"
    status: completed
  - id: e2e-webview-sidebar
    content: "E2E: test sidebar shows status, priority, assignee, labels"
    status: completed
  - id: e2e-webview-startwork-btn
    content: "E2E: test Start Working button sends postMessage"
    status: completed
  - id: e2e-webview-browser-btn
    content: "E2E: test Open in Linear button sends postMessage"
    status: completed
  - id: e2e-webview-refresh-btn
    content: "E2E: test Refresh button sends postMessage"
    status: completed
  - id: e2e-webview-loading
    content: "E2E: test loading state displays spinner"
    status: completed
  - id: e2e-webview-error
    content: "E2E: test error state displays error message and retry button"
    status: completed
  - id: e2e-webview-retry
    content: "E2E: test retry button sends refresh message"
    status: completed
  - id: validate-e2e-tests
    content: Run pnpm test:e2e and verify all 10 E2E tests pass
    status: pending
    dependencies:
      - e2e-setup-playwright
      - e2e-setup-fixtures
      - e2e-webview-header
      - e2e-webview-description
      - e2e-webview-comments
      - e2e-webview-sidebar
      - e2e-webview-startwork-btn
      - e2e-webview-browser-btn
      - e2e-webview-refresh-btn
      - e2e-webview-loading
      - e2e-webview-error
      - e2e-webview-retry
  - id: ci-workflow-test
    content: Create .github/workflows/test.yml with lint, typecheck, unit, integration jobs
    status: completed
  - id: ci-workflow-matrix
    content: Add matrix strategy for Node 20 on ubuntu-latest, macos-latest, windows-latest
    status: completed
  - id: ci-workflow-cache
    content: Configure pnpm caching in CI workflow
    status: completed
  - id: ci-workflow-coverage
    content: Add coverage artifact upload step to CI workflow
    status: completed
  - id: validate-ci
    content: Push to branch and verify GitHub Actions workflow runs successfully
    status: pending
    dependencies:
      - ci-workflow-test
      - ci-workflow-matrix
      - ci-workflow-cache
      - ci-workflow-coverage
  - id: auto-refresh-timer
    content: Implement auto-refresh timer in Container using config interval
    status: completed
  - id: auto-refresh-config-change
    content: Add config change listener to reset timer when interval changes
    status: completed
  - id: auto-refresh-dispose
    content: Add timer disposal in Container.dispose()
    status: completed
  - id: auto-refresh-tests
    content: Add unit tests for auto-refresh timer behavior
    status: completed
  - id: validate-auto-refresh
    content: Manually test auto-refresh at 60s interval and verify tree updates
    status: pending
    dependencies:
      - auto-refresh-timer
      - auto-refresh-config-change
      - auto-refresh-dispose
      - auto-refresh-tests
  - id: polish-vscodeignore
    content: Create .vscodeignore excluding test/, *.map, .github/, node_modules/
    status: completed
  - id: polish-gitignore
    content: Verify .gitignore includes dist/, node_modules/, *.vsix, coverage/
    status: completed
  - id: polish-icon
    content: Add placeholder images/icon.png (128x128) for extension
    status: pending
  - id: polish-fixtures
    content: Add test/fixtures/test-workspace/.gitkeep placeholder
    status: completed
  - id: validate-build
    content: Run pnpm build and verify extension compiles without errors
    status: pending
    dependencies:
      - polish-vscodeignore
      - polish-gitignore
      - polish-icon
      - polish-fixtures
  - id: final-validation
    content: Run full test suite (pnpm test) and verify all tests pass with coverage thresholds
    status: pending
    dependencies:
      - validate-all-unit-tests
      - validate-integration-tests
      - validate-e2e-tests
      - validate-ci
      - validate-auto-refresh
      - validate-build
---

# Linear Studio Extension - Complete Testing Implementation Plan

## Gap Analysis Summary

The core extension functionality is complete, but **testing infrastructure is entirely missing**. This plan provides exhaustive BDD test specifications.

---

## Phase 1: Unit Tests

### 1.1 AuthService Tests

**File:** `test/unit/auth/authService.test.ts`

```gherkin
Feature: AuthService Authentication Management

  Background:
    Given a mock CredentialManager
    And a new AuthService instance

  Scenario: Initialize with no stored credentials
    Given no API key is stored in SecretStorage
    When the AuthService initializes
    Then isAuthenticated should be false
    And currentUser should be undefined

  Scenario: Initialize with valid stored credentials
    Given an API key "lin_api_valid123" is stored
    And the Linear API returns viewer { id: "user-1", name: "John", email: "john@test.com" }
    When the AuthService initializes
    Then isAuthenticated should be true
    And currentUser.name should be "John"
    And currentUser.email should be "john@test.com"

  Scenario: Initialize with expired/invalid stored credentials
    Given an API key "lin_api_expired" is stored
    And the Linear API throws an authentication error
    When the AuthService initializes
    Then isAuthenticated should be false
    And the stored API key should be deleted
    And currentUser should be undefined

  Scenario: Authenticate with valid API key
    Given user enters API key "lin_api_newkey123" in input box
    And the Linear API returns viewer { id: "user-2", name: "Jane", email: "jane@test.com" }
    When authenticate() is called
    Then it should return true
    And the API key should be stored in SecretStorage
    And isAuthenticated should be true
    And currentUser.name should be "Jane"
    And onDidChangeAuthentication should fire with true

  Scenario: Authenticate with invalid API key format
    Given user enters API key "invalid_key_format" in input box
    When authenticate() is called
    Then validateInput should return "API key should start with lin_api_"
    And the API key should NOT be stored
    And isAuthenticated should remain false

  Scenario: Authenticate with empty input (user cancels)
    Given user cancels the input box (returns undefined)
    When authenticate() is called
    Then it should return false
    And isAuthenticated should remain false

  Scenario: Authenticate with API key that fails validation
    Given user enters API key "lin_api_bad" in input box
    And the Linear API throws "Invalid API key" error
    When authenticate() is called
    Then it should return false
    And an error message "Invalid API key. Please check your key and try again." should be shown
    And the API key should NOT be stored

  Scenario: Logout when authenticated
    Given the user is authenticated as "John"
    When logout() is called
    Then the API key should be deleted from SecretStorage
    And isAuthenticated should be false
    And currentUser should be undefined
    And onDidChangeAuthentication should fire with false
    And an info message "Logged out from Linear" should be shown
```

### 1.2 CredentialManager Tests

**File:** `test/unit/auth/credentialManager.test.ts`

```gherkin
Feature: CredentialManager Secret Storage

  Background:
    Given a mock SecretStorage
    And a new CredentialManager instance

  Scenario: Store API key
    When setApiKey is called with "lin_api_test123"
    Then secrets.store should be called with key "linear-studio.apiKey" and value "lin_api_test123"

  Scenario: Retrieve stored API key
    Given SecretStorage contains "lin_api_stored" for key "linear-studio.apiKey"
    When getApiKey is called
    Then it should return "lin_api_stored"

  Scenario: Retrieve when no API key stored
    Given SecretStorage has no value for key "linear-studio.apiKey"
    When getApiKey is called
    Then it should return undefined

  Scenario: Delete API key
    When deleteApiKey is called
    Then secrets.delete should be called with key "linear-studio.apiKey"
```

### 1.3 LinearClientManager Tests

**File:** `test/unit/linear/linearClientManager.test.ts`

```gherkin
Feature: LinearClientManager Client Lifecycle

  Background:
    Given a mock CredentialManager
    And a new LinearClientManager instance

  Scenario: Get client when authenticated
    Given CredentialManager returns API key "lin_api_valid"
    When getClient is called
    Then it should return a LinearClient instance
    And the client should be cached for subsequent calls

  Scenario: Get client reuses cached instance
    Given a LinearClient was previously created
    When getClient is called again
    Then it should return the same cached instance
    And CredentialManager.getApiKey should NOT be called again

  Scenario: Get client when not authenticated
    Given CredentialManager returns undefined (no API key)
    When getClient is called
    Then it should throw Error "Not authenticated. Please authenticate with Linear first."

  Scenario: Check hasCredentials when API key exists
    Given CredentialManager returns API key "lin_api_exists"
    When hasCredentials is called
    Then it should return true

  Scenario: Check hasCredentials when no API key
    Given CredentialManager returns undefined
    When hasCredentials is called
    Then it should return false

  Scenario: Reset clears cached client
    Given a LinearClient was previously cached
    When reset is called
    Then the cached client should be cleared
    And the next getClient call should create a new client
```

### 1.4 IssueService Tests

**File:** `test/unit/linear/issueService.test.ts`

```gherkin
Feature: IssueService Issue Fetching

  Background:
    Given a mock LinearClientManager
    And a new IssueService instance
    And mock issues:
      | id | identifier | title           | state.type | cycle.id | cycle.name |
      | 1  | ENG-101    | Fix login bug   | started    | c1       | Sprint 1   |
      | 2  | ENG-102    | Add dashboard   | unstarted  | c1       | Sprint 1   |
      | 3  | ENG-103    | Refactor API    | backlog    | null     | null       |

  Scenario: Fetch assigned issues without filters
    Given the Linear API returns all mock issues
    When getMyAssignedIssues is called with no filter
    Then it should return 3 IssueDTO objects
    And each DTO should have id, identifier, title, state, cycle, labels array

  Scenario: Fetch issues with cycle filter
    Given filter { cycleId: "c1" }
    When getMyAssignedIssues is called
    Then the API should be called with filter { cycle: { id: { eq: "c1" } } }
    And it should return only issues with cycle.id = "c1"

  Scenario: Fetch issues with project filter
    Given filter { projectId: "p1" }
    When getMyAssignedIssues is called
    Then the API should be called with filter { project: { id: { eq: "p1" } } }

  Scenario: Fetch issues with team filter
    Given filter { teamId: "team-1" }
    When getMyAssignedIssues is called
    Then the API should be called with filter { team: { id: { eq: "team-1" } } }

  Scenario: Fetch issues with combined filters
    Given filter { cycleId: "c1", projectId: "p1", teamId: "t1" }
    When getMyAssignedIssues is called
    Then the API should be called with all three filter conditions

  Scenario: Cache hit within TTL
    Given getMyAssignedIssues was called 30 seconds ago with no filter
    When getMyAssignedIssues is called again with no filter
    Then it should return cached results
    And the Linear API should NOT be called again

  Scenario: Cache miss after TTL expires
    Given getMyAssignedIssues was called 61 seconds ago (TTL is 60s)
    When getMyAssignedIssues is called again with no filter
    Then the Linear API should be called
    And new results should be cached

  Scenario: Different filters use different cache keys
    Given getMyAssignedIssues was called with { cycleId: "c1" }
    When getMyAssignedIssues is called with { cycleId: "c2" }
    Then the Linear API should be called (cache miss)
    And both results should be cached separately

  Scenario: Handle pagination for more than 50 issues
    Given the Linear API returns:
      | Page | nodes count | hasNextPage |
      | 1    | 50          | true        |
      | 2    | 25          | false       |
    When getMyAssignedIssues is called
    Then fetchNext should be called once
    And it should return 75 IssueDTO objects total

  Scenario: Clear cache on refresh
    Given issues are cached
    When clearCache is called
    Then the cache should be empty
    And the next getMyAssignedIssues should call the API

  Scenario: Convert Issue to IssueDTO correctly
    Given a Linear Issue with:
      | property      | value                          |
      | id            | "issue-1"                       |
      | identifier    | "ENG-142"                       |
      | title         | "Add user avatar"               |
      | description   | "Implement avatar component"    |
      | priority      | 2                               |
      | priorityLabel | "High"                          |
      | url           | "https://linear.app/..."        |
      | branchName    | "user/eng-142-add-user-avatar"  |
      | state.type    | "started"                       |
      | state.name    | "In Progress"                   |
      | state.color   | "#f2c94c"                       |
    When toIssueDTO is called
    Then the returned DTO should have all properties mapped correctly
    And dates should be ISO string format
    And labels should be an array

Feature: IssueService Issue Details

  Scenario: Fetch issue with comments
    Given issue "issue-1" exists with 3 comments
    When getIssueWithComments("issue-1") is called
    Then it should return IssueDetailsDTO with comments array of length 3
    And each comment should have id, body, createdAt, user

  Scenario: Fetch issue with paginated comments (>50)
    Given issue "issue-1" has 75 comments
    When getIssueWithComments("issue-1") is called
    Then it should fetch all 75 comments via pagination
    And the returned DTO should have 75 comments

  Scenario: Get branch name for issue
    Given issue "issue-1" has branchName "user/eng-142-add-avatar"
    When getBranchName("issue-1") is called
    Then it should return "user/eng-142-add-avatar"

Feature: IssueService Metadata Fetching

  Scenario: Get active cycles
    Given 3 active cycles exist:
      | id | name     | startsAt   | endsAt     |
      | c1 | Sprint 1 | 2024-01-01 | 2024-01-14 |
      | c2 | Sprint 2 | 2024-01-15 | 2024-01-28 |
      | c3 | Sprint 3 | 2024-01-29 | 2024-02-11 |
    When getActiveCycles is called
    Then it should return 3 cycle objects with id, name, startsAt, endsAt

  Scenario: Get projects
    Given 2 projects exist:
      | id | name      |
      | p1 | Frontend  |
      | p2 | Backend   |
    When getProjects is called
    Then it should return 2 project objects with id and name
```

### 1.5 GitService Tests

**File:** `test/unit/git/gitService.test.ts`

```gherkin
Feature: GitService Repository Access

  Background:
    Given a mock VS Code Git extension

  Scenario: Get repository when single repo exists
    Given 1 Git repository is open
    When getRepository is called
    Then it should return that repository

  Scenario: Get repository when no repos exist
    Given 0 Git repositories are open
    When getRepository is called
    Then it should return undefined

  Scenario: Get repository for active file when multiple repos
    Given 3 Git repositories are open at:
      | rootUri                    |
      | /Users/dev/project-a       |
      | /Users/dev/project-b       |
      | /Users/dev/project-c       |
    And the active file is at "/Users/dev/project-b/src/index.ts"
    When getRepository is called
    Then it should return the repository at "/Users/dev/project-b"

  Scenario: Get first repository when multiple repos and no active file
    Given 2 Git repositories are open
    And no file is open in the editor
    When getRepository is called
    Then it should return the first repository

  Scenario: Git extension not available
    Given the vscode.git extension is not installed
    When getRepository is called
    Then it should return undefined

Feature: GitService Branch Creation

  Background:
    Given a mock Git repository

  Scenario: Create new branch successfully
    Given no branch named "user/eng-123-fix-bug" exists
    When createBranch("user/eng-123-fix-bug") is called
    Then repo.createBranch should be called with ("user/eng-123-fix-bug", true)
    And it should return true
    And an info message "Created and switched to branch: user/eng-123-fix-bug" should be shown

  Scenario: Checkout existing local branch
    Given a local branch "user/eng-123-fix-bug" already exists
    When createBranch("user/eng-123-fix-bug") is called
    Then repo.checkout should be called with "user/eng-123-fix-bug"
    And repo.createBranch should NOT be called
    And it should return true
    And an info message "Switched to existing branch: user/eng-123-fix-bug" should be shown

  Scenario: Checkout existing remote branch
    Given no local branch "user/eng-123-fix-bug" exists
    And a remote branch "origin/user/eng-123-fix-bug" exists
    When createBranch("user/eng-123-fix-bug") is called
    Then repo.checkout should be called with "user/eng-123-fix-bug"
    And it should return true
    And an info message "Checked out remote branch: user/eng-123-fix-bug" should be shown

  Scenario: Create branch fails with Git error
    Given Git throws error "Branch name contains invalid characters"
    When createBranch("invalid//branch") is called
    Then it should return false
    And an error message "Failed to create branch: Branch name contains invalid characters" should be shown

  Scenario: Create branch with no repository
    Given no Git repository is open
    When createBranch("user/eng-123") is called
    Then it should return false
    And an error message "No Git repository found. Please open a folder with a Git repository." should be shown

  Scenario: Get current branch name
    Given the current branch is "main"
    When getCurrentBranch is called
    Then it should return "main"

  Scenario: Get current branch when detached HEAD
    Given the repository is in detached HEAD state
    When getCurrentBranch is called
    Then it should return undefined
```

### 1.6 IssuesTreeProvider Tests

**File:** `test/unit/views/issuesTreeProvider.test.ts`

```gherkin
Feature: IssuesTreeProvider Tree Structure

  Background:
    Given a mock IssueService
    And a new IssuesTreeProvider instance

  Scenario: Get root children groups issues by cycle
    Given IssueService returns issues:
      | identifier | title    | cycle.id | cycle.name |
      | ENG-101    | Issue A  | c1       | Sprint 1   |
      | ENG-102    | Issue B  | c1       | Sprint 1   |
      | ENG-103    | Issue C  | c2       | Sprint 2   |
      | ENG-104    | Issue D  | null     | null       |
    When getChildren(undefined) is called
    Then it should return 3 CycleNodes:
      | name       | childCount |
      | Sprint 1   | 2          |
      | Sprint 2   | 1          |
      | Backlog    | 1          |

  Scenario: Cycles sorted alphabetically
    Given issues in cycles "Zulu Sprint", "Alpha Sprint", "Mike Sprint"
    When getChildren(undefined) is called
    Then CycleNodes should be ordered: "Alpha Sprint", "Mike Sprint", "Zulu Sprint"
    And "Backlog" should always be last

  Scenario: Get children of CycleNode
    Given a CycleNode with 3 IssueNode children
    When getChildren(cycleNode) is called
    Then it should return the 3 IssueNode children

  Scenario: Get children of IssueNode returns empty
    Given an IssueNode
    When getChildren(issueNode) is called
    Then it should return an empty array

  Scenario: Empty issues shows empty state
    Given IssueService returns empty array
    When getChildren(undefined) is called
    Then it should return an empty array
    (viewsWelcome handles empty state message)

  Scenario: Error fetching issues shows error message
    Given IssueService throws Error "Network error"
    When getChildren(undefined) is called
    Then it should return an empty array
    And an error message "Failed to fetch issues: Network error" should be shown

Feature: IssuesTreeProvider Filtering

  Scenario: Set cycle filter triggers refresh
    When setFilter({ cycleId: "c1" }) is called
    Then the internal _filter should be { cycleId: "c1" }
    And clearCache should be called on IssueService
    And onDidChangeTreeData should fire

  Scenario: Set project filter
    When setFilter({ projectId: "p1" }) is called
    Then IssueService.getMyAssignedIssues should be called with { projectId: "p1" }

  Scenario: Clear filters
    Given a filter { cycleId: "c1" } is set
    When setFilter({}) is called
    Then IssueService should be called with empty filter

Feature: IssuesTreeProvider Refresh

  Scenario: Refresh without cache clear
    When refresh(false) is called
    Then IssueService.clearCache should NOT be called
    And onDidChangeTreeData should fire with undefined

  Scenario: Refresh with cache clear
    When refresh(true) is called
    Then IssueService.clearCache should be called
    And onDidChangeTreeData should fire with undefined

Feature: IssueNode Properties

  Scenario: IssueNode displays correctly
    Given an issue:
      | property    | value                |
      | id          | "issue-1"            |
      | identifier  | "ENG-142"            |
      | title       | "Add user avatar"    |
      | state.type  | "started"            |
      | state.name  | "In Progress"        |
      | labels      | [{ name: "frontend" }] |
    When an IssueNode is created
    Then label should be "Add user avatar"
    And description should be "ENG-142"
    And id should be "issue-issue-1"
    And contextValue should be "issue:started"
    And collapsibleState should be None
    And tooltip should contain "ENG-142", "Add user avatar", "In Progress", "#frontend"
    And command should be ViewIssue with issue as argument

  Scenario: IssueNode icon for completed state
    Given an issue with state.type = "completed"
    When an IssueNode is created
    Then iconPath should be ThemeIcon "pass" with color "charts.green"

  Scenario: IssueNode icon for started state
    Given an issue with state.type = "started"
    When an IssueNode is created
    Then iconPath should be ThemeIcon "play-circle" with color "charts.blue"

  Scenario: IssueNode icon for unstarted state
    Given an issue with state.type = "unstarted"
    When an IssueNode is created
    Then iconPath should be ThemeIcon "circle-outline" with no color

  Scenario: IssueNode icon for backlog state
    Given an issue with state.type = "backlog"
    When an IssueNode is created
    Then iconPath should be ThemeIcon "circle-large-outline"

  Scenario: IssueNode icon for canceled state
    Given an issue with state.type = "canceled"
    When an IssueNode is created
    Then iconPath should be ThemeIcon "circle-slash" with color "charts.gray"

  Scenario: IssueNode icon for unknown state
    Given an issue with state.type = undefined
    When an IssueNode is created
    Then iconPath should be ThemeIcon "issue-opened"

Feature: CycleNode Properties

  Scenario: CycleNode with date range
    Given a cycle:
      | id       | name     | startsAt   | endsAt     | issues |
      | c1       | Sprint 1 | 2024-01-01 | 2024-01-14 | 5      |
    When a CycleNode is created
    Then label should be "Sprint 1 (Jan 1 - Jan 14)"
    And description should be "5 issues"
    And iconPath should be ThemeIcon "history"
    And contextValue should be "cycle"
    And collapsibleState should be Expanded

  Scenario: CycleNode without date range (Backlog)
    Given a cycle with no dates and name "Backlog" with 1 issue
    When a CycleNode is created
    Then label should be "Backlog"
    And description should be "1 issue" (singular)
```

### 1.7 StartWorkCommand Tests

**File:** `test/unit/commands/startWorkCommand.test.ts`

```gherkin
Feature: Start Work Command

  Background:
    Given mock Container with IssueService and GitService
    And an issue { id: "1", identifier: "ENG-142" }

  Scenario: User confirms branch creation
    Given IssueService.getBranchName returns "user/eng-142-add-avatar"
    And user clicks "Create Branch" in confirmation dialog
    When startWorkOnIssue is called with the issue
    Then GitService.createBranch should be called with "user/eng-142-add-avatar"

  Scenario: User confirms branch creation with copy
    Given IssueService.getBranchName returns "user/eng-142-add-avatar"
    And user clicks "Create Branch & Copy" in confirmation dialog
    And GitService.createBranch succeeds
    When startWorkOnIssue is called
    Then GitService.createBranch should be called
    And clipboard.writeText should be called with "user/eng-142-add-avatar"
    And an info message "Branch name copied to clipboard" should be shown

  Scenario: User cancels confirmation dialog
    Given user dismisses the confirmation dialog
    When startWorkOnIssue is called
    Then GitService.createBranch should NOT be called

  Scenario: Branch creation fails
    Given GitService.createBranch returns false
    And user clicks "Create Branch"
    When startWorkOnIssue is called
    Then clipboard should NOT be written to
```

### 1.8 IssueWebviewController Tests

**File:** `test/unit/views/issueWebviewController.test.ts`

```gherkin
Feature: IssueWebviewController Panel Management

  Background:
    Given a mock IssueService
    And a mock extensionUri
    And an issue { id: "1", identifier: "ENG-142", title: "Add user avatar component" }

  Scenario: Create webview panel with correct configuration
    When IssueWebviewController is instantiated
    Then createWebviewPanel should be called with:
      | viewType    | "linearIssue"                    |
      | title       | "ENG-142: Add user avatar com…"  |
      | viewColumn  | ViewColumn.One                   |
      | options.enableScripts | true                  |
      | options.retainContextWhenHidden | true       |

  Scenario: Title truncates long issue titles
    Given an issue with title "This is a very long issue title that should be truncated"
    When IssueWebviewController is instantiated
    Then panel title should be "ENG-142: This is a very long issue t…"

  Scenario: Show reveals existing panel
    Given a controller with a panel
    When show() is called
    Then panel.reveal() should be called

  Scenario: Handle 'ready' message loads issue data
    Given the webview posts message { type: "ready" }
    When the message is received
    Then IssueService.getIssueWithComments should be called
    And a "loading" message should be posted with { isLoading: true }
    And an "update" message should be posted with the issue details
    And a "loading" message should be posted with { isLoading: false }

  Scenario: Handle 'startWork' message
    Given the webview posts { type: "startWork", payload: { issueId: "1" } }
    When the message is received
    Then commands.executeCommand should be called with "linear-studio.startWork"

  Scenario: Handle 'openInBrowser' message
    Given the webview posts { type: "openInBrowser", payload: { url: "https://linear.app/..." } }
    When the message is received
    Then vscode.env.openExternal should be called with the URL

  Scenario: Handle 'refresh' message
    Given the webview posts { type: "refresh" }
    When the message is received
    Then IssueService.getIssueWithComments should be called again

  Scenario: Error loading issue details
    Given IssueService.getIssueWithComments throws Error "Network error"
    When ready message is received
    Then an "error" message should be posted with { message: "Network error" }

  Scenario: Panel disposal calls cleanup callback
    Given an onDisposeCallback function
    When the panel is closed
    Then onDisposeCallback should be called
    And all disposables should be disposed

  Scenario: HTML content includes correct CSP
    When getHtmlContent is called
    Then it should include Content-Security-Policy meta tag
    And script-src should include nonce
    And style-src should include webview.cspSource
    And img-src should allow https: and data:
```

### 1.9 IssueWebviewManager Tests

**File:** `test/unit/views/issueWebviewManager.test.ts`

```gherkin
Feature: IssueWebviewManager Panel Reuse

  Background:
    Given a mock IssueService
    And a new IssueWebviewManager

  Scenario: Show new issue creates new controller
    Given no controllers exist
    When showIssue is called with issue { id: "1" }
    Then a new IssueWebviewController should be created
    And it should be stored in the controllers map

  Scenario: Show same issue reuses existing controller
    Given a controller exists for issue { id: "1" }
    When showIssue is called with issue { id: "1" }
    Then NO new controller should be created
    And the existing controller's show() should be called

  Scenario: Show different issue creates new controller
    Given a controller exists for issue { id: "1" }
    When showIssue is called with issue { id: "2" }
    Then a new controller should be created for issue "2"
    And both controllers should exist in the map

  Scenario: Controller disposal removes from map
    Given a controller for issue { id: "1" } is created with onDispose callback
    When the controller is disposed
    Then issue "1" should be removed from the controllers map

  Scenario: Manager dispose cleans up all controllers
    Given controllers exist for issues "1", "2", "3"
    When manager.dispose() is called
    Then all 3 controllers should be disposed
    And the controllers map should be empty
```

---

## Phase 2: Integration Tests

### 2.1 Integration Test Setup

**Files to create:**

- `.vscode-test.js` - VS Code test runner configuration
- `test/integration/index.ts` - Test entry point

### 2.2 Extension Activation Tests

**File:** `test/integration/extension.test.ts`

```gherkin
Feature: Extension Activation

  Scenario: Extension is present in VS Code
    When querying for extension "linear-studio.linear-studio"
    Then the extension should be found

  Scenario: Extension activates successfully
    When the extension activates
    Then ext.isActive should be true
    And no errors should be thrown

  Scenario: All commands are registered
    When getting all registered commands
    Then the following commands should exist:
      | command                        |
      | linear-studio.authenticate     |
      | linear-studio.logout           |
      | linear-studio.viewIssue        |
      | linear-studio.startWork        |
      | linear-studio.refreshIssues    |
      | linear-studio.filterByCycle    |
      | linear-studio.filterByProject  |
      | linear-studio.clearFilters     |
      | linear-studio.copyIssueLink    |
      | linear-studio.openInBrowser    |

  Scenario: Tree view is registered
    When focusing view "linearStudio.issues"
    Then no error should be thrown
```

### 2.3 Authentication Flow Tests

**File:** `test/integration/auth.test.ts`

```gherkin
Feature: Authentication Integration

  Scenario: Unauthenticated state shows welcome view
    Given no API key is stored
    When the extension activates
    Then context "linear-studio.authenticated" should be false
    And the welcome view should be visible

  Scenario: Authenticate command can be executed
    When executing command "linear-studio.authenticate"
    Then no error should be thrown
    (actual authentication requires user input, so we just verify command works)
```

---

## Phase 3: E2E Tests (Playwright)

### 3.1 Playwright Setup

**Files to create:**

- `playwright.config.ts`
- `test/e2e/fixtures/mockData.ts`
- `test/e2e/webview.spec.ts`

### 3.2 Webview Component Tests

**File:** `test/e2e/webview.spec.ts`

```gherkin
Feature: Issue Webview Rendering

  Background:
    Given the webview is loaded with mock issue data:
      | property       | value                        |
      | identifier     | "ENG-142"                    |
      | title          | "Add user avatar component"  |
      | description    | "# Overview\nImplement..."   |
      | state.name     | "In Progress"                |
      | state.type     | "started"                    |
      | state.color    | "#f2c94c"                    |
      | priority       | 2                            |
      | priorityLabel  | "High"                       |
      | assignee.name  | "John Doe"                   |
      | labels         | [{ name: "frontend", color: "#5e6ad2" }] |
      | comments       | [{ body: "First comment", user: { name: "Sarah" } }] |

  Scenario: Issue header displays correctly
    Then element [data-testid="issue-title"] should contain "Add user avatar component"
    And element [data-testid="issue-identifier"] should contain "ENG-142"
    And element [data-testid="status-badge"] should contain "In Progress"

  Scenario: Description renders markdown
    Then the description section should render markdown headers
    And should contain formatted text

  Scenario: Comments are displayed
    Then there should be 1 comment element [data-testid="comment"]
    And the comment should show author "Sarah"
    And the comment should show the body content

  Scenario: Sidebar shows metadata
    Then sidebar should show status "In Progress"
    And sidebar should show priority "High" with orange icon
    And sidebar should show assignee "John Doe"
    And sidebar should show label "frontend"

  Scenario: Start Working button triggers action
    When clicking the "Start Working" button
    Then a postMessage should be sent with type "startWork"

  Scenario: Open in Linear button triggers action
    When clicking the "Open in Linear" button
    Then a postMessage should be sent with type "openInBrowser"

  Scenario: Refresh button triggers action
    When clicking the "Refresh" button
    Then a postMessage should be sent with type "refresh"

Feature: Webview Loading States

  Scenario: Loading state displayed
    Given the webview receives { type: "loading", payload: { isLoading: true } }
    Then a loading indicator should be visible

  Scenario: Error state displayed
    Given the webview receives { type: "error", payload: { message: "Network error" } }
    Then an error message "Network error" should be displayed
    And a "Retry" button should be visible

  Scenario: Retry after error
    Given an error is displayed
    When clicking the "Retry" button
    Then a postMessage with type "refresh" should be sent
```

---

## Phase 4: CI/CD Pipeline

**File:** `.github/workflows/test.yml`

```yaml
# Workflow specifications:
# - Trigger: push to main, pull_request to main
# - Jobs: lint-and-typecheck, unit-tests, integration-tests
# - Matrix: Node 20, Ubuntu/macOS/Windows
# - Caching: pnpm dependencies
# - Artifacts: coverage reports
```

**File:** `.github/workflows/release.yml` (optional)

```yaml
# Workflow specifications:
# - Trigger: tag push (v*)
# - Jobs: build, package, publish to VS Code marketplace
```

---

## Phase 5: Auto-Refresh Implementation

**File modifications:**

[`src/container.ts`](src/container.ts):

- Add interval timer based on `linear-studio.autoRefreshInterval` config
- Clear/reset timer on config change
- Dispose timer on extension deactivation
```gherkin
Feature: Auto-Refresh

  Scenario: Auto-refresh triggers at configured interval
    Given autoRefreshInterval is set to 300 seconds
    When 300 seconds elapse
    Then issuesTreeProvider.refresh(true) should be called

  Scenario: Auto-refresh disabled when interval is 0
    Given autoRefreshInterval is set to 0
    Then no refresh timer should be active

  Scenario: Config change updates interval
    Given autoRefreshInterval was 300 seconds
    When user changes it to 600 seconds
    Then the timer should be reset to 600 seconds
```


---

## Phase 6: Polish

### Files to Create

| File | Purpose |

|------|---------|

| `.vscodeignore` | Exclude test/, *.map, .github/, etc. from package |

| `.gitignore` | Verify includes dist/, node_modules/, *.vsix, coverage/ |

| `images/icon.png` | 128x128 extension icon |

| `test/fixtures/test-workspace/.gitkeep` | Placeholder for test workspace |

---

## Test File Summary

| Path | Test Count (approx) |

|------|---------------------|

| `test/unit/auth/authService.test.ts` | 8 |

| `test/unit/auth/credentialManager.test.ts` | 4 |

| `test/unit/linear/linearClientManager.test.ts` | 6 |

| `test/unit/linear/issueService.test.ts` | 18 |

| `test/unit/git/gitService.test.ts` | 10 |

| `test/unit/views/issuesTreeProvider.test.ts` | 16 |

| `test/unit/commands/startWorkCommand.test.ts` | 4 |

| `test/unit/views/issueWebviewController.test.ts` | 10 |

| `test/unit/views/issueWebviewManager.test.ts` | 5 |

| `test/integration/extension.test.ts` | 4 |

| `test/integration/auth.test.ts` | 2 |

| `test/e2e/webview.spec.ts` | 10 |

| **Total** | **~97 tests** |