import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueWebviewController } from '../../../src/views/issueWebview/issueWebviewController';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO, IssueDetailsDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

describe('IssueWebviewController', () => {
    let controller: IssueWebviewController;
    let mockIssueService: {
        getIssueWithComments: ReturnType<typeof vi.fn>;
    };
    let mockWebview: {
        html: string;
        options: Record<string, unknown>;
        asWebviewUri: ReturnType<typeof vi.fn>;
        postMessage: ReturnType<typeof vi.fn>;
        onDidReceiveMessage: ReturnType<typeof vi.fn>;
        cspSource: string;
    };
    let mockPanel: {
        webview: typeof mockWebview;
        reveal: ReturnType<typeof vi.fn>;
        dispose: ReturnType<typeof vi.fn>;
        onDidDispose: ReturnType<typeof vi.fn>;
        title: string;
        iconPath?: unknown;
    };
    let mockExtensionUri: vscode.Uri;
    let mockIssue: IssueDTO;
    let mockIssueDetails: IssueDetailsDTO;
    let onDisposeCallback: ReturnType<typeof vi.fn>;
    let messageHandler: (message: { type: string; payload?: unknown }) => void;
    let panelDisposeHandler: () => void;

    beforeEach(() => {
        vi.clearAllMocks();

        mockIssue = {
            id: 'issue-1',
            identifier: 'ENG-142',
            title: 'Add user avatar component',
            description: 'Test description',
            priority: 2,
            priorityLabel: 'High',
            url: 'https://linear.app/test/issue/ENG-142',
            branchName: 'user/eng-142-add-avatar',
            state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
            cycle: { id: 'c1', name: 'Sprint 1' },
            project: { id: 'p1', name: 'Frontend' },
            assignee: { id: 'u1', name: 'John Doe', email: 'john@test.com' },
            labels: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
        };

        mockIssueDetails = {
            ...mockIssue,
            comments: [
                { id: 'c1', body: 'First comment', createdAt: '2024-01-01T00:00:00Z', user: { name: 'John', avatarUrl: null } },
            ],
        };

        mockIssueService = {
            getIssueWithComments: vi.fn().mockResolvedValue(mockIssueDetails),
        };

        onDisposeCallback = vi.fn();

        // Capture message handler when onDidReceiveMessage is called
        mockWebview = {
            html: '',
            options: {},
            asWebviewUri: vi.fn().mockImplementation((uri) => uri),
            postMessage: vi.fn().mockResolvedValue(true),
            onDidReceiveMessage: vi.fn().mockImplementation((handler) => {
                messageHandler = handler;
                return { dispose: vi.fn() };
            }),
            cspSource: 'vscode-webview://test',
        };

        mockPanel = {
            webview: mockWebview,
            reveal: vi.fn(),
            dispose: vi.fn(),
            onDidDispose: vi.fn().mockImplementation((callback) => {
                panelDisposeHandler = callback;
                return { dispose: vi.fn() };
            }),
            title: '',
        };

        vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as unknown as vscode.WebviewPanel);

        mockExtensionUri = { fsPath: '/extension' } as vscode.Uri;
        vi.mocked(vscode.Uri.joinPath).mockImplementation((...args) => ({ fsPath: args.join('/') } as vscode.Uri));

        // Create controller - note the argument order: extensionUri, issueService, issue, onDisposeCallback
        controller = new IssueWebviewController(
            mockExtensionUri,
            mockIssueService as unknown as IssueService,
            mockIssue,
            onDisposeCallback
        );
    });

    describe('panel creation', () => {
        it('should create webview panel with correct configuration', () => {
            // Then createWebviewPanel should be called with correct args
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'linearIssue',
                expect.stringContaining('ENG-142'),
                vscode.ViewColumn.One,
                expect.objectContaining({
                    enableScripts: true,
                    retainContextWhenHidden: true,
                })
            );
        });

        it('should truncate long issue titles with ellipsis', () => {
            // Given an issue with a very long title
            const longTitleIssue = {
                ...mockIssue,
                title: 'This is a very long issue title that should be truncated to fit in the panel tab',
            };

            // When IssueWebviewController is instantiated
            vi.mocked(vscode.window.createWebviewPanel).mockClear();
            new IssueWebviewController(
                mockExtensionUri,
                mockIssueService as unknown as IssueService,
                longTitleIssue,
                onDisposeCallback
            );

            // Then panel title should be truncated
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'linearIssue',
                expect.stringMatching(/ENG-142:.*…$/),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('show', () => {
        it('should call panel.reveal() when show is called', async () => {
            // When show() is called
            await controller.show();

            // Then panel.reveal() should be called
            expect(mockPanel.reveal).toHaveBeenCalled();
        });
    });

    describe('message handling', () => {
        it('should load issue data when ready message is received', async () => {
            // Given the webview posts message { type: "ready" }
            // When the message is received
            await messageHandler({ type: 'ready' });

            // Then IssueService.getIssueWithComments should be called
            expect(mockIssueService.getIssueWithComments).toHaveBeenCalledWith('issue-1');
            // And a "loading" message should be posted with { isLoading: true }
            expect(mockWebview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'loading', payload: { isLoading: true } })
            );
            // And an "update" message should be posted with the issue details
            expect(mockWebview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'update', payload: mockIssueDetails })
            );
        });

        it('should execute startWork command when startWork message is received', async () => {
            // Given the webview posts { type: "startWork" }
            // When the message is received
            await messageHandler({ type: 'startWork' });

            // Then commands.executeCommand should be called with "linear-studio.startWork"
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'linear-studio.startWork',
                mockIssue
            );
        });

        it('should open external URL when openInBrowser message is received', async () => {
            // Given the webview posts { type: "openInBrowser", payload: { url: "..." } }
            // When the message is received
            await messageHandler({ type: 'openInBrowser', payload: { url: 'https://linear.app/test' } });

            // Then vscode.env.openExternal should be called with the URL
            expect(vscode.env.openExternal).toHaveBeenCalled();
        });

        it('should reload issue data when refresh message is received', async () => {
            // Given the webview posts { type: "refresh" }
            mockIssueService.getIssueWithComments.mockClear();

            // When the message is received
            await messageHandler({ type: 'refresh' });

            // Then IssueService.getIssueWithComments should be called again
            expect(mockIssueService.getIssueWithComments).toHaveBeenCalledWith('issue-1');
        });

        it('should post error message when loading issue fails', async () => {
            // Given IssueService.getIssueWithComments throws Error
            mockIssueService.getIssueWithComments.mockRejectedValue(new Error('Network error'));

            // When ready message is received
            await messageHandler({ type: 'ready' });

            // Then an "error" message should be posted
            expect(mockWebview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    type: 'error', 
                    payload: { message: 'Network error' } 
                })
            );
        });
    });

    describe('disposal', () => {
        it('should call onDisposeCallback when panel is closed', () => {
            // When the panel is closed
            panelDisposeHandler();

            // Then onDisposeCallback should be called
            expect(onDisposeCallback).toHaveBeenCalled();
        });
    });

    describe('HTML content', () => {
        it('should include CSP with nonce and correct sources', () => {
            // The HTML is set during construction
            const html = mockWebview.html;

            // Then it should include Content-Security-Policy meta tag
            expect(html).toContain('Content-Security-Policy');
            // And script-src should include nonce
            expect(html).toMatch(/script-src.*nonce-/);
            // And style-src should include webview cspSource
            expect(html).toContain('vscode-webview://test');
        });
    });
});
