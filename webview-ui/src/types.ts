// Mirror of the DTOs from the extension
export interface IssueDetailsDTO {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  priorityLabel: string;
  url: string;
  branchName: string;
  state?: {
    id: string;
    name: string;
    type: string;
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
