import Markdown from 'react-markdown';
import './IssueDescription.css';

interface IssueDescriptionProps {
  description?: string;
}

export function IssueDescription({ description }: IssueDescriptionProps) {
  if (!description) {
    return (
      <section className="issue-description" data-testid="issue-description">
        <h2 className="section-title">Description</h2>
        <p className="no-content">No description provided.</p>
      </section>
    );
  }

  return (
    <section className="issue-description" data-testid="issue-description">
      <h2 className="section-title">Description</h2>
      <div className="markdown-content">
        <Markdown>{description}</Markdown>
      </div>
    </section>
  );
}
