import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../../src/git/gitService';
import * as vscode from 'vscode';

describe('GitService', () => {
    let gitService: GitService;
    let mockGitExtension: any;
    let mockRepository: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockRepository = {
            rootUri: { fsPath: '/Users/dev/project' },
            state: {
                HEAD: { name: 'main' },
                refs: [],
                remotes: [],
            },
            checkout: vi.fn(),
            createBranch: vi.fn(),
        };
        
        mockGitExtension = {
            exports: {
                getAPI: vi.fn().mockReturnValue({
                    repositories: [mockRepository],
                }),
            },
            isActive: true,
        };
        
        vi.mocked(vscode.extensions.getExtension).mockReturnValue(mockGitExtension);
        
        gitService = new GitService();
    });

    describe('getRepository', () => {
        it('should return repository when single repo exists', async () => {
            // Given 1 Git repository is open
            mockGitExtension.exports.getAPI().repositories = [mockRepository];

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return that repository
            expect(result).toBe(mockRepository);
        });

        it('should return undefined when no repos exist', async () => {
            // Given 0 Git repositories are open
            mockGitExtension.exports.getAPI().repositories = [];

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });

        it('should return repository for active file when multiple repos', async () => {
            // Given 3 Git repositories are open
            const repos = [
                { rootUri: { fsPath: '/Users/dev/project-a' }, state: { HEAD: { name: 'main' }, refs: [] } },
                { rootUri: { fsPath: '/Users/dev/project-b' }, state: { HEAD: { name: 'main' }, refs: [] } },
                { rootUri: { fsPath: '/Users/dev/project-c' }, state: { HEAD: { name: 'main' }, refs: [] } },
            ];
            mockGitExtension.exports.getAPI().repositories = repos;
            
            // And the active file is at "/Users/dev/project-b/src/index.ts"
            vi.mocked(vscode.window).activeTextEditor = {
                document: {
                    uri: { fsPath: '/Users/dev/project-b/src/index.ts' },
                },
            } as any;

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return the repository at "/Users/dev/project-b"
            expect(result?.rootUri.fsPath).toBe('/Users/dev/project-b');
        });

        it('should return first repository when multiple repos and no active file', async () => {
            // Given 2 Git repositories are open
            const repos = [
                { rootUri: { fsPath: '/Users/dev/project-a' }, state: { HEAD: { name: 'main' }, refs: [] } },
                { rootUri: { fsPath: '/Users/dev/project-b' }, state: { HEAD: { name: 'main' }, refs: [] } },
            ];
            mockGitExtension.exports.getAPI().repositories = repos;
            
            // And no file is open in the editor
            vi.mocked(vscode.window).activeTextEditor = undefined;

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return the first repository
            expect(result).toBe(repos[0]);
        });

        it('should return undefined when Git extension not available', async () => {
            // Given the vscode.git extension is not installed
            vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
            gitService = new GitService(); // Reset to clear cached API

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });

    describe('createBranch', () => {
        it('should create new branch successfully', async () => {
            // Given no branch named "user/eng-123-fix-bug" exists
            mockRepository.state.refs = [];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.createBranch should be called with ("user/eng-123-fix-bug", true)
            expect(mockRepository.createBranch).toHaveBeenCalledWith('user/eng-123-fix-bug', true);
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Created and switched to branch: user/eng-123-fix-bug'
            );
        });

        it('should checkout existing local branch', async () => {
            // Given a local branch "user/eng-123-fix-bug" already exists
            mockRepository.state.refs = [
                { name: 'user/eng-123-fix-bug', type: 0 }, // RefType.Head = 0
            ];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.checkout should be called with "user/eng-123-fix-bug"
            expect(mockRepository.checkout).toHaveBeenCalledWith('user/eng-123-fix-bug');
            // And repo.createBranch should NOT be called
            expect(mockRepository.createBranch).not.toHaveBeenCalled();
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Switched to existing branch: user/eng-123-fix-bug'
            );
        });

        it('should checkout existing remote branch', async () => {
            // Given no local branch "user/eng-123-fix-bug" exists
            // And a remote branch "origin/user/eng-123-fix-bug" exists
            mockRepository.state.refs = [
                { name: 'origin/user/eng-123-fix-bug', type: 1 }, // RefType.RemoteHead = 1
            ];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.checkout should be called with "user/eng-123-fix-bug"
            expect(mockRepository.checkout).toHaveBeenCalledWith('user/eng-123-fix-bug');
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Checked out remote branch: user/eng-123-fix-bug'
            );
        });

        it('should return false and show error on Git failure', async () => {
            // Given Git throws error "Branch name contains invalid characters"
            mockRepository.createBranch.mockRejectedValue(new Error('Branch name contains invalid characters'));
            mockRepository.state.refs = [];

            // When createBranch("invalid//branch") is called
            const result = await gitService.createBranch('invalid//branch');

            // Then it should return false
            expect(result).toBe(false);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to create branch: Branch name contains invalid characters'
            );
        });

        it('should return false and show error when no repository', async () => {
            // Given no Git repository is open
            mockGitExtension.exports.getAPI().repositories = [];

            // When createBranch("user/eng-123") is called
            const result = await gitService.createBranch('user/eng-123');

            // Then it should return false
            expect(result).toBe(false);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'No Git repository found. Please open a folder with a Git repository.'
            );
        });
    });

    describe('getCurrentBranch', () => {
        it('should return current branch name', async () => {
            // Given the current branch is "main"
            mockRepository.state.HEAD = { name: 'main' };

            // When getCurrentBranch is called
            const result = await gitService.getCurrentBranch();

            // Then it should return "main"
            expect(result).toBe('main');
        });

        it('should return undefined when detached HEAD', async () => {
            // Given the repository is in detached HEAD state
            mockRepository.state.HEAD = { name: undefined };

            // When getCurrentBranch is called
            const result = await gitService.getCurrentBranch();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });
});
