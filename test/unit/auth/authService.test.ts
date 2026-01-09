import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../../src/auth/authService';
import { CredentialManager } from '../../../src/auth/credentialManager';
import * as vscode from 'vscode';
import { LinearClient } from '@linear/sdk';

// Mock LinearClient
vi.mock('@linear/sdk', () => ({
    LinearClient: vi.fn(),
}));

describe('AuthService', () => {
    let authService: AuthService;
    let mockCredentialManager: {
        getApiKey: ReturnType<typeof vi.fn>;
        setApiKey: ReturnType<typeof vi.fn>;
        deleteApiKey: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockCredentialManager = {
            getApiKey: vi.fn(),
            setApiKey: vi.fn(),
            deleteApiKey: vi.fn(),
        };

        authService = new AuthService(mockCredentialManager as unknown as CredentialManager);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('initialize', () => {
        it('should set isAuthenticated to false when no API key is stored', async () => {
            // Given no API key is stored in SecretStorage
            mockCredentialManager.getApiKey.mockResolvedValue(undefined);

            // When the AuthService initializes
            await authService.initialize();

            // Then isAuthenticated should be false
            expect(authService.isAuthenticated).toBe(false);
            // And currentUser should be undefined
            expect(authService.currentUser).toBeUndefined();
        });

        it('should set isAuthenticated to true with valid stored credentials', async () => {
            // Given an API key "lin_api_valid123" is stored
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid123');
            
            // And the Linear API returns viewer
            const mockViewer = { id: 'user-1', name: 'John', email: 'john@test.com' };
            vi.mocked(LinearClient).mockImplementation(() => ({
                viewer: Promise.resolve(mockViewer),
            } as unknown as LinearClient));

            // When the AuthService initializes
            await authService.initialize();

            // Then isAuthenticated should be true
            expect(authService.isAuthenticated).toBe(true);
            // And currentUser.name should be "John"
            expect(authService.currentUser?.name).toBe('John');
            // And currentUser.email should be "john@test.com"
            expect(authService.currentUser?.email).toBe('john@test.com');
        });

        it('should delete invalid stored credentials and set isAuthenticated to false', async () => {
            // Given an API key "lin_api_expired" is stored
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_expired');
            
            // And the Linear API throws an authentication error
            vi.mocked(LinearClient).mockImplementation(() => ({
                viewer: Promise.reject(new Error('Invalid API key')),
            } as unknown as LinearClient));

            // When the AuthService initializes
            await authService.initialize();

            // Then isAuthenticated should be false
            expect(authService.isAuthenticated).toBe(false);
            // And the stored API key should be deleted
            expect(mockCredentialManager.deleteApiKey).toHaveBeenCalled();
            // And currentUser should be undefined
            expect(authService.currentUser).toBeUndefined();
        });
    });

    describe('authenticate', () => {
        it('should store valid API key and set authenticated state', async () => {
            // Given user enters API key "lin_api_newkey123" in input box
            vi.mocked(vscode.window.showInputBox).mockResolvedValue('lin_api_newkey123');
            
            // And the Linear API returns viewer
            const mockViewer = { id: 'user-2', name: 'Jane', email: 'jane@test.com' };
            vi.mocked(LinearClient).mockImplementation(() => ({
                viewer: Promise.resolve(mockViewer),
            } as unknown as LinearClient));

            // Track event firing via subscription
            const eventHandler = vi.fn();
            const disposable = authService.onDidChangeAuthentication(eventHandler);

            // When authenticate() is called
            const result = await authService.authenticate();

            // Then it should return true
            expect(result).toBe(true);
            // And the API key should be stored in SecretStorage
            expect(mockCredentialManager.setApiKey).toHaveBeenCalledWith('lin_api_newkey123');
            // And isAuthenticated should be true
            expect(authService.isAuthenticated).toBe(true);
            // And currentUser.name should be "Jane"
            expect(authService.currentUser?.name).toBe('Jane');
            // And onDidChangeAuthentication should fire with true
            expect(eventHandler).toHaveBeenCalledWith(true);
            
            disposable.dispose();
        });

        it('should return false when user cancels input box', async () => {
            // Given user cancels the input box (returns undefined)
            vi.mocked(vscode.window.showInputBox).mockResolvedValue(undefined);

            // When authenticate() is called
            const result = await authService.authenticate();

            // Then it should return false
            expect(result).toBe(false);
            // And isAuthenticated should remain false
            expect(authService.isAuthenticated).toBe(false);
            // And the API key should NOT be stored
            expect(mockCredentialManager.setApiKey).not.toHaveBeenCalled();
        });

        it('should show error message when Linear API rejects the key', async () => {
            // Given user enters API key "lin_api_bad" in input box
            vi.mocked(vscode.window.showInputBox).mockResolvedValue('lin_api_bad');
            
            // And the Linear API throws "Invalid API key" error
            vi.mocked(LinearClient).mockImplementation(() => ({
                viewer: Promise.reject(new Error('Invalid API key')),
            } as unknown as LinearClient));

            // When authenticate() is called
            const result = await authService.authenticate();

            // Then it should return false
            expect(result).toBe(false);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Invalid API key. Please check your key and try again.'
            );
            // And the API key should NOT be stored
            expect(mockCredentialManager.setApiKey).not.toHaveBeenCalled();
        });

        it('should validate API key format starts with lin_api_', async () => {
            // Given user enters API key "invalid_key_format" in input box
            // The validateInput function is passed to showInputBox
            let validateInputFn: ((value: string) => string | undefined) | undefined;
            
            vi.mocked(vscode.window.showInputBox).mockImplementation(async (options) => {
                validateInputFn = options?.validateInput as (value: string) => string | undefined;
                return undefined; // User cancels
            });

            // When authenticate() is called
            await authService.authenticate();

            // Then validateInput should return error for invalid format
            expect(validateInputFn).toBeDefined();
            expect(validateInputFn!('invalid_key_format')).toBe('API key should start with lin_api_');
            expect(validateInputFn!('')).toBe('API key is required');
            expect(validateInputFn!('lin_api_valid')).toBeUndefined();
        });
    });

    describe('logout', () => {
        it('should clear credentials and fire event when logging out', async () => {
            // Given the user is authenticated as "John"
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid');
            const mockViewer = { id: 'user-1', name: 'John', email: 'john@test.com' };
            vi.mocked(LinearClient).mockImplementation(() => ({
                viewer: Promise.resolve(mockViewer),
            } as unknown as LinearClient));
            await authService.initialize();
            
            // Track event firing
            const eventHandler = vi.fn();
            const disposable = authService.onDidChangeAuthentication(eventHandler);

            // When logout() is called
            await authService.logout();

            // Then the API key should be deleted from SecretStorage
            expect(mockCredentialManager.deleteApiKey).toHaveBeenCalled();
            // And isAuthenticated should be false
            expect(authService.isAuthenticated).toBe(false);
            // And currentUser should be undefined
            expect(authService.currentUser).toBeUndefined();
            // And onDidChangeAuthentication should fire with false
            expect(eventHandler).toHaveBeenCalledWith(false);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Logged out from Linear');
            
            disposable.dispose();
        });
    });
});
