import { Issue, Comment } from '@linear/sdk';
import { LinearClientManager } from './linearClientManager';
import { IssueDTO, IssueDetailsDTO, CommentDTO } from './types';

export interface IssueFilter {
    cycleId?: string;
    projectId?: string;
    teamId?: string;  // Note: Linear "team" = what users often call "workspace"
}

export class IssueService {
    // Simple in-memory cache
    private _issueCache = new Map<string, { data: IssueDTO[]; timestamp: number }>();
    private readonly CACHE_TTL_MS = 60_000; // 1 minute
    
    constructor(private readonly clientManager: LinearClientManager) {}
    
    /**
     * Fetch all issues assigned to the current user
     * Uses viewer.assignedIssues() from Linear SDK
     */
    async getMyAssignedIssues(filter?: IssueFilter): Promise<IssueDTO[]> {
        const cacheKey = JSON.stringify(filter || {});
        const cached = this._issueCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.data;
        }
        
        const client = await this.clientManager.getClient();
        const me = await client.viewer;
        
        let issuesConnection = await me.assignedIssues({
            first: 50,
            filter: {
                cycle: filter?.cycleId ? { id: { eq: filter.cycleId } } : undefined,
                project: filter?.projectId ? { id: { eq: filter.projectId } } : undefined,
                team: filter?.teamId ? { id: { eq: filter.teamId } } : undefined,
            }
        });
        
        const issues: Issue[] = [...issuesConnection.nodes];
        
        // Handle pagination - fetch all pages
        while (issuesConnection.pageInfo.hasNextPage) {
            issuesConnection = await issuesConnection.fetchNext();
            // Only add new nodes (fetchNext appends to existing nodes)
            const newNodes = issuesConnection.nodes.slice(issues.length);
            issues.push(...newNodes);
        }
        
        // Convert to DTOs
        const issueDTOs = await Promise.all(issues.map(i => this.toIssueDTO(i)));
        
        this._issueCache.set(cacheKey, { data: issueDTOs, timestamp: Date.now() });
        return issueDTOs;
    }
    
    /**
     * Fetch issue with full details including comments
     */
    async getIssueWithComments(issueId: string): Promise<IssueDetailsDTO> {
        const client = await this.clientManager.getClient();
        const issue = await client.issue(issueId);
        
        let commentsConnection = await issue.comments({ first: 50 });
        const comments: Comment[] = [...commentsConnection.nodes];
        
        // Handle pagination correctly
        while (commentsConnection.pageInfo.hasNextPage) {
            commentsConnection = await commentsConnection.fetchNext();
            const newComments = commentsConnection.nodes.slice(comments.length);
            comments.push(...newComments);
        }
        
        return this.toIssueDetailsDTO(issue, comments);
    }
    
    /**
     * Get cycles for filtering dropdown
     */
    async getActiveCycles(): Promise<Array<{ id: string; name: string; startsAt?: Date; endsAt?: Date }>> {
        const client = await this.clientManager.getClient();
        const cyclesConnection = await client.cycles({
            filter: { isActive: { eq: true } }
        });
        return cyclesConnection.nodes.map(c => ({
            id: c.id,
            name: c.name || `Cycle ${c.number}`,
            startsAt: c.startsAt,
            endsAt: c.endsAt,
        }));
    }
    
    /**
     * Get projects for filtering dropdown
     */
    async getProjects(): Promise<Array<{ id: string; name: string }>> {
        const client = await this.clientManager.getClient();
        const projectsConnection = await client.projects({ first: 100 });
        return projectsConnection.nodes.map(p => ({ id: p.id, name: p.name }));
    }
    
    /**
     * Get the branch name for an issue (provided by Linear)
     */
    async getBranchName(issueId: string): Promise<string> {
        const client = await this.clientManager.getClient();
        const issue = await client.issue(issueId);
        return issue.branchName;
    }
    
    /**
     * Clear cache (call on refresh)
     */
    clearCache(): void {
        this._issueCache.clear();
    }

    /**
     * Get workflow states for an issue's team
     */
    async getWorkflowStates(issueId: string): Promise<Array<{ id: string; name: string; type: string; color: string }>> {
        const client = await this.clientManager.getClient();
        const issue = await client.issue(issueId);
        const team = await issue.team;

        if (!team) {
            return [];
        }

        const statesConnection = await team.states();
        return statesConnection.nodes.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            color: s.color,
        }));
    }

    /**
     * Update the status of an issue
     */
    async updateIssueStatus(issueId: string, stateId: string): Promise<IssueDTO> {
        const client = await this.clientManager.getClient();

        // Update the issue status
        const payload = await client.updateIssue(issueId, { stateId });

        if (!payload.success) {
            throw new Error('Failed to update issue status');
        }

        // Fetch the updated issue
        const issue = await payload.issue;
        if (!issue) {
            throw new Error('Issue not found after update');
        }

        // Clear cache since data changed
        this.clearCache();

        return this.toIssueDTO(issue);
    }
    
    // ─── DTO Converters ────────────────────────────────────────────
    
    private async toIssueDTO(issue: Issue): Promise<IssueDTO> {
        const [state, cycle, project, assignee, labels] = await Promise.all([
            issue.state,
            issue.cycle,
            issue.project,
            issue.assignee,
            issue.labels(),
        ]);
        
        return {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            priorityLabel: issue.priorityLabel,
            url: issue.url,
            branchName: issue.branchName,
            state: state ? { 
                id: state.id, 
                name: state.name, 
                type: state.type,
                color: state.color,
            } : undefined,
            cycle: cycle ? { 
                id: cycle.id, 
                name: cycle.name || `Cycle ${cycle.number}`,
                startsAt: cycle.startsAt?.toISOString(),
                endsAt: cycle.endsAt?.toISOString(),
            } : undefined,
            project: project ? { id: project.id, name: project.name } : undefined,
            assignee: assignee ? { 
                id: assignee.id, 
                name: assignee.name,
                email: assignee.email,
                avatarUrl: assignee.avatarUrl,
            } : undefined,
            labels: labels.nodes.map(l => ({ 
                id: l.id, 
                name: l.name, 
                color: l.color,
            })),
            createdAt: issue.createdAt.toISOString(),
            updatedAt: issue.updatedAt.toISOString(),
        };
    }
    
    private async toIssueDetailsDTO(issue: Issue, comments: Comment[]): Promise<IssueDetailsDTO> {
        const issueDTO = await this.toIssueDTO(issue);
        
        const commentDTOs: CommentDTO[] = await Promise.all(
            comments.map(async (c) => {
                const user = await c.user;
                return {
                    id: c.id,
                    body: c.body,
                    createdAt: c.createdAt.toISOString(),
                    user: user ? {
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                    } : undefined,
                };
            })
        );
        
        return {
            ...issueDTO,
            comments: commentDTOs,
        };
    }
}
