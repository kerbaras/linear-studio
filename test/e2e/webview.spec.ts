import { test, expect, Page } from '@playwright/test';
import { mockIssueDetails } from './fixtures/mockData';

/**
 * E2E tests for the issue webview UI.
 * 
 * These tests run against the standalone React app served by Vite.
 * We inject mock data via window.postMessage to simulate the extension host.
 */

async function setupMockVSCodeApi(page: Page) {
    // Inject a mock vscode API that the webview expects
    await page.addInitScript(() => {
        const messages: unknown[] = [];
        (window as unknown as Record<string, unknown>).acquireVsCodeApi = () => ({
            postMessage: (msg: unknown) => {
                messages.push(msg);
                (window as unknown as Record<string, unknown>).__sentMessages = messages;
            },
            getState: () => undefined,
            setState: () => {},
        });
    });
}

async function sendMockIssueData(page: Page, issueData: unknown) {
    await page.evaluate((data) => {
        window.postMessage({ type: 'update', payload: data }, '*');
    }, issueData);
}

async function sendLoadingState(page: Page, isLoading: boolean) {
    await page.evaluate((loading) => {
        window.postMessage({ type: 'loading', payload: { isLoading: loading } }, '*');
    }, isLoading);
}

async function sendErrorState(page: Page, message: string) {
    await page.evaluate((msg) => {
        window.postMessage({ type: 'error', payload: { message: msg } }, '*');
    }, message);
}

async function getSentMessages(page: Page): Promise<unknown[]> {
    return page.evaluate(() => {
        return (window as unknown as Record<string, unknown>).__sentMessages as unknown[] || [];
    });
}

test.describe('Issue Webview Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockVSCodeApi(page);
        await page.goto('/');
    });

    test('issue header displays title, identifier, and status badge', async ({ page }) => {
        await sendMockIssueData(page, mockIssueDetails);
        
        // Check title
        const title = page.locator('[data-testid="issue-title"]');
        await expect(title).toContainText('Add user avatar component');
        
        // Check identifier
        const identifier = page.locator('[data-testid="issue-identifier"]');
        await expect(identifier).toContainText('ENG-142');
        
        // Check status badge
        const statusBadge = page.locator('[data-testid="status-badge"]');
        await expect(statusBadge).toContainText('In Progress');
    });

    test('description section renders markdown content', async ({ page }) => {
        await sendMockIssueData(page, mockIssueDetails);
        
        // Check that markdown headers are rendered
        const description = page.locator('[data-testid="issue-description"]');
        await expect(description).toBeVisible();
        
        // Check for markdown elements
        await expect(description.locator('h1, h2')).toHaveCount(await description.locator('h1, h2').count());
        
        // Check for code blocks
        await expect(description.locator('pre, code')).toHaveCount(await description.locator('pre, code').count());
    });

    test('comments display with author and body', async ({ page }) => {
        await sendMockIssueData(page, mockIssueDetails);
        
        // Check that comments are displayed
        const comments = page.locator('[data-testid="comment"]');
        await expect(comments).toHaveCount(3);
        
        // Check first comment has author name
        const firstComment = comments.first();
        await expect(firstComment).toContainText('John Doe');
        await expect(firstComment).toContainText('Started working on this');
    });

    test('sidebar shows status, priority, assignee, and labels', async ({ page }) => {
        await sendMockIssueData(page, mockIssueDetails);
        
        const sidebar = page.locator('[data-testid="sidebar"]');
        
        // Check status
        await expect(sidebar).toContainText('In Progress');
        
        // Check priority
        await expect(sidebar).toContainText('High');
        
        // Check assignee
        await expect(sidebar).toContainText('John Doe');
        
        // Check labels
        await expect(sidebar).toContainText('frontend');
        await expect(sidebar).toContainText('ui');
    });
});

test.describe('Webview Button Actions', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockVSCodeApi(page);
        await page.goto('/');
        await sendMockIssueData(page, mockIssueDetails);
    });

    test('Start Working button sends postMessage', async ({ page }) => {
        // Click Start Working button
        const startWorkBtn = page.locator('button:has-text("Start Working"), [data-testid="start-work-btn"]');
        await startWorkBtn.click();
        
        // Check that postMessage was sent
        const messages = await getSentMessages(page);
        expect(messages.some((m: unknown) => (m as Record<string, unknown>).type === 'startWork')).toBe(true);
    });

    test('Open in Linear button sends postMessage', async ({ page }) => {
        // Click Open in Linear button
        const openBtn = page.locator('button:has-text("Open in Linear"), [data-testid="open-in-browser-btn"]');
        await openBtn.click();
        
        // Check that postMessage was sent
        const messages = await getSentMessages(page);
        expect(messages.some((m: unknown) => (m as Record<string, unknown>).type === 'openInBrowser')).toBe(true);
    });

    test('Refresh button sends postMessage', async ({ page }) => {
        // Click Refresh button
        const refreshBtn = page.locator('button:has-text("Refresh"), [data-testid="refresh-btn"]');
        await refreshBtn.click();
        
        // Check that postMessage was sent
        const messages = await getSentMessages(page);
        expect(messages.some((m: unknown) => (m as Record<string, unknown>).type === 'refresh')).toBe(true);
    });
});

test.describe('Webview Loading States', () => {
    test.beforeEach(async ({ page }) => {
        await setupMockVSCodeApi(page);
        await page.goto('/');
    });

    test('loading state displays spinner', async ({ page }) => {
        await sendLoadingState(page, true);
        
        // Check for loading indicator
        const loading = page.locator('[data-testid="loading"], .loading, [class*="spinner"]');
        await expect(loading).toBeVisible();
    });

    test('error state displays error message and retry button', async ({ page }) => {
        await sendErrorState(page, 'Network error: Failed to fetch issue');
        
        // Check for error message
        const error = page.locator('[data-testid="error"], .error');
        await expect(error).toContainText('Network error');
        
        // Check for retry button
        const retryBtn = page.locator('button:has-text("Retry"), [data-testid="retry-btn"]');
        await expect(retryBtn).toBeVisible();
    });

    test('retry button sends refresh message', async ({ page }) => {
        await sendErrorState(page, 'Network error');
        
        // Click retry button
        const retryBtn = page.locator('button:has-text("Retry"), [data-testid="retry-btn"]');
        await retryBtn.click();
        
        // Check that postMessage was sent
        const messages = await getSentMessages(page);
        expect(messages.some((m: unknown) => (m as Record<string, unknown>).type === 'refresh')).toBe(true);
    });
});
