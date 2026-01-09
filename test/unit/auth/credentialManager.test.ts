import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialManager } from '../../../src/auth/credentialManager';
import * as vscode from 'vscode';

describe('CredentialManager', () => {
    let credentialManager: CredentialManager;
    let mockSecrets: {
        get: ReturnType<typeof vi.fn>;
        store: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockSecrets = {
            get: vi.fn(),
            store: vi.fn(),
            delete: vi.fn(),
        };

        credentialManager = new CredentialManager(mockSecrets as unknown as vscode.SecretStorage);
    });

    describe('setApiKey', () => {
        it('should store API key with correct secret key', async () => {
            // When setApiKey is called with "lin_api_test123"
            await credentialManager.setApiKey('lin_api_test123');

            // Then secrets.store should be called with key "linear-studio.apiKey" and value "lin_api_test123"
            expect(mockSecrets.store).toHaveBeenCalledWith('linear-studio.apiKey', 'lin_api_test123');
        });
    });

    describe('getApiKey', () => {
        it('should return stored API key from SecretStorage', async () => {
            // Given SecretStorage contains "lin_api_stored" for key "linear-studio.apiKey"
            mockSecrets.get.mockResolvedValue('lin_api_stored');

            // When getApiKey is called
            const result = await credentialManager.getApiKey();

            // Then it should return "lin_api_stored"
            expect(result).toBe('lin_api_stored');
            expect(mockSecrets.get).toHaveBeenCalledWith('linear-studio.apiKey');
        });

        it('should return undefined when no API key is stored', async () => {
            // Given SecretStorage has no value for key "linear-studio.apiKey"
            mockSecrets.get.mockResolvedValue(undefined);

            // When getApiKey is called
            const result = await credentialManager.getApiKey();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });

    describe('deleteApiKey', () => {
        it('should delete API key from SecretStorage', async () => {
            // When deleteApiKey is called
            await credentialManager.deleteApiKey();

            // Then secrets.delete should be called with key "linear-studio.apiKey"
            expect(mockSecrets.delete).toHaveBeenCalledWith('linear-studio.apiKey');
        });
    });
});
