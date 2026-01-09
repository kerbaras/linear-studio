import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startWorkOnIssue } from '../../../src/commands/startWorkCommand';
import { Container } from '../../../src/container';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

// Mock Container
vi.mock('../../../src/container', () => ({
    Container: {
        issueService: {
            getBranchName: vi.fn(),
        },
        gitService: {
            createBranch: vi.fn(),
        },
    },
}));

describe('startWorkCommand', () => {
    const mockIssue: IssueDTO = {
        id: '1',
        identifier: 'ENG-142',
        title: 'Add user avatar',
        description: 'Implement avatar component',
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

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Container.issueService.getBranchName).mockResolvedValue('user/eng-142-add-avatar');
    });

    it('should create branch when user confirms "Create Branch"', async () => {
        // Given IssueService.getBranchName returns "user/eng-142-add-avatar"
        // And user clicks "Create Branch" in confirmation dialog
        vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('Create Branch' as unknown as vscode.MessageItem);
        vi.mocked(Container.gitService.createBranch).mockResolvedValue(true);

        // When startWorkOnIssue is called with the issue
        await startWorkOnIssue(mockIssue);

        // Then GitService.createBranch should be called with "user/eng-142-add-avatar"
        expect(Container.gitService.createBranch).toHaveBeenCalledWith('user/eng-142-add-avatar');
    });

    it('should create branch and copy to clipboard when user confirms "Create Branch & Copy"', async () => {
        // Given user clicks "Create Branch & Copy" in confirmation dialog
        vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('Create Branch & Copy' as unknown as vscode.MessageItem);
        // And GitService.createBranch succeeds
        vi.mocked(Container.gitService.createBranch).mockResolvedValue(true);

        // When startWorkOnIssue is called
        await startWorkOnIssue(mockIssue);

        // Then GitService.createBranch should be called
        expect(Container.gitService.createBranch).toHaveBeenCalledWith('user/eng-142-add-avatar');
        // And clipboard.writeText should be called with "user/eng-142-add-avatar"
        expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('user/eng-142-add-avatar');
        // And an info message should be shown
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Branch name copied to clipboard');
    });

    it('should not call createBranch when user cancels dialog', async () => {
        // Given user dismisses the confirmation dialog
        vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(undefined);

        // When startWorkOnIssue is called
        await startWorkOnIssue(mockIssue);

        // Then GitService.createBranch should NOT be called
        expect(Container.gitService.createBranch).not.toHaveBeenCalled();
    });

    it('should not copy to clipboard when branch creation fails', async () => {
        // Given GitService.createBranch returns false
        vi.mocked(vscode.window.showInformationMessage).mockResolvedValue('Create Branch & Copy' as unknown as vscode.MessageItem);
        vi.mocked(Container.gitService.createBranch).mockResolvedValue(false);

        // When startWorkOnIssue is called
        await startWorkOnIssue(mockIssue);

        // Then clipboard should NOT be written to
        expect(vscode.env.clipboard.writeText).not.toHaveBeenCalled();
    });
});
