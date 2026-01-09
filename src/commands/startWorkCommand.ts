import * as vscode from 'vscode';
import { Container } from '../container';
import { IssueDTO } from '../linear/types';

export async function startWorkOnIssue(issue: IssueDTO): Promise<void> {
    // Get branch name from Linear (uses issue.branchName property)
    const branchName = await Container.issueService.getBranchName(issue.id);
    
    // Confirm with user
    const action = await vscode.window.showInformationMessage(
        `Start working on ${issue.identifier}?`,
        { modal: true, detail: `This will create branch: ${branchName}` },
        'Create Branch',
        'Create Branch & Copy'
    );
    
    if (!action) return;
    
    // Create the branch
    const success = await Container.gitService.createBranch(branchName);
    
    if (success && action === 'Create Branch & Copy') {
        await vscode.env.clipboard.writeText(branchName);
        vscode.window.showInformationMessage('Branch name copied to clipboard');
    }
}
