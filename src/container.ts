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
    private static _autoRefreshTimer: ReturnType<typeof setInterval> | undefined;
    private static _configChangeDisposable: vscode.Disposable | undefined;
    
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
        
        // Set up auto-refresh based on configuration
        this.setupAutoRefresh();
        
        // Listen for configuration changes
        this._configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('linear-studio.autoRefreshInterval')) {
                this.setupAutoRefresh();
            }
        });
        context.subscriptions.push(this._configChangeDisposable);
    }
    
    /**
     * Sets up the auto-refresh timer based on the configured interval.
     * If interval is 0, auto-refresh is disabled.
     */
    private static setupAutoRefresh(): void {
        // Clear any existing timer
        if (this._autoRefreshTimer) {
            clearInterval(this._autoRefreshTimer);
            this._autoRefreshTimer = undefined;
        }
        
        // Get the configured interval (in seconds)
        const config = vscode.workspace.getConfiguration('linear-studio');
        const intervalSeconds = config.get<number>('autoRefreshInterval', 0);
        
        // If interval is 0 or negative, auto-refresh is disabled
        if (intervalSeconds <= 0) {
            return;
        }
        
        // Set up the timer (convert seconds to milliseconds)
        const intervalMs = intervalSeconds * 1000;
        this._autoRefreshTimer = setInterval(() => {
            // Only refresh if authenticated
            if (this._authService?.isAuthenticated) {
                this._issuesTreeProvider?.refresh(true);
            }
        }, intervalMs);
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
        // Clear auto-refresh timer
        if (this._autoRefreshTimer) {
            clearInterval(this._autoRefreshTimer);
            this._autoRefreshTimer = undefined;
        }
        
        // Dispose config change listener
        this._configChangeDisposable?.dispose();
        
        // Dispose webview manager
        this._issueWebviewManager?.dispose();
    }
}
