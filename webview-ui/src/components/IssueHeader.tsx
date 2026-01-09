import type { IssueDetailsDTO } from '../types';
import './IssueHeader.css';

interface IssueHeaderProps {
  issue: IssueDetailsDTO;
  onStartWork: () => void;
  onOpenInBrowser: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function IssueHeader({ 
  issue, 
  onStartWork, 
  onOpenInBrowser, 
  onRefresh,
  isLoading 
}: IssueHeaderProps) {
  return (
    <header className="issue-header">
      <div className="issue-header__meta">
        <StatusBadge state={issue.state} />
        {issue.project && (
          <span className="meta-item">
            <span className="meta-icon">📁</span>
            {issue.project.name}
          </span>
        )}
        {issue.cycle && (
          <span className="meta-item">
            <span className="meta-icon">🔄</span>
            {issue.cycle.name}
          </span>
        )}
      </div>
      
      <h1 className="issue-header__title" data-testid="issue-title">
        {issue.title}
      </h1>
      
      <p className="issue-header__identifier" data-testid="issue-identifier">
        {issue.identifier}
      </p>
      
      <div className="issue-header__actions">
        <button onClick={onStartWork}>
          ▶ Start Working
        </button>
        <button className="secondary" onClick={onOpenInBrowser}>
          🌐 Open in Linear
        </button>
        <button 
          className="secondary" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          ↻ Refresh
        </button>
      </div>
    </header>
  );
}

function StatusBadge({ state }: { state?: IssueDetailsDTO['state'] }) {
  if (!state) return null;
  
  const getStatusIcon = (type: string) => {
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
    <span 
      className="status-badge" 
      data-testid="status-badge"
      style={{ '--status-color': state.color } as React.CSSProperties}
    >
      <span className="status-badge__icon">{getStatusIcon(state.type)}</span>
      {state.name}
    </span>
  );
}
