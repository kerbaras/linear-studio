import type { IssueDetailsDTO } from '../types';
import './Sidebar.css';

interface SidebarProps {
  issue: IssueDetailsDTO;
}

export function Sidebar({ issue }: SidebarProps) {
  const createdDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const updatedDate = formatRelativeTime(issue.updatedAt);

  return (
    <div className="sidebar-content">
      <SidebarItem label="Status">
        <StatusDisplay state={issue.state} />
      </SidebarItem>
      
      <SidebarItem label="Priority">
        <PriorityDisplay priority={issue.priority} label={issue.priorityLabel} />
      </SidebarItem>
      
      {issue.assignee && (
        <SidebarItem label="Assignee">
          <div className="assignee">
            {issue.assignee.avatarUrl ? (
              <img 
                src={issue.assignee.avatarUrl} 
                alt={issue.assignee.name}
                className="assignee__avatar"
              />
            ) : (
              <div className="assignee__avatar-placeholder">
                {issue.assignee.name.charAt(0)}
              </div>
            )}
            <span>{issue.assignee.name}</span>
          </div>
        </SidebarItem>
      )}
      
      {issue.labels.length > 0 && (
        <SidebarItem label="Labels">
          <div className="labels">
            {issue.labels.map((label) => (
              <span 
                key={label.id} 
                className="label"
                style={{ '--label-color': label.color } as React.CSSProperties}
              >
                {label.name}
              </span>
            ))}
          </div>
        </SidebarItem>
      )}
      
      {issue.project && (
        <SidebarItem label="Project">
          <span>📁 {issue.project.name}</span>
        </SidebarItem>
      )}
      
      {issue.cycle && (
        <SidebarItem label="Cycle">
          <span>🔄 {issue.cycle.name}</span>
        </SidebarItem>
      )}
      
      <SidebarItem label="Created">
        <span>{createdDate}</span>
      </SidebarItem>
      
      <SidebarItem label="Updated">
        <span>{updatedDate}</span>
      </SidebarItem>
    </div>
  );
}

function SidebarItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sidebar-item">
      <div className="sidebar-item__label">{label}</div>
      <div className="sidebar-item__value">{children}</div>
    </div>
  );
}

function StatusDisplay({ state }: { state?: IssueDetailsDTO['state'] }) {
  if (!state) return <span>Unknown</span>;
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'completed': return '✓';
      case 'started': return '◐';
      case 'unstarted': return '○';
      case 'backlog': return '○';
      case 'canceled': return '✕';
      default: return '○';
    }
  };

  return (
    <span className="status-display" style={{ color: state.color }}>
      {getIcon(state.type)} {state.name}
    </span>
  );
}

function PriorityDisplay({ priority, label }: { priority: number; label: string }) {
  const getIcon = (p: number) => {
    switch (p) {
      case 1: return '🔴';
      case 2: return '🟠';
      case 3: return '🟡';
      case 4: return '🔵';
      default: return '⚪';
    }
  };

  return (
    <span className="priority-display">
      {getIcon(priority)} {label}
    </span>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
