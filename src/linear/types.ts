// Issue DTO for tree view and basic display
export interface IssueDTO {
    id: string;
    identifier: string;      // e.g., "ENG-123"
    title: string;
    description?: string;
    priority: number;
    priorityLabel: string;
    url: string;
    branchName: string;
    state?: {
        id: string;
        name: string;
        type: string;        // 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
        color: string;
    };
    cycle?: {
        id: string;
        name: string;
        startsAt?: string;
        endsAt?: string;
    };
    project?: {
        id: string;
        name: string;
    };
    assignee?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    labels: Array<{
        id: string;
        name: string;
        color: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

// Extended DTO with comments for detail view
export interface IssueDetailsDTO extends IssueDTO {
    comments: CommentDTO[];
}

export interface CommentDTO {
    id: string;
    body: string;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}
