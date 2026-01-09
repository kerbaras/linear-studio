import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssuesTreeProvider, CycleNode, IssueNode } from '../../../src/views/issues/issuesTreeProvider';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

// Helper to create mock IssueDTO
function createMockIssueDTO(overrides: Partial<IssueDTO> = {}): IssueDTO {
    return {
        id: 'issue-1',
        identifier: 'ENG-101',
        title: 'Test Issue',
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: 'https://linear.app/test/issue/ENG-101',
        branchName: 'user/eng-101-test-issue',
        state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
        cycle: { id: 'c1', name: 'Sprint 1', startsAt: '2024-01-01', endsAt: '2024-01-14' },
        project: { id: 'p1', name: 'Frontend' },
        assignee: { id: 'u1', name: 'John Doe', email: 'john@test.com', avatarUrl: 'https://example.com/avatar.png' },
        labels: [{ id: 'l1', name: 'frontend', color: '#5e6ad2' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        ...overrides,
    };
}

describe('IssuesTreeProvider', () => {
    let treeProvider: IssuesTreeProvider;
    let mockIssueService: {
        getMyAssignedIssues: ReturnType<typeof vi.fn>;
        clearCache: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockIssueService = {
            getMyAssignedIssues: vi.fn(),
            clearCache: vi.fn(),
        };

        treeProvider = new IssuesTreeProvider(mockIssueService as unknown as IssueService);
    });

    describe('getChildren', () => {
        it('should group issues by cycle into CycleNodes', async () => {
            // Given IssueService returns issues in different cycles
            const issues = [
                createMockIssueDTO({ id: '1', identifier: 'ENG-101', cycle: { id: 'c1', name: 'Sprint 1' } }),
                createMockIssueDTO({ id: '2', identifier: 'ENG-102', cycle: { id: 'c1', name: 'Sprint 1' } }),
                createMockIssueDTO({ id: '3', identifier: 'ENG-103', cycle: { id: 'c2', name: 'Sprint 2' } }),
                createMockIssueDTO({ id: '4', identifier: 'ENG-104', cycle: undefined }),
            ];
            mockIssueService.getMyAssignedIssues.mockResolvedValue(issues);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return 3 CycleNodes
            expect(result).toHaveLength(3);
            expect(result[0]).toBeInstanceOf(CycleNode);
            expect(result[1]).toBeInstanceOf(CycleNode);
            expect(result[2]).toBeInstanceOf(CycleNode);

            // Verify cycle groupings
            const sprint1 = result.find(n => (n as CycleNode).cycleId === 'c1') as CycleNode;
            const sprint2 = result.find(n => (n as CycleNode).cycleId === 'c2') as CycleNode;
            const backlog = result.find(n => (n as CycleNode).cycleId === 'no-cycle') as CycleNode;

            expect(sprint1.children).toHaveLength(2);
            expect(sprint2.children).toHaveLength(1);
            expect(backlog.children).toHaveLength(1);
        });

        it('should sort cycles alphabetically with Backlog last', async () => {
            // Given issues in cycles "Zulu Sprint", "Alpha Sprint", "Mike Sprint"
            const issues = [
                createMockIssueDTO({ id: '1', cycle: { id: 'c1', name: 'Zulu Sprint' } }),
                createMockIssueDTO({ id: '2', cycle: { id: 'c2', name: 'Alpha Sprint' } }),
                createMockIssueDTO({ id: '3', cycle: { id: 'c3', name: 'Mike Sprint' } }),
                createMockIssueDTO({ id: '4', cycle: undefined }),
            ];
            mockIssueService.getMyAssignedIssues.mockResolvedValue(issues);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then CycleNodes should be ordered: "Alpha Sprint", "Mike Sprint", "Zulu Sprint"
            const names = result.map(n => (n as CycleNode).cycleId);
            expect(names[0]).toBe('c2'); // Alpha Sprint
            expect(names[1]).toBe('c3'); // Mike Sprint
            expect(names[2]).toBe('c1'); // Zulu Sprint
            // And "Backlog" should always be last
            expect(names[3]).toBe('no-cycle');
        });

        it('should return IssueNode children when CycleNode is provided', async () => {
            // Given a CycleNode with 3 IssueNode children
            const issueNodes = [
                new IssueNode(createMockIssueDTO({ id: '1' })),
                new IssueNode(createMockIssueDTO({ id: '2' })),
                new IssueNode(createMockIssueDTO({ id: '3' })),
            ];
            const cycleNode = new CycleNode('c1', 'Sprint 1', 'Jan 1 - Jan 14', issueNodes);

            // When getChildren(cycleNode) is called
            const result = await treeProvider.getChildren(cycleNode);

            // Then it should return the 3 IssueNode children
            expect(result).toHaveLength(3);
            expect(result).toEqual(issueNodes);
        });

        it('should return empty array when IssueNode is provided', async () => {
            // Given an IssueNode
            const issueNode = new IssueNode(createMockIssueDTO());

            // When getChildren(issueNode) is called
            const result = await treeProvider.getChildren(issueNode);

            // Then it should return an empty array
            expect(result).toEqual([]);
        });

        it('should return empty array when IssueService returns empty array', async () => {
            // Given IssueService returns empty array
            mockIssueService.getMyAssignedIssues.mockResolvedValue([]);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return an empty array
            expect(result).toEqual([]);
        });

        it('should show error message and return empty on fetch error', async () => {
            // Given IssueService throws Error "Network error"
            mockIssueService.getMyAssignedIssues.mockRejectedValue(new Error('Network error'));

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return an empty array
            expect(result).toEqual([]);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to fetch issues: Network error'
            );
        });
    });

    describe('setFilter', () => {
        it('should set cycle filter and trigger refresh', async () => {
            // Track event firing
            const eventHandler = vi.fn();
            treeProvider.onDidChangeTreeData(eventHandler);

            // When setFilter({ cycleId: "c1" }) is called
            treeProvider.setFilter({ cycleId: 'c1' });

            // Then clearCache should be called on IssueService
            expect(mockIssueService.clearCache).toHaveBeenCalled();
            // And onDidChangeTreeData should fire
            expect(eventHandler).toHaveBeenCalledWith(undefined);
        });

        it('should apply project filter to IssueService', async () => {
            // Given issues exist
            mockIssueService.getMyAssignedIssues.mockResolvedValue([]);

            // When setFilter({ projectId: "p1" }) is called
            treeProvider.setFilter({ projectId: 'p1' });

            // When getChildren is called
            await treeProvider.getChildren(undefined);

            // Then IssueService.getMyAssignedIssues should be called with { projectId: "p1" }
            expect(mockIssueService.getMyAssignedIssues).toHaveBeenCalledWith({ projectId: 'p1' });
        });

        it('should clear filters when empty object is provided', async () => {
            // Given a filter is set
            treeProvider.setFilter({ cycleId: 'c1' });
            mockIssueService.getMyAssignedIssues.mockResolvedValue([]);

            // When setFilter({}) is called
            treeProvider.setFilter({});
            await treeProvider.getChildren(undefined);

            // Then IssueService should be called with empty filter
            expect(mockIssueService.getMyAssignedIssues).toHaveBeenCalledWith({});
        });
    });

    describe('refresh', () => {
        it('should fire event without clearing cache when clearCache=false', () => {
            // Track event firing
            const eventHandler = vi.fn();
            treeProvider.onDidChangeTreeData(eventHandler);

            // When refresh(false) is called
            treeProvider.refresh(false);

            // Then IssueService.clearCache should NOT be called
            expect(mockIssueService.clearCache).not.toHaveBeenCalled();
            // And onDidChangeTreeData should fire with undefined
            expect(eventHandler).toHaveBeenCalledWith(undefined);
        });

        it('should clear cache and fire event when clearCache=true', () => {
            // Track event firing
            const eventHandler = vi.fn();
            treeProvider.onDidChangeTreeData(eventHandler);

            // When refresh(true) is called
            treeProvider.refresh(true);

            // Then IssueService.clearCache should be called
            expect(mockIssueService.clearCache).toHaveBeenCalled();
            // And onDidChangeTreeData should fire with undefined
            expect(eventHandler).toHaveBeenCalledWith(undefined);
        });
    });
});

