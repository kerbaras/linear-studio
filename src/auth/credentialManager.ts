import * as vscode from 'vscode';

const API_KEY_SECRET = 'linear-studio.apiKey';

export class CredentialManager {
    constructor(private readonly secrets: vscode.SecretStorage) {}
    
    async getApiKey(): Promise<string | undefined> {
        return this.secrets.get(API_KEY_SECRET);
    }
    
    async setApiKey(apiKey: string): Promise<void> {
        await this.secrets.store(API_KEY_SECRET, apiKey);
    }
    
    async deleteApiKey(): Promise<void> {
        await this.secrets.delete(API_KEY_SECRET);
    }
}
