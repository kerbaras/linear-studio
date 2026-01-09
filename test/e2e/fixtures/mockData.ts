import type { IssueDetailsDTO } from '../../../webview-ui/src/types';

/**
 * Mock issue data for E2E testing the webview UI.
 */
export const mockIssueDetails: IssueDetailsDTO = {
    id: 'issue-1',
    identifier: 'ENG-142',
    title: 'Add user avatar component',
    description: `# Overview

Implement user avatar component for the application.

## Requirements

- Support different sizes (small, medium, large)
- Show initials when no image is available
- Display online/offline status indicator

## Technical Notes

Use the \`Avatar\` component from our design system.

\`\`\`tsx
import { Avatar } from '@/components/Avatar';

<Avatar 
  src={user.avatarUrl} 
  name={user.name}
  size="medium"
/>
\`\`\`
`,
    priority: 2,
    priorityLabel: 'High',
    url: 'https://linear.app/test/issue/ENG-142',
    branchName: 'user/eng-142-add-user-avatar',
    state: {
        id: 's1',
        name: 'In Progress',
        type: 'started',
        color: '#f2c94c',
    },
    cycle: {
        id: 'c1',
        name: 'Sprint 1',
        startsAt: '2024-01-01',
        endsAt: '2024-01-14',
    },
    project: {
        id: 'p1',
        name: 'Frontend',
    },
    assignee: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@test.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
    labels: [
        { id: 'l1', name: 'frontend', color: '#5e6ad2' },
        { id: 'l2', name: 'ui', color: '#26b5ce' },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-05T15:30:00Z',
    comments: [
        {
            id: 'comment-1',
            body: 'Started working on this. Will have a PR ready by EOD.',
            createdAt: '2024-01-02T09:00:00Z',
            user: {
                name: 'John Doe',
                avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
            },
        },
        {
            id: 'comment-2',
            body: 'Great! Let me know if you need any design clarifications.',
            createdAt: '2024-01-02T10:30:00Z',
            user: {
                name: 'Sarah Designer',
                avatarUrl: null,
            },
        },
        {
            id: 'comment-3',
            body: `Here's the updated design for the avatar component:

![Avatar Design](https://example.com/avatar-design.png)

Changes from v1:
- Added border radius options
- Updated color palette
- Added hover states`,
            createdAt: '2024-01-03T14:00:00Z',
            user: {
                name: 'Sarah Designer',
                avatarUrl: null,
            },
        },
    ],
};

export const mockEmptyIssue: IssueDetailsDTO = {
    id: 'issue-2',
    identifier: 'ENG-143',
    title: 'Minimal Issue',
    description: '',
    priority: 4,
    priorityLabel: 'Low',
    url: 'https://linear.app/test/issue/ENG-143',
    branchName: 'user/eng-143-minimal-issue',
    state: {
        id: 's2',
        name: 'Backlog',
        type: 'backlog',
        color: '#999',
    },
    cycle: undefined,
    project: undefined,
    assignee: undefined,
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    comments: [],
};
