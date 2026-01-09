import * as vscode from 'vscode';
import { Container } from '../container';
import { Commands } from '../constants';
import { startWorkOnIssue } from './startWorkCommand';
import { IssueDTO } from '../linear/types';

export function registerCommands(context: vscode.ExtensionContext): void {
    const disposables: vscode.Disposable[] = [];
    
    // ─── Authentication Commands ───────────────────────────────────
    
    disposables.push(
        vscode.commands.registerCommand(Commands.Authenticate, async () => {
            await Container.authService.authenticate();
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.Logout, async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Are you sure you want to log out from Linear?',
                { modal: true },
                'Log Out'
            );
            if (confirm === 'Log Out') {
                await Container.authService.logout();
            }
        })
    );
    
    // ─── Issue Actions ─────────────────────────────────────────────
    
    disposables.push(
        vscode.commands.registerCommand(Commands.ViewIssue, async (issue: IssueDTO) => {
            // Use the singleton manager to show/reuse issue panel
            await Container.issueWebviewManager.showIssue(issue);
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.StartWork, async (issue: IssueDTO) => {
            await startWorkOnIssue(issue);
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.RefreshIssues, () => {
            Container.issuesTree.refresh(true); // Clear cache on manual refresh
        })
    );
    
    // ─── Filter Commands ───────────────────────────────────────────
    
    disposables.push(
        vscode.commands.registerCommand(Commands.FilterByCycle, async () => {
            const cycles = await Container.issueService.getActiveCycles();
            const items = [
                { label: '$(circle-slash) Clear Filter', id: undefined },
                ...cycles.map(c => ({ label: `$(history) ${c.name}`, id: c.id }))
            ];
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a cycle to filter by'
            });
            
            if (selected) {
                Container.issuesTree.setFilter({ cycleId: selected.id });
            }
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.FilterByProject, async () => {
            const projects = await Container.issueService.getProjects();
            const items = [
                { label: '$(circle-slash) Clear Filter', id: undefined },
                ...projects.map(p => ({ label: `$(project) ${p.name}`, id: p.id }))
            ];
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a project to filter by'
            });
            
            if (selected) {
                Container.issuesTree.setFilter({ projectId: selected.id });
            }
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.ClearFilters, () => {
            Container.issuesTree.setFilter({});
        })
    );
    
    // ─── Utility Commands ──────────────────────────────────────────
    
    disposables.push(
        vscode.commands.registerCommand(Commands.CopyIssueLink, async (issue: IssueDTO) => {
            await vscode.env.clipboard.writeText(issue.url);
            vscode.window.showInformationMessage(`Copied link: ${issue.identifier}`);
        })
    );
    
    disposables.push(
        vscode.commands.registerCommand(Commands.OpenInBrowser, async (issue: IssueDTO) => {
            await vscode.env.openExternal(vscode.Uri.parse(issue.url));
        })
    );
    
    // Register all disposables
    context.subscriptions.push(...disposables);
}
