import * as vscode from 'vscode';
import { IssueService } from '../../linear/issueService';
import { IssueDTO } from '../../linear/types';
import { IssueWebviewController } from './issueWebviewController';

/**
 * Manages multiple issue webview panels, one per issue.
 * Reuses existing panels when the same issue is opened.
 */
export class IssueWebviewManager implements vscode.Disposable {
    private _controllers = new Map<string, IssueWebviewController>();
    
    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly issueService: IssueService
    ) {}
    
    async showIssue(issue: IssueDTO): Promise<void> {
        let controller = this._controllers.get(issue.id);
        
        if (!controller) {
            controller = new IssueWebviewController(
                this.extensionUri,
                this.issueService,
                issue,
                () => this._controllers.delete(issue.id) // onDispose callback
            );
            this._controllers.set(issue.id, controller);
        }
        
        await controller.show();
    }
    
    dispose(): void {
        for (const controller of this._controllers.values()) {
            controller.dispose();
        }
        this._controllers.clear();
    }
}
