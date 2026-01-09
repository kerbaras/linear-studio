import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueWebviewManager } from '../../../src/views/issueWebview/issueWebviewManager';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

describe('IssueWebviewManager', () => {
    let manager: IssueWebviewManager;
    let mockIssueService: IssueService;
    let mockExtensionUri: vscode.Uri;
    let mockPanels: Map<string, any>;
    let disposeHandlers: Map<string, () => void>;

    const createMockIssue = (id: string): IssueDTO => ({
        id,
        identifier: `ENG-${id}`,
        title: `Test Issue ${id}`,
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: `https://linear.app/test/issue/ENG-${id}`,
        branchName: `user/eng-${id}-test`,
        state: { id: 's1', name: 'Todo', type: 'unstarted', color: '#aaa' },
        labels: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockPanels = new Map();
        disposeHandlers = new Map();
        
        mockIssueService = {
            getIssueWithComments: vi.fn().mockResolvedValue({
                id: '1',
                identifier: 'ENG-1',
                title: 'Test',
                description: 'Test desc',
                comments: [],
            }),
        } as unknown as IssueService;
        
        mockExtensionUri = vscode.Uri.parse('file:///extension');
        
        // Create a more sophisticated panel mock that tracks instances
        vi.mocked(vscode.window.createWebviewPanel).mockImplementation((viewType, title, column, options) => {
            const panelId = title;
            const panel = {
                webview: {
                    html: '',
                    options: {},
                    onDidReceiveMessage: vi.fn((handler) => ({ dispose: vi.fn() })),
                    postMessage: vi.fn().mockResolvedValue(true),
                    asWebviewUri: vi.fn((uri) => uri),
                    cspSource: 'vscode-webview://test',
                },
                reveal: vi.fn(),
                dispose: vi.fn(() => {
                    // Trigger dispose handler when panel is disposed
                    const handler = disposeHandlers.get(panelId);
                    if (handler) handler();
                }),
                onDidDispose: vi.fn((callback) => {
                    disposeHandlers.set(panelId, callback);
                    return { dispose: vi.fn() };
                }),
                title,
                iconPath: undefined,
            };
            mockPanels.set(panelId, panel);
            return panel as any;
        });
        
        manager = new IssueWebviewManager(mockExtensionUri, mockIssueService);
    });

    describe('showIssue', () => {
        it('should create new panel for new issue', async () => {
            // Given no panels exist
            const issue = createMockIssue('1');

            // When showIssue is called with issue { id: "1" }
            await manager.showIssue(issue);

            // Then a new panel should be created
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'linearIssue',
                expect.stringContaining('ENG-1'),
                vscode.ViewColumn.One,
                expect.objectContaining({
                    enableScripts: true,
                })
            );
        });

        it('should reuse existing panel for same issue', async () => {
            // Given a panel exists for issue { id: "1" }
            const issue = createMockIssue('1');
            await manager.showIssue(issue);
            
            const firstCallCount = vi.mocked(vscode.window.createWebviewPanel).mock.calls.length;

            // When showIssue is called with issue { id: "1" } again
            await manager.showIssue(issue);

            // Then NO new panel should be created
            expect(vi.mocked(vscode.window.createWebviewPanel).mock.calls.length).toBe(firstCallCount);
        });

        it('should create new panel for different issue', async () => {
            // Given a panel exists for issue { id: "1" }
            const issue1 = createMockIssue('1');
            await manager.showIssue(issue1);
            
            const firstCallCount = vi.mocked(vscode.window.createWebviewPanel).mock.calls.length;

            // When showIssue is called with issue { id: "2" }
            const issue2 = createMockIssue('2');
            await manager.showIssue(issue2);

            // Then a new panel should be created for issue "2"
            expect(vi.mocked(vscode.window.createWebviewPanel).mock.calls.length).toBe(firstCallCount + 1);
        });

        it('should remove controller from map on panel dispose', async () => {
            // Given a panel for issue { id: "1" } is created
            const issue = createMockIssue('1');
            await manager.showIssue(issue);
            
            // Simulate panel being closed by user
            const panelTitle = Array.from(mockPanels.keys())[0];
            const disposeHandler = disposeHandlers.get(panelTitle);
            expect(disposeHandler).toBeDefined();
            disposeHandler!();
            
            // Clear the mock to track new creations
            vi.mocked(vscode.window.createWebviewPanel).mockClear();

            // When showIssue is called again for the same issue
            await manager.showIssue(issue);
            
            // Then a new panel should be created (the old one was removed from cache)
            expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should clean up all panels', async () => {
            // Given panels exist for issues "1", "2", "3"
            await manager.showIssue(createMockIssue('1'));
            await manager.showIssue(createMockIssue('2'));
            await manager.showIssue(createMockIssue('3'));

            // When manager.dispose() is called
            manager.dispose();

            // Then all panels should be disposed
            for (const panel of mockPanels.values()) {
                expect(panel.dispose).toHaveBeenCalled();
            }
        });
    });
});
