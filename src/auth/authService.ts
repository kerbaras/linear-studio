import * as vscode from 'vscode';
import { LinearClient } from '@linear/sdk';
import { CredentialManager } from './credentialManager';

export class AuthService {
    private _onDidChangeAuthentication = new vscode.EventEmitter<boolean>();
    readonly onDidChangeAuthentication = this._onDidChangeAuthentication.event;
    
    private _isAuthenticated = false;
    private _currentUser: { id: string; name: string; email: string } | undefined;
    
    constructor(private readonly credentialManager: CredentialManager) {}
    
    get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }
    
    get currentUser() {
        return this._currentUser;
    }
    
    /**
     * Initialize auth state from stored credentials on extension startup
     */
    async initialize(): Promise<void> {
        const apiKey = await this.credentialManager.getApiKey();
        if (apiKey) {
            try {
                // Validate stored key is still valid
                const client = new LinearClient({ apiKey });
                const viewer = await client.viewer;
                this._currentUser = {
                    id: viewer.id,
                    name: viewer.name,
                    email: viewer.email,
                };
                this._isAuthenticated = true;
            } catch {
                // Stored key is invalid, clear it
                await this.credentialManager.deleteApiKey();
                this._isAuthenticated = false;
            }
        }
    }
    
    async authenticate(): Promise<boolean> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Linear API Key',
            password: true,
            placeHolder: 'lin_api_...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value) {
                    return 'API key is required';
                }
                if (!value.startsWith('lin_api_')) {
                    return 'API key should start with lin_api_';
                }
                return undefined; // Valid
            }
        });
        
        if (!apiKey) {return false;}
        
        // Validate the API key by making a test request
        try {
            const client = new LinearClient({ apiKey });
            const viewer = await client.viewer;
            
            await this.credentialManager.setApiKey(apiKey);
            this._currentUser = {
                id: viewer.id,
                name: viewer.name,
                email: viewer.email,
            };
            this._isAuthenticated = true;
            this._onDidChangeAuthentication.fire(true);
            
            vscode.window.showInformationMessage(
                `Authenticated as ${viewer.name} (${viewer.email})`
            );
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(
                'Invalid API key. Please check your key and try again.'
            );
            return false;
        }
    }
    
    async logout(): Promise<void> {
        await this.credentialManager.deleteApiKey();
        this._currentUser = undefined;
        this._isAuthenticated = false;
        this._onDidChangeAuthentication.fire(false);
        vscode.window.showInformationMessage('Logged out from Linear');
    }
}
