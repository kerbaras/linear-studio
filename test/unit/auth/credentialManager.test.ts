import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialManager } from '../../../src/auth/credentialManager';
import * as vscode from 'vscode';

describe('CredentialManager', () => {
    let credentialManager: CredentialManager;
    let mockSecretStorage: vscode.SecretStorage;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockSecretStorage = {
            get: vi.fn(),
            store: vi.fn(),
            delete: vi.fn(),
            onDidChange: vi.fn(),
        } as unknown as vscode.SecretStorage;

        credentialManager = new CredentialManager(mockSecretStorage);
    });

    describe('setApiKey', () => {
        it('should call secrets.store with correct key and value', async () => {
            // When setApiKey is called with "lin_api_test123"
            await credentialManager.setApiKey('lin_api_test123');

            // Then secrets.store should be called with key "linear-studio.apiKey" and value "lin_api_test123"
            expect(mockSecretStorage.store).toHaveBeenCalledWith(
                'linear-studio.apiKey',
                'lin_api_test123'
            );
        });
    });

    describe('getApiKey', () => {
        it('should return stored API key', async () => {
            // Given SecretStorage contains "lin_api_stored" for key "linear-studio.apiKey"
            vi.mocked(mockSecretStorage.get).mockResolvedValue('lin_api_stored');

            // When getApiKey is called
            const result = await credentialManager.getApiKey();

            // Then it should return "lin_api_stored"
            expect(result).toBe('lin_api_stored');
            expect(mockSecretStorage.get).toHaveBeenCalledWith('linear-studio.apiKey');
        });

        it('should return undefined when no API key stored', async () => {
            // Given SecretStorage has no value for key "linear-studio.apiKey"
            vi.mocked(mockSecretStorage.get).mockResolvedValue(undefined);

            // When getApiKey is called
            const result = await credentialManager.getApiKey();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });

    describe('deleteApiKey', () => {
        it('should call secrets.delete with correct key', async () => {
            // When deleteApiKey is called
            await credentialManager.deleteApiKey();

            // Then secrets.delete should be called with key "linear-studio.apiKey"
            expect(mockSecretStorage.delete).toHaveBeenCalledWith('linear-studio.apiKey');
        });
    });
});
