import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueWebviewController } from '../../../src/views/issueWebview/issueWebviewController';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO, IssueDetailsDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

describe('IssueWebviewController', () => {
    let controller: IssueWebviewController;
    let mockIssueService: IssueService;
    let mockPanel: vscode.WebviewPanel;
    let mockExtensionUri: vscode.Uri;
    let onDisposeCallback: ReturnType<typeof vi.fn>;
    let messageHandler: (message: any) => void;

    const mockIssue: IssueDTO = {
        id: '1',
        identifier: 'ENG-142',
        title: 'Add user avatar component',
        description: 'Implement avatar component',
        priority: 2,
        priorityLabel: 'High',
        url: 'https://linear.app/test/issue/ENG-142',
        branchName: 'user/eng-142-add-avatar',
        state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
        labels: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    };

    const mockIssueDetails: IssueDetailsDTO = {
        ...mockIssue,
        comments: [
            { id: 'c1', body: 'Comment 1', createdAt: '2024-01-01T00:00:00Z', user: { id: 'u1', name: 'User 1' } },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockIssueService = {
            getIssueWithComments: vi.fn().mockResolvedValue(mockIssueDetails),
        } as unknown as IssueService;

        mockExtensionUri = vscode.Uri.parse('file:///extension');
        onDisposeCallback = vi.fn();

        // Capture the message handler when onDidReceiveMessage is called
        mockPanel = {
            webview: {
                html: '',
                onDidReceiveMessage: vi.fn((handler) => {
                    messageHandler = handler;
                    return { dispose: vi.fn() };
                }),
                postMessage: vi.fn(),
                asWebviewUri: vi.fn((uri) => uri),
                cspSource: 'https://test.com',
            },
            reveal: vi.fn(),
            dispose: vi.fn(),
            onDidDispose: vi.fn((handler) => {
                return { dispose: vi.fn() };
            }),
            iconPath: undefined,
        } as unknown as vscode.WebviewPanel;

        vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel);

        controller = new IssueWebviewController(
            mockExtensionUri,
            mockIssueService,
            mockIssue,
            onDisposeCallback
        );
    });

    describe('Panel Creation', () => {
        it('should create webview panel with correct configuration', () => {
            // Then createWebviewPanel should be called with correct options
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

        it('should truncate long issue titles', () => {
            const longTitleIssue: IssueDTO = {
                ...mockIssue,
                title: 'This is a very long issue title that should be truncated to fit in the panel title',
            };

            vi.mocked(vscode.window.createWebviewPanel).mockClear();
            
            new IssueWebviewController(
                mockExtensionUri,
                mockIssueService,
                longTitleIssue,
                onDisposeCallback
            );

            // Then panel title should be truncated with ellipsis
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'linearIssue',
                expect.stringMatching(/ENG-142.*…$/),
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('show', () => {
        it('should reveal the panel', async () => {
            // When show() is called
            await controller.show();

            // Then panel.reveal() should be called
            expect(mockPanel.reveal).toHaveBeenCalled();
        });
    });

    describe('Message Handling', () => {
        it('should load issue data on ready message', async () => {
            // Given the webview posts message { type: "ready" }
            // When the message is received
            await messageHandler({ type: 'ready' });

            // Then IssueService.getIssueWithComments should be called
            expect(mockIssueService.getIssueWithComments).toHaveBeenCalledWith('1');
            // And loading messages should be posted
            expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'loading', payload: { isLoading: true } })
            );
            // And update message should be posted
            expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'update', payload: mockIssueDetails })
            );
        });

        it('should execute startWork command on startWork message', async () => {
            // Given the webview posts { type: "startWork", payload: { issueId: "1" } }
            // When the message is received
            await messageHandler({ type: 'startWork', payload: { issueId: '1' } });

            // Then commands.executeCommand should be called with "linear-studio.startWork"
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'linear-studio.startWork',
                mockIssue
            );
        });

        it('should open external URL on openInBrowser message', async () => {
            // Given the webview posts { type: "openInBrowser", payload: { url: "https://linear.app/..." } }
            // When the message is received
            await messageHandler({ type: 'openInBrowser', payload: { url: 'https://linear.app/test' } });

            // Then vscode.env.openExternal should be called with the URL
            expect(vscode.env.openExternal).toHaveBeenCalled();
        });

        it('should refresh issue data on refresh message', async () => {
            // Given the webview posts { type: "refresh" }
            // When the message is received
            await messageHandler({ type: 'refresh' });

            // Then IssueService.getIssueWithComments should be called again
            expect(mockIssueService.getIssueWithComments).toHaveBeenCalledWith('1');
        });

        it('should post error message on load failure', async () => {
            // Given IssueService.getIssueWithComments throws Error "Network error"
            vi.mocked(mockIssueService.getIssueWithComments).mockRejectedValue(new Error('Network error'));

            // When ready message is received
            await messageHandler({ type: 'ready' });

            // Then an "error" message should be posted
            expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error', payload: { message: 'Network error' } })
            );
        });
    });

    describe('HTML Content', () => {
        it('should include correct CSP in HTML content', () => {
            // The HTML is set during construction
            const html = mockPanel.webview.html;
            
            // Then it should include Content-Security-Policy meta tag
            expect(html).toContain('Content-Security-Policy');
            // And script-src should include nonce
            expect(html).toContain("script-src 'nonce-");
            // And style-src should include webview.cspSource
            expect(html).toContain('style-src');
            // And img-src should allow https: and data:
            expect(html).toContain('img-src');
            expect(html).toContain('https:');
            expect(html).toContain('data:');
        });
    });

    describe('Disposal', () => {
        it('should call onDisposeCallback and clean up on dispose', () => {
            // When dispose is called
            controller.dispose();

            // Then the panel should be disposed
            expect(mockPanel.dispose).toHaveBeenCalled();
        });
    });
});
