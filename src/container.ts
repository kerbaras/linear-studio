import * as vscode from 'vscode';
import { AuthService } from './auth/authService';
import { CredentialManager } from './auth/credentialManager';
import { LinearClientManager } from './linear/linearClientManager';
import { IssueService } from './linear/issueService';
import { IssuesTreeProvider } from './views/issues/issuesTreeProvider';
import { IssueWebviewManager } from './views/issueWebview/issueWebviewManager';
import { GitService } from './git/gitService';
import { ContextKeys } from './constants';

export class Container {
    private static _context: vscode.ExtensionContext;
    private static _credentialManager: CredentialManager;
    private static _authService: AuthService;
    private static _linearClientManager: LinearClientManager;
    private static _issueService: IssueService;
    private static _issuesTreeProvider: IssuesTreeProvider;
    private static _issueWebviewManager: IssueWebviewManager;
    private static _gitService: GitService;
    
    static async initialize(context: vscode.ExtensionContext): Promise<void> {
        this._context = context;
        
        // Core services - CredentialManager first
        this._credentialManager = new CredentialManager(context.secrets);
        this._authService = new AuthService(this._credentialManager);
        
        // Initialize auth state from stored credentials
        await this._authService.initialize();
        
        // Linear API layer - uses CredentialManager directly
        this._linearClientManager = new LinearClientManager(this._credentialManager);
        this._issueService = new IssueService(this._linearClientManager);
        
        // Git operations
        this._gitService = new GitService();
        
        // Webview manager (singleton for issue panels)
        this._issueWebviewManager = new IssueWebviewManager(
            context.extensionUri,
            this._issueService
        );
        
        // Views - register tree view
        this._issuesTreeProvider = new IssuesTreeProvider(this._issueService);
        const treeView = vscode.window.createTreeView('linearStudio.issues', {
            treeDataProvider: this._issuesTreeProvider,
            showCollapseAll: true,
        });
        context.subscriptions.push(treeView);
        
        // Listen for auth changes to refresh views and reset client
        this._authService.onDidChangeAuthentication(async (isAuthenticated) => {
            this._linearClientManager.reset();
            this._issuesTreeProvider.refresh();
            
            // Update VS Code context for conditional UI
            await vscode.commands.executeCommand(
                'setContext',
                ContextKeys.Authenticated,
                isAuthenticated
            );
        });
    }
    
    // Static getters for service access (like atlascode pattern)
    static get context(): vscode.ExtensionContext { return this._context; }
    static get credentialManager(): CredentialManager { return this._credentialManager; }
    static get authService(): AuthService { return this._authService; }
    static get linearClientManager(): LinearClientManager { return this._linearClientManager; }
    static get issueService(): IssueService { return this._issueService; }
    static get issuesTree(): IssuesTreeProvider { return this._issuesTreeProvider; }
    static get issueWebviewManager(): IssueWebviewManager { return this._issueWebviewManager; }
    static get gitService(): GitService { return this._gitService; }
    
    static dispose(): void {
        this._issueWebviewManager?.dispose();
    }
}
