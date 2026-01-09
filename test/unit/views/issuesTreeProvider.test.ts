import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssuesTreeProvider, CycleNode, IssueNode } from '../../../src/views/issues/issuesTreeProvider';
import { IssueService } from '../../../src/linear/issueService';
import { IssueDTO } from '../../../src/linear/types';
import * as vscode from 'vscode';

describe('IssuesTreeProvider', () => {
    let treeProvider: IssuesTreeProvider;
    let mockIssueService: IssueService;

    const createMockIssue = (overrides: Partial<IssueDTO> = {}): IssueDTO => ({
        id: 'issue-1',
        identifier: 'ENG-101',
        title: 'Test Issue',
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: 'https://linear.app/test/issue/ENG-101',
        branchName: 'user/eng-101-test-issue',
        state: {
            id: 'state-1',
            name: 'In Progress',
            type: 'started',
            color: '#f2c94c',
        },
        cycle: {
            id: 'c1',
            name: 'Sprint 1',
            startsAt: '2024-01-01T00:00:00Z',
            endsAt: '2024-01-14T00:00:00Z',
        },
        project: { id: 'p1', name: 'Project 1' },
        assignee: { id: 'user-1', name: 'John', email: 'john@test.com' },
        labels: [{ id: 'l1', name: 'bug', color: '#ff0000' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockIssueService = {
            getMyAssignedIssues: vi.fn(),
            clearCache: vi.fn(),
        } as unknown as IssueService;

        treeProvider = new IssuesTreeProvider(mockIssueService);
    });

    describe('getChildren - Tree Structure', () => {
        it('should group issues by cycle', async () => {
            // Given IssueService returns issues in different cycles
            const issues = [
                createMockIssue({ id: '1', identifier: 'ENG-101', title: 'Issue A', cycle: { id: 'c1', name: 'Sprint 1' } }),
                createMockIssue({ id: '2', identifier: 'ENG-102', title: 'Issue B', cycle: { id: 'c1', name: 'Sprint 1' } }),
                createMockIssue({ id: '3', identifier: 'ENG-103', title: 'Issue C', cycle: { id: 'c2', name: 'Sprint 2' } }),
                createMockIssue({ id: '4', identifier: 'ENG-104', title: 'Issue D', cycle: undefined }),
            ];
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue(issues);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return 3 CycleNodes
            expect(result).toHaveLength(3);
            expect(result[0]).toBeInstanceOf(CycleNode);
            expect(result[1]).toBeInstanceOf(CycleNode);
            expect(result[2]).toBeInstanceOf(CycleNode);
            
            // With correct issue counts
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
                createMockIssue({ id: '1', cycle: { id: 'c1', name: 'Zulu Sprint' } }),
                createMockIssue({ id: '2', cycle: { id: 'c2', name: 'Alpha Sprint' } }),
                createMockIssue({ id: '3', cycle: { id: 'c3', name: 'Mike Sprint' } }),
                createMockIssue({ id: '4', cycle: undefined }),
            ];
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue(issues);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then CycleNodes should be ordered: "Alpha Sprint", "Mike Sprint", "Zulu Sprint"
            const cycleNames = result.map(n => (n as CycleNode).cycleId);
            expect(cycleNames[0]).toBe('c2'); // Alpha Sprint
            expect(cycleNames[1]).toBe('c3'); // Mike Sprint
            expect(cycleNames[2]).toBe('c1'); // Zulu Sprint
            // And "Backlog" should always be last
            expect(cycleNames[3]).toBe('no-cycle');
        });

        it('should return children of CycleNode', async () => {
            // Given a CycleNode with 3 IssueNode children
            const issues = [
                createMockIssue({ id: '1', identifier: 'ENG-101' }),
                createMockIssue({ id: '2', identifier: 'ENG-102' }),
                createMockIssue({ id: '3', identifier: 'ENG-103' }),
            ];
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue(issues);
            
            const rootChildren = await treeProvider.getChildren(undefined);
            const cycleNode = rootChildren[0] as CycleNode;

            // When getChildren(cycleNode) is called
            const result = await treeProvider.getChildren(cycleNode);

            // Then it should return the 3 IssueNode children
            expect(result).toHaveLength(3);
            expect(result[0]).toBeInstanceOf(IssueNode);
        });

        it('should return empty array for IssueNode children', async () => {
            // Given an IssueNode
            const issue = createMockIssue();
            const issueNode = new IssueNode(issue);

            // When getChildren(issueNode) is called
            const result = await treeProvider.getChildren(issueNode);

            // Then it should return an empty array
            expect(result).toHaveLength(0);
        });

        it('should return empty array when no issues', async () => {
            // Given IssueService returns empty array
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue([]);

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return an empty array
            expect(result).toHaveLength(0);
        });

        it('should show error message on fetch error', async () => {
            // Given IssueService throws Error "Network error"
            vi.mocked(mockIssueService.getMyAssignedIssues).mockRejectedValue(new Error('Network error'));

            // When getChildren(undefined) is called
            const result = await treeProvider.getChildren(undefined);

            // Then it should return an empty array
            expect(result).toHaveLength(0);
            // And an error message should be shown
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'Failed to fetch issues: Network error'
            );
        });
    });

    describe('Filtering', () => {
        it('should set cycle filter and trigger refresh', async () => {
            // When setFilter({ cycleId: "c1" }) is called
            treeProvider.setFilter({ cycleId: 'c1' });

            // Then clearCache should be called on IssueService
            expect(mockIssueService.clearCache).toHaveBeenCalled();
        });

        it('should pass filter to IssueService', async () => {
            // When setFilter({ projectId: "p1" }) is called
            treeProvider.setFilter({ projectId: 'p1' });
            
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue([]);
            await treeProvider.getChildren(undefined);

            // Then IssueService.getMyAssignedIssues should be called with { projectId: "p1" }
            expect(mockIssueService.getMyAssignedIssues).toHaveBeenCalledWith({ projectId: 'p1' });
        });

        it('should clear filters with empty object', async () => {
            // Given a filter { cycleId: "c1" } is set
            treeProvider.setFilter({ cycleId: 'c1' });
            
            // When setFilter({}) is called
            treeProvider.setFilter({});
            
            vi.mocked(mockIssueService.getMyAssignedIssues).mockResolvedValue([]);
            await treeProvider.getChildren(undefined);

            // Then IssueService should be called with empty filter
            expect(mockIssueService.getMyAssignedIssues).toHaveBeenCalledWith({});
        });
    });

    describe('Refresh', () => {
        it('should not clear cache when refresh(false)', () => {
            // When refresh(false) is called
            treeProvider.refresh(false);

            // Then IssueService.clearCache should NOT be called
            expect(mockIssueService.clearCache).not.toHaveBeenCalled();
        });

        it('should clear cache when refresh(true)', () => {
            // When refresh(true) is called
            treeProvider.refresh(true);

            // Then IssueService.clearCache should be called
            expect(mockIssueService.clearCache).toHaveBeenCalled();
        });
    });

    describe('IssueNode Properties', () => {
        it('should display issue properties correctly', () => {
            // Given an issue
            const issue = createMockIssue({
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
            // And tooltip should contain relevant info
            expect((node.tooltip as vscode.MarkdownString).value).toContain('ENG-142');
            expect((node.tooltip as vscode.MarkdownString).value).toContain('Add user avatar');
            // And command should be ViewIssue with issue as argument
            expect(node.command?.command).toBe('linear-studio.viewIssue');
            expect(node.command?.arguments?.[0]).toBe(issue);
        });

        it('should show pass icon for completed state', () => {
            const issue = createMockIssue({ state: { id: 's1', name: 'Done', type: 'completed', color: '#0f0' } });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('pass');
        });

        it('should show play-circle icon for started state', () => {
            const issue = createMockIssue({ state: { id: 's1', name: 'In Progress', type: 'started', color: '#ff0' } });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('play-circle');
        });

        it('should show circle-outline icon for unstarted state', () => {
            const issue = createMockIssue({ state: { id: 's1', name: 'Todo', type: 'unstarted', color: '#aaa' } });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('circle-outline');
        });

        it('should show circle-large-outline icon for backlog state', () => {
            const issue = createMockIssue({ state: { id: 's1', name: 'Backlog', type: 'backlog', color: '#aaa' } });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('circle-large-outline');
        });

        it('should show circle-slash icon for canceled state', () => {
            const issue = createMockIssue({ state: { id: 's1', name: 'Canceled', type: 'canceled', color: '#888' } });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('circle-slash');
        });

        it('should show issue-opened icon for unknown state', () => {
            const issue = createMockIssue({ state: undefined });
            const node = new IssueNode(issue);
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('issue-opened');
        });
    });

    describe('CycleNode Properties', () => {
        it('should display cycle with date range', () => {
            // Given a cycle with dates
            const issues = [createMockIssue(), createMockIssue({ id: '2' }), createMockIssue({ id: '3' })];
            const issueNodes = issues.map(i => new IssueNode(i));

            // When a CycleNode is created
            const node = new CycleNode('c1', 'Sprint 1', 'Jan 1 - Jan 14', issueNodes);

            // Then label should include date range
            expect(node.label).toBe('Sprint 1 (Jan 1 - Jan 14)');
            // And description should show issue count
            expect(node.description).toBe('3 issues');
            // And iconPath should be history
            expect((node.iconPath as vscode.ThemeIcon).id).toBe('history');
            // And contextValue should be "cycle"
            expect(node.contextValue).toBe('cycle');
            // And collapsibleState should be Expanded
            expect(node.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Expanded);
        });

        it('should display Backlog without date range', () => {
            const issueNodes = [new IssueNode(createMockIssue())];

            // When a CycleNode is created without date range
            const node = new CycleNode('no-cycle', 'Backlog', undefined, issueNodes);

            // Then label should be "Backlog"
            expect(node.label).toBe('Backlog');
            // And description should be "1 issue" (singular)
            expect(node.description).toBe('1 issue');
        });
    });
});
