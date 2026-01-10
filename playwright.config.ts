import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing the webview UI.
 * 
 * The webview UI is a standalone React app that can be tested independently
 * by serving it with Vite and testing the rendered components.
 */
export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                headless: true,
                launchOptions: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-software-rasterizer',
                    ],
                },
            },
        },
    ],
    webServer: {
        command: 'cd webview-ui && pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
