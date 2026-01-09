import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinearClientManager } from '../../../src/linear/linearClientManager';
import { CredentialManager } from '../../../src/auth/credentialManager';
import { LinearClient } from '@linear/sdk';

// Mock LinearClient
vi.mock('@linear/sdk', () => ({
    LinearClient: vi.fn().mockImplementation(() => ({
        viewer: Promise.resolve({ id: 'user-1', name: 'Test', email: 'test@test.com' }),
    })),
}));

describe('LinearClientManager', () => {
    let clientManager: LinearClientManager;
    let mockCredentialManager: CredentialManager;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockCredentialManager = {
            getApiKey: vi.fn(),
            setApiKey: vi.fn(),
            deleteApiKey: vi.fn(),
        } as unknown as CredentialManager;

        clientManager = new LinearClientManager(mockCredentialManager);
    });

    describe('getClient', () => {
        it('should return a LinearClient instance when authenticated', async () => {
            // Given CredentialManager returns API key "lin_api_valid"
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue('lin_api_valid');

            // When getClient is called
            const client = await clientManager.getClient();

            // Then it should return a LinearClient instance
            expect(client).toBeDefined();
            expect(LinearClient).toHaveBeenCalledWith({ apiKey: 'lin_api_valid' });
        });

        it('should reuse cached instance on subsequent calls', async () => {
            // Given CredentialManager returns API key
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue('lin_api_valid');

            // Given a LinearClient was previously created
            const firstClient = await clientManager.getClient();
            vi.mocked(mockCredentialManager.getApiKey).mockClear();

            // When getClient is called again
            const secondClient = await clientManager.getClient();

            // Then it should return the same cached instance
            expect(secondClient).toBe(firstClient);
            // And CredentialManager.getApiKey should NOT be called again
            expect(mockCredentialManager.getApiKey).not.toHaveBeenCalled();
        });

        it('should throw error when not authenticated', async () => {
            // Given CredentialManager returns undefined (no API key)
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue(undefined);

            // When getClient is called
            // Then it should throw Error
            await expect(clientManager.getClient()).rejects.toThrow(
                'Not authenticated. Please authenticate with Linear first.'
            );
        });
    });

    describe('hasCredentials', () => {
        it('should return true when API key exists', async () => {
            // Given CredentialManager returns API key "lin_api_exists"
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue('lin_api_exists');

            // When hasCredentials is called
            const result = await clientManager.hasCredentials();

            // Then it should return true
            expect(result).toBe(true);
        });

        it('should return false when no API key', async () => {
            // Given CredentialManager returns undefined
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue(undefined);

            // When hasCredentials is called
            const result = await clientManager.hasCredentials();

            // Then it should return false
            expect(result).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear cached client', async () => {
            // Given a LinearClient was previously cached
            vi.mocked(mockCredentialManager.getApiKey).mockResolvedValue('lin_api_valid');
            await clientManager.getClient();
            vi.mocked(LinearClient).mockClear();

            // When reset is called
            clientManager.reset();

            // Then the cached client should be cleared
            // And the next getClient call should create a new client
            await clientManager.getClient();
            expect(LinearClient).toHaveBeenCalledTimes(1);
        });
    });
});