describe('IssueNode', () => {
    it('should set label, description, id, contextValue, command correctly', () => {
        // Given an issue
        const issue = createMockIssueDTO({
            id: 'issue-1',
            identifier: 'ENG-142',
            title: 'Add user avatar',
            state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
            labels: [{ id: 'l1', name: 'frontend', color: '#5e6ad2' }],
        });

        // When an IssueNode is created
        const node = new IssueNode(issue);

        // Then label should be "Add user avatar"
        expect(node.label).toBe('Add user avatar');
        // And description should be "ENG-142"
        expect(node.description).toBe('ENG-142');
        // And id should be "issue-issue-1"
        expect(node.id).toBe('issue-issue-1');
        // And contextValue should be "issue:started"
        expect(node.contextValue).toBe('issue:started');
        // And collapsibleState should be None
        expect(node.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
        // And command should be ViewIssue with issue as argument
        expect(node.command).toMatchObject({
            command: 'linear-studio.viewIssue',
            title: 'View Issue',
            arguments: [issue],
        });
    });

    it('should show pass icon with green color for completed state', () => {
        // Given an issue with state.type = "completed"
        const issue = createMockIssueDTO({
            state: { id: 's1', name: 'Done', type: 'completed', color: '#5e6ad2' },
        });

        // When an IssueNode is created
        const node = new IssueNode(issue);

        // Then iconPath should be ThemeIcon "pass" with color "charts.green"
        expect(node.iconPath).toEqual(
            new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'))
        );
    });

    it('should show play-circle icon with blue color for started state', () => {
        // Given an issue with state.type = "started"
        const issue = createMockIssueDTO({
            state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
        });

        // When an IssueNode is created
        const node = new IssueNode(issue);

        // Then iconPath should be ThemeIcon "play-circle" with color "charts.blue"
        expect(node.iconPath).toEqual(
            new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.blue'))
        );
    });

    it('should show circle-outline icon for unstarted state', () => {
        // Given an issue with state.type = "unstarted"
        const issue = createMockIssueDTO({
            state: { id: 's1', name: 'Todo', type: 'unstarted', color: '#999' },
        });

        // When an IssueNode is created
        const node = new IssueNode(issue);

        // Then iconPath should be ThemeIcon "circle-outline" with no color
        expect(node.iconPath).toEqual(new vscode.ThemeIcon('circle-outline'));
    });
});

describe('CycleNode', () => {
    it('should set label with date range and description with issue count', () => {
        // Given a cycle with issues
        const issueNodes = [
            new IssueNode(createMockIssueDTO({ id: '1' })),
            new IssueNode(createMockIssueDTO({ id: '2' })),
            new IssueNode(createMockIssueDTO({ id: '3' })),
            new IssueNode(createMockIssueDTO({ id: '4' })),
            new IssueNode(createMockIssueDTO({ id: '5' })),
        ];

        // When a CycleNode is created
        const node = new CycleNode('c1', 'Sprint 1', 'Jan 1 - Jan 14', issueNodes);

        // Then label should be "Sprint 1 (Jan 1 - Jan 14)"
        expect(node.label).toBe('Sprint 1 (Jan 1 - Jan 14)');
        // And description should be "5 issues"
        expect(node.description).toBe('5 issues');
        // And iconPath should be ThemeIcon "history"
        expect(node.iconPath).toEqual(new vscode.ThemeIcon('history'));
        // And contextValue should be "cycle"
        expect(node.contextValue).toBe('cycle');
        // And collapsibleState should be Expanded
        expect(node.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should show singular issue count for 1 issue', () => {
        // Given a cycle with 1 issue
        const issueNodes = [new IssueNode(createMockIssueDTO({ id: '1' }))];

        // When a CycleNode is created
        const node = new CycleNode('no-cycle', 'Backlog', undefined, issueNodes);

        // Then label should be "Backlog" (no date range)
        expect(node.label).toBe('Backlog');
        // And description should be "1 issue" (singular)
        expect(node.description).toBe('1 issue');
    });
});
