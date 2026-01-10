import * as vscode from 'vscode';
// Types copied from vscode/extensions/git/src/api/git.d.ts
// See: https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts
import type { API as GitAPI, Repository, GitExtension } from '../types/git';

export class GitService {
    private _gitApi: GitAPI | undefined;
    
    private async getGitApi(): Promise<GitAPI | undefined> {
        if (this._gitApi) {return this._gitApi;}
        
        const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
        if (!gitExtension) {
            return undefined;
        }
        
        try {
            const git = gitExtension.isActive 
                ? gitExtension.exports 
                : await gitExtension.activate();
            
            this._gitApi = git.getAPI(1);
            return this._gitApi;
        } catch {
            return undefined;
        }
    }
    
    async getRepository(): Promise<Repository | undefined> {
        const git = await this.getGitApi();
        if (!git) {return undefined;}
        
        // Use the first repository, or let user pick if multiple
        if (git.repositories.length === 0) {
            return undefined;
        }
        if (git.repositories.length === 1) {
            return git.repositories[0];
        }
        
        // Multiple repos - pick the one containing the active file
        const activeUri = vscode.window.activeTextEditor?.document.uri;
        if (activeUri) {
            for (const repo of git.repositories) {
                if (activeUri.fsPath.startsWith(repo.rootUri.fsPath)) {
                    return repo;
                }
            }
        }
        
        return git.repositories[0];
    }
    
    /**
     * Create and checkout a new branch (like atlascode's createOrCheckoutBranch)
     */
    async createBranch(branchName: string, checkout = true): Promise<boolean> {
        const repo = await this.getRepository();
        if (!repo) {
            vscode.window.showErrorMessage(
                'No Git repository found. Please open a folder with a Git repository.'
            );
            return false;
        }
        
        try {
            // Check if branch already exists locally
            const existingBranch = repo.state.refs.find(
                ref => ref.name === branchName && ref.type === 0 // RefType.Head
            );
            
            if (existingBranch) {
                // Branch exists, just checkout
                await repo.checkout(branchName);
                vscode.window.showInformationMessage(`Switched to existing branch: ${branchName}`);
                return true;
            }
            
            // Check for remote branch
            const remoteBranch = repo.state.refs.find(
                ref => ref.name === `origin/${branchName}` && ref.type === 1 // RefType.RemoteHead
            );
            
            if (remoteBranch) {
                // Checkout remote branch (creates local tracking branch)
                await repo.checkout(branchName);
                vscode.window.showInformationMessage(`Checked out remote branch: ${branchName}`);
                return true;
            }
            
            // Create new branch from current HEAD
            await repo.createBranch(branchName, checkout);
            vscode.window.showInformationMessage(`Created and switched to branch: ${branchName}`);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to create branch: ${message}`);
            return false;
        }
    }
    
    /**
     * Get current branch name
     */
    async getCurrentBranch(): Promise<string | undefined> {
        const repo = await this.getRepository();
        return repo?.state.HEAD?.name;
    }
}
