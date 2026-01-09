import * as vscode from 'vscode';
import { IssueService } from '../../linear/issueService';
import { IssueDTO, IssueDetailsDTO } from '../../linear/types';

// ─── Message Types for IPC ─────────────────────────────────────────

interface WebviewMessage {
    type: string;
    payload?: unknown;
}

interface UpdateMessage extends WebviewMessage {
    type: 'update';
    payload: IssueDetailsDTO;
}

interface LoadingMessage extends WebviewMessage {
    type: 'loading';
    payload: { isLoading: boolean };
}

interface ErrorMessage extends WebviewMessage {
    type: 'error';
    payload: { message: string };
}

type ActionMessage = 
    | { type: 'startWork'; payload: { issueId: string } }
    | { type: 'openInBrowser'; payload: { url: string } }
    | { type: 'refresh' }
    | { type: 'ready' };

// ─── Controller ────────────────────────────────────────────────────

export class IssueWebviewController implements vscode.Disposable {
    private _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    
    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly issueService: IssueService,
        private _issue: IssueDTO,
        private readonly onDisposeCallback: () => void
    ) {
        this._panel = vscode.window.createWebviewPanel(
            'linearIssue',
            `${_issue.identifier}: ${this.truncate(_issue.title, 30)}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
                ]
            }
        );
        
        this._panel.iconPath = new vscode.ThemeIcon('issues');
        this._panel.webview.html = this.getHtmlContent();
        
        // Handle messages from webview
        this._disposables.push(
            this._panel.webview.onDidReceiveMessage(
                (message: ActionMessage) => this.handleMessage(message)
            )
        );
        
        // Handle panel disposal
        this._disposables.push(
            this._panel.onDidDispose(() => {
                this.dispose();
                this.onDisposeCallback();
            })
        );
    }
    
    async show(): Promise<void> {
        this._panel.reveal();
        // Data is loaded when webview sends 'ready' message
    }
    
    private async refreshIssue(): Promise<void> {
        this.postMessage({ type: 'loading', payload: { isLoading: true } });
        
        try {
            const issueDetails = await this.issueService.getIssueWithComments(this._issue.id);
            this.postMessage({ type: 'update', payload: issueDetails });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load issue';
            this.postMessage({ type: 'error', payload: { message } });
        } finally {
            this.postMessage({ type: 'loading', payload: { isLoading: false } });
        }
    }
    
    private async handleMessage(message: ActionMessage): Promise<void> {
        switch (message.type) {
            case 'ready':
                // Webview is ready, send initial data
                await this.refreshIssue();
                break;
                
            case 'startWork':
                await vscode.commands.executeCommand('linear-studio.startWork', this._issue);
                break;
                
            case 'openInBrowser':
                vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
                break;
                
            case 'refresh':
                await this.refreshIssue();
                break;
        }
    }
    
    private postMessage(message: WebviewMessage): void {
        this._panel.webview.postMessage(message);
    }
    
    private getHtmlContent(): string {
        const webview = this._panel.webview;
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist', 'index.css')
        );
        
        // Generate nonce for CSP
        const nonce = this.getNonce();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                style-src ${webview.cspSource} 'unsafe-inline';
                script-src 'nonce-${nonce}';
                img-src ${webview.cspSource} https: data:;
                font-src ${webview.cspSource};
            ">
            <link href="${styleUri}" rel="stylesheet">
            <title>${this._issue.identifier}</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
    
    private getNonce(): string {
        let text = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }
    
    private truncate(str: string, max: number): string {
        return str.length > max ? str.slice(0, max - 1) + '…' : str;
    }
    
    dispose(): void {
        this._panel.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
        this._disposables = [];
    }
}
