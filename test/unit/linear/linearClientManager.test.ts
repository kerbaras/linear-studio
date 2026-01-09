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

        clientManager = new LinearClientManager(mockCredentialManager as unknown as CredentialManager);
    });

    describe('getClient', () => {
        it('should return LinearClient instance when API key exists', async () => {
            // Given CredentialManager returns API key "lin_api_valid"
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid');

            // When getClient is called
            const client = await clientManager.getClient();

            // Then it should return a LinearClient instance
            expect(client).toBeDefined();
            expect(LinearClient).toHaveBeenCalledWith({ apiKey: 'lin_api_valid' });
        });

        it('should return cached instance on subsequent calls', async () => {
            // Given CredentialManager returns API key
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid');

            // When getClient is called twice
            const client1 = await clientManager.getClient();
            const client2 = await clientManager.getClient();

            // Then it should return the same cached instance
            expect(client1).toBe(client2);
            // And CredentialManager.getApiKey should only be called once
            expect(mockCredentialManager.getApiKey).toHaveBeenCalledTimes(1);
            // And LinearClient constructor should only be called once
            expect(LinearClient).toHaveBeenCalledTimes(1);
        });

        it('should throw error when no API key exists', async () => {
            // Given CredentialManager returns undefined (no API key)
            mockCredentialManager.getApiKey.mockResolvedValue(undefined);

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
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_exists');

            // When hasCredentials is called
            const result = await clientManager.hasCredentials();

            // Then it should return true
            expect(result).toBe(true);
        });

        it('should return false when no API key exists', async () => {
            // Given CredentialManager returns undefined
            mockCredentialManager.getApiKey.mockResolvedValue(undefined);

            // When hasCredentials is called
            const result = await clientManager.hasCredentials();

            // Then it should return false
            expect(result).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear cached client', async () => {
            // Given a LinearClient was previously cached
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid');
            await clientManager.getClient();
            
            // Reset mock counts
            vi.mocked(LinearClient).mockClear();
            mockCredentialManager.getApiKey.mockClear();

            // When reset is called
            clientManager.reset();

            // Then the cached client should be cleared
            // And the next getClient call should create a new client
            mockCredentialManager.getApiKey.mockResolvedValue('lin_api_valid');
            await clientManager.getClient();

            expect(mockCredentialManager.getApiKey).toHaveBeenCalledTimes(1);
            expect(LinearClient).toHaveBeenCalledTimes(1);
        });
    });
});
