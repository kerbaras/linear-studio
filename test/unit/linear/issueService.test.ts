import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueService } from '../../../src/linear/issueService';
import { LinearClientManager } from '../../../src/linear/linearClientManager';

describe('IssueService', () => {
    let issueService: IssueService;
    let mockClientManager: LinearClientManager;
    let mockAssignedIssues: ReturnType<typeof vi.fn>;
    let mockViewer: { assignedIssues: ReturnType<typeof vi.fn> };

    const createMockIssue = (overrides: Record<string, unknown> = {}) => ({
        id: 'issue-1',
        identifier: 'ENG-101',
        title: 'Test Issue',
        description: 'Test description',
        priority: 2,
        priorityLabel: 'High',
        url: 'https://linear.app/test/issue/ENG-101',
        branchName: 'user/eng-101-test-issue',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        state: Promise.resolve({
            id: 'state-1',
            name: 'In Progress',
            type: 'started',
            color: '#f2c94c',
        }),
        cycle: Promise.resolve({
            id: 'c1',
            name: 'Sprint 1',
            number: 1,
            startsAt: new Date('2024-01-01'),
            endsAt: new Date('2024-01-14'),
        }),
        project: Promise.resolve({ id: 'p1', name: 'Project 1' }),
        assignee: Promise.resolve({ id: 'user-1', name: 'John', email: 'john@test.com', avatarUrl: null }),
        labels: vi.fn().mockResolvedValue({ nodes: [{ id: 'l1', name: 'bug', color: '#ff0000' }] }),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        mockAssignedIssues = vi.fn();
        mockViewer = { assignedIssues: mockAssignedIssues };
        
        mockClientManager = {
            getClient: vi.fn().mockResolvedValue({
                viewer: Promise.resolve(mockViewer),
                issue: vi.fn(),
                cycles: vi.fn(),
                projects: vi.fn(),
            }),
        } as unknown as LinearClientManager;

        issueService = new IssueService(mockClientManager);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getMyAssignedIssues', () => {
        it('should return IssueDTO objects without filters', async () => {
            // Given the Linear API returns all mock issues
            const mockIssues = [
                createMockIssue({ id: '1', identifier: 'ENG-101' }),
                createMockIssue({ id: '2', identifier: 'ENG-102' }),
                createMockIssue({ id: '3', identifier: 'ENG-103' }),
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
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('identifier');
            expect(result[0]).toHaveProperty('title');
            expect(result[0]).toHaveProperty('state');
            expect(result[0]).toHaveProperty('cycle');
            expect(result[0]).toHaveProperty('labels');
            expect(Array.isArray(result[0].labels)).toBe(true);
        });

        it('should apply cycle filter when provided', async () => {
            // Given filter { cycleId: "c1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
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

        it('should apply project filter when provided', async () => {
            // Given filter { projectId: "p1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
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

        it('should apply team filter when provided', async () => {
            // Given filter { teamId: "team-1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
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

        it('should apply combined filters when provided', async () => {
            // Given filter { cycleId: "c1", projectId: "p1", teamId: "t1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            await issueService.getMyAssignedIssues({ cycleId: 'c1', projectId: 'p1', teamId: 't1' });

            // Then the API should be called with all three filter conditions
            expect(mockAssignedIssues).toHaveBeenCalledWith(
                expect.objectContaining({
                    filter: expect.objectContaining({
                        cycle: { id: { eq: 'c1' } },
                        project: { id: { eq: 'p1' } },
                        team: { id: { eq: 't1' } },
                    }),
                })
            );
        });

        it('should return cached results within TTL', async () => {
            // Given getMyAssignedIssues was called 30 seconds ago with no filter
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();
            mockAssignedIssues.mockClear();

            // Advance time by 30 seconds (within 60s TTL)
            vi.advanceTimersByTime(30_000);

            // When getMyAssignedIssues is called again with no filter
            const result = await issueService.getMyAssignedIssues();

            // Then it should return cached results
            expect(result).toHaveLength(1);
            // And the Linear API should NOT be called again
            expect(mockAssignedIssues).not.toHaveBeenCalled();
        });

        it('should fetch fresh data after TTL expires', async () => {
            // Given getMyAssignedIssues was called 61 seconds ago (TTL is 60s)
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();
            mockAssignedIssues.mockClear();

            // Advance time by 61 seconds (past 60s TTL)
            vi.advanceTimersByTime(61_000);

            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue(), createMockIssue({ id: '2' })],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called again with no filter
            const result = await issueService.getMyAssignedIssues();

            // Then the Linear API should be called
            expect(mockAssignedIssues).toHaveBeenCalled();
            // And new results should be cached
            expect(result).toHaveLength(2);
        });

        it('should use different cache keys for different filters', async () => {
            // Given getMyAssignedIssues was called with { cycleId: "c1" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues({ cycleId: 'c1' });
            mockAssignedIssues.mockClear();

            // When getMyAssignedIssues is called with { cycleId: "c2" }
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue({ id: '2' })],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues({ cycleId: 'c2' });

            // Then the Linear API should be called (cache miss)
            expect(mockAssignedIssues).toHaveBeenCalled();
        });

        it('should handle pagination for more than 50 issues', async () => {
            // Given the Linear API returns paginated results
            const firstPageIssues = Array.from({ length: 50 }, (_, i) => 
                createMockIssue({ id: `issue-${i}` })
            );
            const secondPageIssues = Array.from({ length: 25 }, (_, i) => 
                createMockIssue({ id: `issue-${50 + i}` })
            );

            const mockFetchNext = vi.fn().mockResolvedValue({
                nodes: [...firstPageIssues, ...secondPageIssues],
                pageInfo: { hasNextPage: false },
                fetchNext: vi.fn(),
            });

            mockAssignedIssues.mockResolvedValue({
                nodes: firstPageIssues,
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

        it('should convert Issue to IssueDTO correctly', async () => {
            // Given a Linear Issue with specific properties
            const mockIssue = createMockIssue({
                id: 'issue-1',
                identifier: 'ENG-142',
                title: 'Add user avatar',
                description: 'Implement avatar component',
                priority: 2,
                priorityLabel: 'High',
                url: 'https://linear.app/test/issue/ENG-142',
                branchName: 'user/eng-142-add-user-avatar',
            });
            mockAssignedIssues.mockResolvedValue({
                nodes: [mockIssue],
                pageInfo: { hasNextPage: false },
            });

            // When getMyAssignedIssues is called
            const result = await issueService.getMyAssignedIssues();

            // Then the returned DTO should have all properties mapped correctly
            expect(result[0].id).toBe('issue-1');
            expect(result[0].identifier).toBe('ENG-142');
            expect(result[0].title).toBe('Add user avatar');
            expect(result[0].description).toBe('Implement avatar component');
            expect(result[0].priority).toBe(2);
            expect(result[0].priorityLabel).toBe('High');
            expect(result[0].state?.type).toBe('started');
            expect(result[0].state?.name).toBe('In Progress');
            // And dates should be ISO string format
            expect(typeof result[0].createdAt).toBe('string');
            expect(typeof result[0].updatedAt).toBe('string');
            // And labels should be an array
            expect(Array.isArray(result[0].labels)).toBe(true);
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', async () => {
            // Given issues are cached
            mockAssignedIssues.mockResolvedValue({
                nodes: [createMockIssue()],
                pageInfo: { hasNextPage: false },
            });
            await issueService.getMyAssignedIssues();
            mockAssignedIssues.mockClear();

            // When clearCache is called
            issueService.clearCache();

            // Then the cache should be empty
            // And the next getMyAssignedIssues should call the API
            await issueService.getMyAssignedIssues();
            expect(mockAssignedIssues).toHaveBeenCalled();
        });
    });

    describe('getIssueWithComments', () => {
        it('should return IssueDetailsDTO with comments', async () => {
            // Given issue "issue-1" exists with 3 comments
            const mockComments = [
                { id: 'c1', body: 'Comment 1', createdAt: new Date(), user: Promise.resolve({ id: 'u1', name: 'User 1', avatarUrl: null }) },
                { id: 'c2', body: 'Comment 2', createdAt: new Date(), user: Promise.resolve({ id: 'u2', name: 'User 2', avatarUrl: null }) },
                { id: 'c3', body: 'Comment 3', createdAt: new Date(), user: Promise.resolve({ id: 'u3', name: 'User 3', avatarUrl: null }) },
            ];
            
            const mockIssue = {
                ...createMockIssue(),
                comments: vi.fn().mockResolvedValue({
                    nodes: mockComments,
                    pageInfo: { hasNextPage: false },
                }),
            };
            
            const mockClient = await mockClientManager.getClient();
            vi.mocked(mockClient.issue).mockResolvedValue(mockIssue as any);

            // When getIssueWithComments("issue-1") is called
            const result = await issueService.getIssueWithComments('issue-1');

            // Then it should return IssueDetailsDTO with comments array of length 3
            expect(result.comments).toHaveLength(3);
            // And each comment should have id, body, createdAt, user
            expect(result.comments[0]).toHaveProperty('id');
            expect(result.comments[0]).toHaveProperty('body');
            expect(result.comments[0]).toHaveProperty('createdAt');
            expect(result.comments[0]).toHaveProperty('user');
        });
    });

    describe('getBranchName', () => {
        it('should return branch name from Linear', async () => {
            // Given issue "issue-1" has branchName "user/eng-142-add-avatar"
            const mockIssue = { branchName: 'user/eng-142-add-avatar' };
            const mockClient = await mockClientManager.getClient();
            vi.mocked(mockClient.issue).mockResolvedValue(mockIssue as any);

            // When getBranchName("issue-1") is called
            const result = await issueService.getBranchName('issue-1');

            // Then it should return "user/eng-142-add-avatar"
            expect(result).toBe('user/eng-142-add-avatar');
        });
    });

    describe('getActiveCycles', () => {
        it('should return active cycles', async () => {
            // Given 3 active cycles exist
            const mockCycles = [
                { id: 'c1', name: 'Sprint 1', number: 1, startsAt: new Date('2024-01-01'), endsAt: new Date('2024-01-14') },
                { id: 'c2', name: 'Sprint 2', number: 2, startsAt: new Date('2024-01-15'), endsAt: new Date('2024-01-28') },
                { id: 'c3', name: 'Sprint 3', number: 3, startsAt: new Date('2024-01-29'), endsAt: new Date('2024-02-11') },
            ];
            
            const mockClient = await mockClientManager.getClient();
            vi.mocked(mockClient.cycles).mockResolvedValue({ nodes: mockCycles } as any);

            // When getActiveCycles is called
            const result = await issueService.getActiveCycles();

            // Then it should return 3 cycle objects with id, name, startsAt, endsAt
            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('startsAt');
            expect(result[0]).toHaveProperty('endsAt');
        });
    });

    describe('getProjects', () => {
        it('should return projects', async () => {
            // Given 2 projects exist
            const mockProjects = [
                { id: 'p1', name: 'Frontend' },
                { id: 'p2', name: 'Backend' },
            ];
            
            const mockClient = await mockClientManager.getClient();
            vi.mocked(mockClient.projects).mockResolvedValue({ nodes: mockProjects } as any);

            // When getProjects is called
            const result = await issueService.getProjects();

            // Then it should return 2 project objects with id and name
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'p1', name: 'Frontend' });
            expect(result[1]).toEqual({ id: 'p2', name: 'Backend' });
        });
    });
});
