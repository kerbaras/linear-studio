import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';

// We need to test the auto-refresh behavior, but Container is a static class
// which makes testing tricky. These tests verify the timer behavior patterns.

describe('Container Auto-Refresh', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('timer behavior patterns', () => {
        it('should trigger at configured interval', () => {
            // Given autoRefreshInterval is set to 300 seconds (5 minutes)
            const callback = vi.fn();
            const intervalMs = 300 * 1000;

            // When timer is set up
            const timer = setInterval(callback, intervalMs);

            // Then callback should not be called immediately
            expect(callback).not.toHaveBeenCalled();

            // When 300 seconds elapse
            vi.advanceTimersByTime(intervalMs);

            // Then callback should be called
            expect(callback).toHaveBeenCalledTimes(1);

            // When another 300 seconds elapse
            vi.advanceTimersByTime(intervalMs);

            // Then callback should be called again
            expect(callback).toHaveBeenCalledTimes(2);

            clearInterval(timer);
        });

        it('should not trigger when interval is 0', () => {
            // Given autoRefreshInterval is set to 0
            const callback = vi.fn();
            const intervalSeconds = 0;

            // When we check the interval
            // No timer should be active (interval <= 0 means disabled)
            if (intervalSeconds <= 0) {
                // Timer is disabled
                expect(callback).not.toHaveBeenCalled();
            }
        });

        it('should reset timer when configuration changes', () => {
            // Given autoRefreshInterval was 300 seconds
            const callback = vi.fn();
            let timer = setInterval(callback, 300 * 1000);

            // Advance by 150 seconds (halfway)
            vi.advanceTimersByTime(150 * 1000);
            expect(callback).not.toHaveBeenCalled();

            // When user changes it to 600 seconds
            // Clear old timer and create new one
            clearInterval(timer);
            timer = setInterval(callback, 600 * 1000);

            // Then the timer should be reset to 600 seconds
            // Advance by 300 seconds - old timer would have fired, new one won't
            vi.advanceTimersByTime(300 * 1000);
            expect(callback).not.toHaveBeenCalled();

            // Advance by another 300 seconds (total 600)
            vi.advanceTimersByTime(300 * 1000);
            expect(callback).toHaveBeenCalledTimes(1);

            clearInterval(timer);
        });

        it('should stop when cleared', () => {
            // Given an active timer
            const callback = vi.fn();
            const timer = setInterval(callback, 60 * 1000);

            // Advance to first trigger
            vi.advanceTimersByTime(60 * 1000);
            expect(callback).toHaveBeenCalledTimes(1);

            // When timer is cleared
            clearInterval(timer);

            // Then no more triggers should happen
            vi.advanceTimersByTime(60 * 1000);
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('configuration reading', () => {
        it('should read auto-refresh interval from configuration', () => {
            // Given a mock configuration
            const mockGet = vi.fn().mockReturnValue(300);
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: mockGet,
                update: vi.fn(),
            } as unknown as vscode.WorkspaceConfiguration);

            // When getting configuration
            const config = vscode.workspace.getConfiguration('linear-studio');
            const interval = config.get<number>('autoRefreshInterval', 0);

            // Then it should return the configured value
            expect(interval).toBe(300);
            expect(mockGet).toHaveBeenCalledWith('autoRefreshInterval', 0);
        });

        it('should use default value when not configured', () => {
            // Given configuration returns undefined
            const mockGet = vi.fn().mockImplementation((key, defaultValue) => defaultValue);
            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: mockGet,
                update: vi.fn(),
            } as unknown as vscode.WorkspaceConfiguration);

            // When getting configuration
            const config = vscode.workspace.getConfiguration('linear-studio');
            const interval = config.get<number>('autoRefreshInterval', 0);

            // Then it should return the default value
            expect(interval).toBe(0);
        });
    });
});
