import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueWebviewManager } from '../../../src/views/issueWebview/issueWebviewManager';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

// Mock IssueWebviewController
vi.mock('../../../src/views/issueWebview/issueWebviewController', () => ({
    IssueWebviewController: vi.fn().mockImplementation(() => ({
        show: vi.fn(),
        dispose: vi.fn(),
        onDispose: vi.fn(),
    })),
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
        it('should create new controller for new issue', () => {
            // Given no controllers exist
            const issue = createMockIssue('1');

            // When showIssue is called with issue { id: "1" }
            manager.showIssue(issue);

            // Then a new IssueWebviewController should be created
            expect(IssueWebviewController).toHaveBeenCalledTimes(1);
            expect(IssueWebviewController).toHaveBeenCalledWith(
                mockExtensionUri,
                issue,
                mockIssueService,
                expect.any(Function)
            );
        });

        it('should reuse existing controller for same issue', () => {
            // Given a controller exists for issue { id: "1" }
            const issue = createMockIssue('1');
            manager.showIssue(issue);

            const mockController = vi.mocked(IssueWebviewController).mock.results[0].value;

            // When showIssue is called with issue { id: "1" } again
            manager.showIssue(issue);

            // Then NO new controller should be created
            expect(IssueWebviewController).toHaveBeenCalledTimes(1);
            // And the existing controller's show() should be called
            expect(mockController.show).toHaveBeenCalled();
        });

        it('should create separate controllers for different issues', () => {
            // Given a controller exists for issue { id: "1" }
            const issue1 = createMockIssue('1');
            const issue2 = createMockIssue('2');

            manager.showIssue(issue1);

            // When showIssue is called with issue { id: "2" }
            manager.showIssue(issue2);

            // Then a new controller should be created for issue "2"
            expect(IssueWebviewController).toHaveBeenCalledTimes(2);
        });

        it('should remove controller from map when disposed', () => {
            // Given a controller for issue { id: "1" } is created with onDispose callback
            const issue = createMockIssue('1');
            manager.showIssue(issue);

            // Get the onDispose callback that was passed to the controller
            const mockControllerClass = vi.mocked(IssueWebviewController);
            const onDisposeCallback = mockControllerClass.mock.calls[0][3] as () => void;

            // When the controller is disposed (callback is called)
            onDisposeCallback();

            // Then issue "1" should be removed from the controllers map
            // (showing the same issue should create a new controller)
            manager.showIssue(issue);
            expect(IssueWebviewController).toHaveBeenCalledTimes(2);
        });
    });

    describe('dispose', () => {
        it('should clean up all controllers', () => {
            // Given controllers exist for issues "1", "2", "3"
            manager.showIssue(createMockIssue('1'));
            manager.showIssue(createMockIssue('2'));
            manager.showIssue(createMockIssue('3'));

            const controllers = vi.mocked(IssueWebviewController).mock.results.map(r => r.value);

            // When manager.dispose() is called
            manager.dispose();

            // Then all 3 controllers should be disposed
            controllers.forEach(ctrl => {
                expect(ctrl.dispose).toHaveBeenCalled();
            });
        });
    });
});
