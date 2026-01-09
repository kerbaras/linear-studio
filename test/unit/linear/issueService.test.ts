import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IssueService } from '../../../src/linear/issueService';
import { LinearClientManager } from '../../../src/linear/linearClientManager';

// Helper to create mock issues
function createMockIssue(overrides: Partial<{
    id: string;
    identifier: string;
    title: string;
    description: string;
    priority: number;
    priorityLabel: string;
    url: string;
    branchName: string;
    createdAt: Date;
    updatedAt: Date;
    state: { id: string; name: string; type: string; color: string } | null;
    cycle: { id: string; name: string; number: number; startsAt: Date; endsAt: Date } | null;
    project: { id: string; name: string } | null;
    assignee: { id: string; name: string; email: string; avatarUrl: string } | null;
    labels: Array<{ id: string; name: string; color: string }>;
}> = {}) {
    const defaults = {
        id: 'issue-1',
        identifier: 'ENG-101',
        title: 'Test Issue',
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: 'https://linear.app/test/issue/ENG-101',
        branchName: 'user/eng-101-test-issue',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        state: { id: 's1', name: 'In Progress', type: 'started', color: '#f2c94c' },
        cycle: { id: 'c1', name: 'Sprint 1', number: 1, startsAt: new Date('2024-01-01'), endsAt: new Date('2024-01-14') },
        project: { id: 'p1', name: 'Frontend' },
        assignee: { id: 'u1', name: 'John Doe', email: 'john@test.com', avatarUrl: 'https://example.com/avatar.png' },
        labels: [{ id: 'l1', name: 'frontend', color: '#5e6ad2' }],
    };

    const data = { ...defaults, ...overrides };

    return {
        id: data.id,
        identifier: data.identifier,
        title: data.title,
        description: data.description,
        priority: data.priority,
        priorityLabel: data.priorityLabel,
        url: data.url,
        branchName: data.branchName,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        state: data.state ? Promise.resolve(data.state) : Promise.resolve(null),
        cycle: data.cycle ? Promise.resolve(data.cycle) : Promise.resolve(null),
        project: data.project ? Promise.resolve(data.project) : Promise.resolve(null),
        assignee: data.assignee ? Promise.resolve(data.assignee) : Promise.resolve(null),
        labels: () => Promise.resolve({ nodes: data.labels }),
        comments: vi.fn().mockResolvedValue({ nodes: [], pageInfo: { hasNextPage: false } }),
    };
}

