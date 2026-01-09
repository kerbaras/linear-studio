import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueWebviewManager } from '../../../src/views/issueWebview/issueWebviewManager';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

// Store controller mocks
const controllerMocks = new Map<string, {
    show: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    onDisposeCallback?: () => void;
}>();

// Mock IssueWebviewController
vi.mock('../../../src/views/issueWebview/issueWebviewController', () => ({
    IssueWebviewController: vi.fn().mockImplementation((extensionUri, issueService, issue, onDisposeCallback) => {
        const mock = {
            show: vi.fn().mockResolvedValue(undefined),
            dispose: vi.fn(),
            onDisposeCallback,
        };
        controllerMocks.set(issue.id, mock);
        return mock;
    }),
}));

import { IssueWebviewController } from '../../../src/views/issueWebview/issueWebviewController';

describe('IssueWebviewManager', () => {
    let manager: IssueWebviewManager;
    let mockIssueService: {
        getIssueWithComments: ReturnType<typeof vi.fn>;
    };
    let mockExtensionUri: vscode.Uri;

    const createMockIssue = (id: string): IssueDTO => ({
        id,
        identifier: `ENG-${id}`,
        title: `Issue ${id}`,
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: `https://linear.app/test/issue/ENG-${id}`,
        branchName: `user/eng-${id}-issue`,
        state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
        cycle: { id: 'c1', name: 'Sprint 1' },
        project: { id: 'p1', name: 'Frontend' },
        assignee: { id: 'u1', name: 'John Doe', email: 'john@test.com' },
        labels: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
    });

    beforeEach(() => {
        vi.clearAllMocks();
        controllerMocks.clear();

        mockIssueService = {
            getIssueWithComments: vi.fn(),
        };

        mockExtensionUri = { fsPath: '/extension' } as vscode.Uri;

        manager = new IssueWebviewManager(
            mockExtensionUri,
            mockIssueService as unknown as IssueService
        );
    });

    describe('showIssue', () => {
        it('should create new controller for new issue', async () => {
            // Given no controllers exist
            const issue = createMockIssue('1');

            // When showIssue is called with issue { id: "1" }
            await manager.showIssue(issue);

            // Then a new IssueWebviewController should be created
            expect(IssueWebviewController).toHaveBeenCalledTimes(1);
            expect(IssueWebviewController).toHaveBeenCalledWith(
                mockExtensionUri,
                mockIssueService,
                issue,
                expect.any(Function)
            );
        });

        it('should reuse existing controller for same issue', async () => {
            // Given a controller exists for issue { id: "1" }
            const issue = createMockIssue('1');
            await manager.showIssue(issue);

            const controllerMock = controllerMocks.get('1');

            // When showIssue is called with issue { id: "1" } again
            await manager.showIssue(issue);

            // Then NO new controller should be created
            expect(IssueWebviewController).toHaveBeenCalledTimes(1);
            // And the existing controller's show() should be called
            expect(controllerMock?.show).toHaveBeenCalledTimes(2);
        });

        it('should create separate controllers for different issues', async () => {
            // Given a controller exists for issue { id: "1" }
            const issue1 = createMockIssue('1');
            const issue2 = createMockIssue('2');

            await manager.showIssue(issue1);

            // When showIssue is called with issue { id: "2" }
            await manager.showIssue(issue2);

            // Then a new controller should be created for issue "2"
            expect(IssueWebviewController).toHaveBeenCalledTimes(2);
        });

        it('should remove controller from map when disposed', async () => {
            // Given a controller for issue { id: "1" } is created with onDispose callback
            const issue = createMockIssue('1');
            await manager.showIssue(issue);

            // Get the onDispose callback that was passed to the controller
            const controllerMock = controllerMocks.get('1');
            const onDisposeCallback = controllerMock?.onDisposeCallback;

            // When the controller is disposed (callback is called)
            onDisposeCallback?.();

            // Then issue "1" should be removed from the controllers map
            // (showing the same issue should create a new controller)
            await manager.showIssue(issue);
            expect(IssueWebviewController).toHaveBeenCalledTimes(2);
        });
    });

    describe('dispose', () => {
        it('should clean up all controllers', async () => {
            // Given controllers exist for issues "1", "2", "3"
            await manager.showIssue(createMockIssue('1'));
            await manager.showIssue(createMockIssue('2'));
            await manager.showIssue(createMockIssue('3'));

            // When manager.dispose() is called
            manager.dispose();

            // Then all 3 controllers should be disposed
            for (const [, mock] of controllerMocks) {
                expect(mock.dispose).toHaveBeenCalled();
            }
        });
    });
});
