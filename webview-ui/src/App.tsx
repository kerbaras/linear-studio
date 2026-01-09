import { useState, useEffect } from 'react';
import { useVSCodeApi } from './hooks/useVSCodeApi';
import { IssueHeader } from './components/IssueHeader';
import { IssueDescription } from './components/IssueDescription';
import { CommentList } from './components/CommentList';
import { Sidebar } from './components/Sidebar';
import type { IssueDetailsDTO } from './types';
import './App.css';

interface UpdateMessage {
  type: 'update';
  payload: IssueDetailsDTO;
}

interface LoadingMessage {
  type: 'loading';
  payload: { isLoading: boolean };
}

interface ErrorMessage {
  type: 'error';
  payload: { message: string };
}

type WebviewMessage = UpdateMessage | LoadingMessage | ErrorMessage;

function App() {
  const [issue, setIssue] = useState<IssueDetailsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vscode = useVSCodeApi();

  useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent<WebviewMessage>) => {
      const message = event.data;
      
      switch (message.type) {
        case 'update':
          setIssue(message.payload);
          setError(null);
          break;
        case 'loading':
          setIsLoading(message.payload.isLoading);
          break;
        case 'error':
          setError(message.payload.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Tell extension we're ready
    vscode.ready();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
        <button onClick={vscode.refresh} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !issue) {
    return <div className="loading">Loading issue...</div>;
  }

  if (!issue) {
    return <div className="error">No issue data available</div>;
  }

  return (
    <div className="app">
      <IssueHeader 
        issue={issue}
        onStartWork={() => vscode.startWork(issue.id)}
        onOpenInBrowser={() => vscode.openInBrowser(issue.url)}
        onRefresh={vscode.refresh}
        isLoading={isLoading}
      />
      
      <div className="main-layout">
        <main className="main-content">
          <IssueDescription description={issue.description} />
          <CommentList comments={issue.comments} />
        </main>
        
        <aside className="sidebar">
          <Sidebar issue={issue} />
        </aside>
      </div>
    </div>
  );
}

export default App;