describe('IssueService', () => {
    let issueService: IssueService;
    let mockClientManager: {
        getClient: ReturnType<typeof vi.fn>;
    };
    let mockAssignedIssues: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockAssignedIssues = vi.fn();

        mockClientManager = {
            getClient: vi.fn().mockResolvedValue({
                viewer: Promise.resolve({
                    id: 'user-1',
                    name: 'Test User',
                    assignedIssues: mockAssignedIssues,
                }),
                issue: vi.fn(),
                cycles: vi.fn(),
                projects: vi.fn(),
            }),
        };

        issueService = new IssueService(mockClientManager as unknown as LinearClientManager);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getMyAssignedIssues', () => {
        it('should return all issues as DTOs without filters', async () => {
            // Given the Linear API returns mock issues
            const mockIssues = [
                createMockIssue({ id: '1', identifier: 'ENG-101', title: 'Issue A' }),
                createMockIssue({ id: '2', identifier: 'ENG-102', title: 'Issue B' }),
                createMockIssue({ id: '3', identifier: 'ENG-103', title: 'Issue C' }),
            ];
            mockAssignedIssues.mockResolvedValue({
                nodes: mockIssues,
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called with no filter
            const result = await issueService.getMyAssignedIssues();

            // Then it should return 3 IssueDTO objects
            expect(result).toHaveLength(3);
            // And each DTO should have id, identifier, title, state, cycle, labels array
            expect(result[0]).toMatchObject({
                id: '1',
                identifier: 'ENG-101',
                title: 'Issue A',
            });
            expect(result[0].state).toBeDefined();
            expect(result[0].labels).toBeInstanceOf(Array);
        });

        it('should apply cycle filter correctly', async () => {
            // Given filter { cycleId: "c1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            await issueService.getMyAssignedIssues({ cycleId: 'c1' });

            // Then the API should be called with filter { cycle: { id: { eq: "c1" } } }
            expect(mockAssignedIssues).toHaveBeenCalledWith(
                expect.objectContaining({
                    filter: expect.objectContaining({
                        cycle: { id: { eq: 'c1' } },
                    }),
                })
            );
        });

        it('should apply project filter correctly', async () => {
            // Given filter { projectId: "p1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            await issueService.getMyAssignedIssues({ projectId: 'p1' });

            // Then the API should be called with filter { project: { id: { eq: "p1" } } }
            expect(mockAssignedIssues).toHaveBeenCalledWith(
                expect.objectContaining({
                    filter: expect.objectContaining({
                        project: { id: { eq: 'p1' } },
                    }),
                })
            );
        });

        it('should apply team filter correctly', async () => {
            // Given filter { teamId: "team-1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            await issueService.getMyAssignedIssues({ teamId: 'team-1' });

            // Then the API should be called with filter { team: { id: { eq: "team-1" } } }
            expect(mockAssignedIssues).toHaveBeenCalledWith(
                expect.objectContaining({
                    filter: expect.objectContaining({
                        team: { id: { eq: 'team-1' } },
                    }),
                })
            );
        });

        it('should apply combined filters correctly', async () => {
            // Given filter { cycleId: "c1", projectId: "p1", teamId: "t1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            await issueService.getMyAssignedIssues({ cycleId: 'c1', projectId: 'p1', teamId: 't1' });

            // Then the API should be called with all three filter conditions
            expect(mockAssignedIssues).toHaveBeenCalledWith(
                expect.objectContaining({
                    filter: {
                        cycle: { id: { eq: 'c1' } },
                        project: { id: { eq: 'p1' } },
                        team: { id: { eq: 't1' } },
                    },
                })
            );
        });

        it('should return cached results within TTL', async () => {
            // Given getMyAssignedIssues was called with no filter
            const mockIssues = [createMockIssue({ id: '1' })];
            mockAssignedIssues.mockResolvedValue({
                nodes: mockIssues,
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();

            // Advance time by 30 seconds (within 60s TTL)
            vi.advanceTimersByTime(30_000);
            mockAssignedIssues.mockClear();

            // When getMyAssignedIssues is called again with no filter
            const result = await issueService.getMyAssignedIssues();

            // Then it should return cached results
            expect(result).toHaveLength(1);
            // And the Linear API should NOT be called again
            expect(mockAssignedIssues).not.toHaveBeenCalled();
        });

        it('should call API after TTL expires', async () => {
            // Given getMyAssignedIssues was called
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '1' })],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();

            // Advance time by 61 seconds (past 60s TTL)
            vi.advanceTimersByTime(61_000);
            mockAssignedIssues.mockClear();
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '2' })],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called again
            const result = await issueService.getMyAssignedIssues();

            // Then the Linear API should be called
            expect(mockAssignedIssues).toHaveBeenCalled();
            expect(result[0].id).toBe('2');
        });

        it('should use different cache keys for different filters', async () => {
            // Given getMyAssignedIssues was called with { cycleId: "c1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '1' })],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues({ cycleId: 'c1' });

            mockAssignedIssues.mockClear();
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '2' })],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called with { cycleId: "c2" }
            await issueService.getMyAssignedIssues({ cycleId: 'c2' });

            // Then the Linear API should be called (cache miss)
            expect(mockAssignedIssues).toHaveBeenCalled();
        });

        it('should handle pagination for more than 50 issues', async () => {
            // Given the Linear API returns paginated results
            const page1Issues = Array.from({ length: 50 }, (_, i) => 
                createMockIssue({ id: `${i + 1}`, identifier: `ENG-${i + 1}` })
            );
            const page2Issues = Array.from({ length: 25 }, (_, i) => 
                createMockIssue({ id: `${i + 51}`, identifier: `ENG-${i + 51}` })
            );

            const mockFetchNext = vi.fn().mockResolvedValue({
                nodes: [...page1Issues, ...page2Issues],
                pageInfo: { hasNextPage: false },
                fetchNext: vi.fn(),
            });

            mockAssignedIssues.mockResolvedValue({
                nodes: page1Issues,
                pageInfo: { hasNextPage: true },
                fetchNext: mockFetchNext,
            });

            // When getMyAssignedIssues is called
            const result = await issueService.getMyAssignedIssues();

            // Then fetchNext should be called once
            expect(mockFetchNext).toHaveBeenCalled();
            // And it should return 75 IssueDTO objects total
            expect(result).toHaveLength(75);
        });
    });

    describe('clearCache', () => {
        it('should empty the cache', async () => {
            // Given issues are cached
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '1' })],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();

            mockAssignedIssues.mockClear();

            // When clearCache is called
            issueService.clearCache();

            // Then the next getMyAssignedIssues should call the API
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '2' })],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();

            expect(mockAssignedIssues).toHaveBeenCalled();
        });
    });

    describe('getIssueWithComments', () => {
        it('should return issue with comments array', async () => {
            // Given issue "issue-1" exists with 3 comments
            const mockComments = [
                { id: 'c1', body: 'Comment 1', createdAt: new Date(), user: Promise.resolve({ id: 'u1', name: 'User 1', avatarUrl: null }) },
                { id: 'c2', body: 'Comment 2', createdAt: new Date(), user: Promise.resolve({ id: 'u2', name: 'User 2', avatarUrl: null }) },
                { id: 'c3', body: 'Comment 3', createdAt: new Date(), user: Promise.resolve({ id: 'u3', name: 'User 3', avatarUrl: null }) },
            ];

            const mockIssue = createMockIssue({ id: 'issue-1' });
            mockIssue.comments = vi.fn().mockResolvedValue({
                nodes: mockComments,
                pageInfo: { hasNextPage: false },
            });

            mockClientManager.getClient = vi.fn().mockResolvedValue({
                issue: vi.fn().mockResolvedValue(mockIssue),
            });

            // When getIssueWithComments("issue-1") is called
            const result = await issueService.getIssueWithComments('issue-1');

            // Then it should return IssueDetailsDTO with comments array of length 3
            expect(result.comments).toHaveLength(3);
            // And each comment should have id, body, createdAt, user
            expect(result.comments[0]).toMatchObject({
                id: 'c1',
                body: 'Comment 1',
            });
            expect(result.comments[0].user).toBeDefined();
        });

        it('should paginate comments over 50', async () => {
            // Given issue "issue-1" has 75 comments
            const page1Comments = Array.from({ length: 50 }, (_, i) => ({
                id: `c${i + 1}`,
                body: `Comment ${i + 1}`,
                createdAt: new Date(),
                user: Promise.resolve({ id: 'u1', name: 'User', avatarUrl: null }),
            }));
            const page2Comments = Array.from({ length: 25 }, (_, i) => ({
                id: `c${i + 51}`,
                body: `Comment ${i + 51}`,
                createdAt: new Date(),
                user: Promise.resolve({ id: 'u1', name: 'User', avatarUrl: null }),
            }));

            const mockFetchNext = vi.fn().mockResolvedValue({
                nodes: [...page1Comments, ...page2Comments],
                pageInfo: { hasNextPage: false },
            });

            const mockIssue = createMockIssue({ id: 'issue-1' });
            mockIssue.comments = vi.fn().mockResolvedValue({
                nodes: page1Comments,
                pageInfo: { hasNextPage: true },
                fetchNext: mockFetchNext,
            });

            mockClientManager.getClient = vi.fn().mockResolvedValue({
                issue: vi.fn().mockResolvedValue(mockIssue),
            });

            // When getIssueWithComments("issue-1") is called
            const result = await issueService.getIssueWithComments('issue-1');

            // Then it should fetch all 75 comments via pagination
            expect(mockFetchNext).toHaveBeenCalled();
            expect(result.comments).toHaveLength(75);
        });
    });

    describe('getBranchName', () => {
        it('should return issue branchName from API', async () => {
            // Given issue "issue-1" has branchName "user/eng-142-add-avatar"
            mockClientManager.getClient = vi.fn().mockResolvedValue({
                issue: vi.fn().mockResolvedValue({
                    branchName: 'user/eng-142-add-avatar',
                }),
            });

            // When getBranchName("issue-1") is called
            const result = await issueService.getBranchName('issue-1');

            // Then it should return "user/eng-142-add-avatar"
            expect(result).toBe('user/eng-142-add-avatar');
        });
    });

    describe('getActiveCycles', () => {
        it('should return array of cycle objects', async () => {
            // Given 3 active cycles exist
            const mockCycles = [
                { id: 'c1', name: 'Sprint 1', number: 1, startsAt: new Date('2024-01-01'), endsAt: new Date('2024-01-14') },
                { id: 'c2', name: 'Sprint 2', number: 2, startsAt: new Date('2024-01-15'), endsAt: new Date('2024-01-28') },
                { id: 'c3', name: null, number: 3, startsAt: new Date('2024-01-29'), endsAt: new Date('2024-02-11') },
            ];

            mockClientManager.getClient = vi.fn().mockResolvedValue({
                cycles: vi.fn().mockResolvedValue({
                    nodes: mockCycles,
                }),
            });

            // When getActiveCycles is called
            const result = await issueService.getActiveCycles();

            // Then it should return 3 cycle objects with id, name, startsAt, endsAt
            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({ id: 'c1', name: 'Sprint 1' });
            // Cycle with null name should use "Cycle {number}" format
            expect(result[2].name).toBe('Cycle 3');
        });
    });

    describe('getProjects', () => {
        it('should return array of project objects', async () => {
            // Given 2 projects exist
            const mockProjects = [
                { id: 'p1', name: 'Frontend' },
                { id: 'p2', name: 'Backend' },
            ];

            mockClientManager.getClient = vi.fn().mockResolvedValue({
                projects: vi.fn().mockResolvedValue({
                    nodes: mockProjects,
                }),
            });

            // When getProjects is called
            const result = await issueService.getProjects();

            // Then it should return 2 project objects with id and name
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'p1', name: 'Frontend' });
            expect(result[1]).toEqual({ id: 'p2', name: 'Backend' });
        });
    });
});
