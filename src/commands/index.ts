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

    disposables.push(
        vscode.commands.registerCommand(Commands.UpdateStatus, async (issue: IssueDTO) => {
            try {
                // Fetch available workflow states
                const states = await Container.issueService.getWorkflowStates(issue.id);

                if (states.length === 0) {
                    vscode.window.showErrorMessage('No workflow states found for this issue.');
                    return;
                }

                // Show quick pick with states
                const items = states.map(s => ({
                    label: `$(circle-filled) ${s.name}`,
                    description: s.type,
                    id: s.id,
                    picked: issue.state?.id === s.id,
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Current status: ${issue.state?.name || 'Unknown'}`,
                    title: 'Update Issue Status',
                });

                if (!selected) {
                    return;
                }

                // Update the status
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Updating issue status...',
                        cancellable: false,
                    },
                    async () => {
                        await Container.issueService.updateIssueStatus(issue.id, selected.id);
                    }
                );

                vscode.window.showInformationMessage(
                    `Updated ${issue.identifier} status to "${selected.label.replace('$(circle-filled) ', '')}"`
                );

                // Refresh the tree view
                Container.issuesTree.refresh(true);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to update status: ${message}`);
            }
        })
    );

    disposables.push(
        vscode.commands.registerCommand(Commands.SearchIssues, async () => {
            try {
                const query = await vscode.window.showInputBox({
                    prompt: 'Search issues by title or identifier',
                    placeHolder: 'e.g., "login bug" or "ENG-123"',
                });

                if (!query) {
                    return;
                }

                // Get all assigned issues and filter by search query
                const allIssues = await Container.issueService.getMyAssignedIssues();
                const queryLower = query.toLowerCase();

                const matchingIssues = allIssues.filter(
                    i =>
                        i.title.toLowerCase().includes(queryLower) ||
                        i.identifier.toLowerCase().includes(queryLower) ||
                        i.description?.toLowerCase().includes(queryLower)
                );

                if (matchingIssues.length === 0) {
                    vscode.window.showInformationMessage(`No issues found matching "${query}"`);
                    return;
                }

                // Show quick pick with matching issues
                const items = matchingIssues.map(i => ({
                    label: `$(issues) ${i.identifier}`,
                    description: i.title,
                    detail: i.state?.name,
                    issue: i,
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${matchingIssues.length} issue(s)`,
                    matchOnDescription: true,
                    matchOnDetail: true,
                });

                if (selected) {
                    await Container.issueWebviewManager.showIssue(selected.issue);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Search failed: ${message}`);
            }
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
