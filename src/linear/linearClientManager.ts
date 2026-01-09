import { LinearClient } from '@linear/sdk';
import { CredentialManager } from '../auth/credentialManager';

export class LinearClientManager {
    private _client: LinearClient | undefined;
    
    constructor(private readonly credentialManager: CredentialManager) {}
    
    /**
     * Get or create a LinearClient instance.
     * Throws if not authenticated.
     */
    async getClient(): Promise<LinearClient> {
        if (!this._client) {
            const apiKey = await this.credentialManager.getApiKey();
            if (!apiKey) {
                throw new Error('Not authenticated. Please authenticate with Linear first.');
            }
            this._client = new LinearClient({ apiKey });
        }
        return this._client;
    }
    
    /**
     * Check if we have stored credentials (doesn't validate them)
     */
    async hasCredentials(): Promise<boolean> {
        const apiKey = await this.credentialManager.getApiKey();
        return !!apiKey;
    }
    
    /**
     * Reset the client instance (call after logout or auth change)
     */
    reset(): void {
        this._client = undefined;
    }
}
