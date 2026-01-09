import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../../src/git/gitService';
import * as vscode from 'vscode';

describe('GitService', () => {
    let gitService: GitService;
    let mockGitExtension: {
        isActive: boolean;
        exports: {
            getAPI: ReturnType<typeof vi.fn>;
        };
        activate: ReturnType<typeof vi.fn>;
    };
    let mockGitApi: {
        repositories: Array<{
            rootUri: { fsPath: string };
            state: {
                HEAD: { name: string } | undefined;
                refs: Array<{ name: string; type: number }>;
                remotes: Array<{ name: string }>;
            };
            checkout: ReturnType<typeof vi.fn>;
            createBranch: ReturnType<typeof vi.fn>;
        }>;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockGitApi = {
            repositories: [],
        };

        mockGitExtension = {
            isActive: true,
            exports: {
                getAPI: vi.fn().mockReturnValue(mockGitApi),
            },
            activate: vi.fn().mockResolvedValue({
                getAPI: vi.fn().mockReturnValue(mockGitApi),
            }),
        };

        vi.mocked(vscode.extensions.getExtension).mockReturnValue(mockGitExtension as unknown as vscode.Extension<unknown>);

        gitService = new GitService();
    });

    describe('getRepository', () => {
        it('should return repository when single repo exists', async () => {
            // Given 1 Git repository is open
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: { HEAD: { name: 'main' }, refs: [], remotes: [] },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return that repository
            expect(result).toBe(mockRepo);
        });

        it('should return undefined when no repos exist', async () => {
            // Given 0 Git repositories are open
            mockGitApi.repositories = [];

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });

        it('should return repository containing active file when multiple repos', async () => {
            // Given 3 Git repositories are open
            const repos = [
                { rootUri: { fsPath: '/Users/dev/project-a' }, state: { HEAD: undefined, refs: [], remotes: [] } },
                { rootUri: { fsPath: '/Users/dev/project-b' }, state: { HEAD: undefined, refs: [], remotes: [] } },
                { rootUri: { fsPath: '/Users/dev/project-c' }, state: { HEAD: undefined, refs: [], remotes: [] } },
            ];
            mockGitApi.repositories = repos as typeof mockGitApi.repositories;

            // And the active file is at "/Users/dev/project-b/src/index.ts"
            vi.mocked(vscode.window).activeTextEditor = {
                document: {
                    uri: { fsPath: '/Users/dev/project-b/src/index.ts' },
                },
            } as unknown as vscode.TextEditor;

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return the repository at "/Users/dev/project-b"
            expect(result?.rootUri.fsPath).toBe('/Users/dev/project-b');
        });

        it('should return first repository when multiple repos and no active file', async () => {
            // Given 2 Git repositories are open
            const repos = [
                { rootUri: { fsPath: '/Users/dev/project-a' }, state: { HEAD: undefined, refs: [], remotes: [] } },
                { rootUri: { fsPath: '/Users/dev/project-b' }, state: { HEAD: undefined, refs: [], remotes: [] } },
            ];
            mockGitApi.repositories = repos as typeof mockGitApi.repositories;

            // And no file is open in the editor
            vi.mocked(vscode.window).activeTextEditor = undefined;

            // When getRepository is called
            const result = await gitService.getRepository();

            // Then it should return the first repository
            expect(result?.rootUri.fsPath).toBe('/Users/dev/project-a');
        });

        it('should return undefined when git extension is not installed', async () => {
            // Given the vscode.git extension is not installed
            vi.mocked(vscode.extensions.getExtension).mockReturnValue(undefined);
            
            // Create a fresh GitService to clear cached API
            const freshGitService = new GitService();

            // When getRepository is called
            const result = await freshGitService.getRepository();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });

    describe('createBranch', () => {
        it('should create new branch and show success message', async () => {
            // Given no branch named "user/eng-123-fix-bug" exists
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: { name: 'main' },
                    refs: [], // No existing branches
                    remotes: [],
                },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.createBranch should be called with ("user/eng-123-fix-bug", true)
            expect(mockRepo.createBranch).toHaveBeenCalledWith('user/eng-123-fix-bug', true);
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Created and switched to branch: user/eng-123-fix-bug'
            );
        });

        it('should checkout existing local branch', async () => {
            // Given a local branch "user/eng-123-fix-bug" already exists
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: { name: 'main' },
                    refs: [
                        { name: 'user/eng-123-fix-bug', type: 0 }, // RefType.Head = 0
                    ],
                    remotes: [],
                },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.checkout should be called with "user/eng-123-fix-bug"
            expect(mockRepo.checkout).toHaveBeenCalledWith('user/eng-123-fix-bug');
            // And repo.createBranch should NOT be called
            expect(mockRepo.createBranch).not.toHaveBeenCalled();
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Switched to existing branch: user/eng-123-fix-bug'
            );
        });

        it('should checkout existing remote branch', async () => {
            // Given no local branch exists but remote branch exists
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: { name: 'main' },
                    refs: [
                        { name: 'origin/user/eng-123-fix-bug', type: 1 }, // RefType.RemoteHead = 1
                    ],
                    remotes: [{ name: 'origin' }],
                },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When createBranch("user/eng-123-fix-bug") is called
            const result = await gitService.createBranch('user/eng-123-fix-bug');

            // Then repo.checkout should be called with "user/eng-123-fix-bug"
            expect(mockRepo.checkout).toHaveBeenCalledWith('user/eng-123-fix-bug');
            // And it should return true
            expect(result).toBe(true);
            // And an info message should be shown
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Checked out remote branch: user/eng-123-fix-bug'
            );
        });

        it('should return false and show error on Git failure', async () => {
            // Given Git throws error
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: { name: 'main' },
                    refs: [],
                    remotes: [],
                },
                checkout: vi.fn(),
                createBranch: vi.fn().mockRejectedValue(new Error('Branch name contains invalid characters')),
            };
            mockGitApi.repositories = [mockRepo];

            // When createBranch("invalid//branch") is called
            const result = await gitService.createBranch('invalid//branch');

            // Then it should return false
            expect(result).toBe(false);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to create branch: Branch name contains invalid characters'
            );
        });

        it('should show error when no repository exists', async () => {
            // Given no Git repository is open
            mockGitApi.repositories = [];

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
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: { name: 'main' },
                    refs: [],
                    remotes: [],
                },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When getCurrentBranch is called
            const result = await gitService.getCurrentBranch();

            // Then it should return "main"
            expect(result).toBe('main');
        });

        it('should return undefined when detached HEAD', async () => {
            // Given the repository is in detached HEAD state
            const mockRepo = {
                rootUri: { fsPath: '/Users/dev/project' },
                state: {
                    HEAD: undefined,
                    refs: [],
                    remotes: [],
                },
                checkout: vi.fn(),
                createBranch: vi.fn(),
            };
            mockGitApi.repositories = [mockRepo];

            // When getCurrentBranch is called
            const result = await gitService.getCurrentBranch();

            // Then it should return undefined
            expect(result).toBeUndefined();
        });
    });
});
