import Markdown from 'react-markdown';
import type { CommentDTO } from '../types';
import './CommentList.css';

interface CommentListProps {
  comments: CommentDTO[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <section className="comment-list">
        <h2 className="section-title">Comments</h2>
        <p className="no-content">No comments yet.</p>
      </section>
    );
  }

  return (
    <section className="comment-list">
      <h2 className="section-title">Comments ({comments.length})</h2>
      <div className="comments">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}

function Comment({ comment }: { comment: CommentDTO }) {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <article className="comment" data-testid="comment">
      <header className="comment__header">
        <div className="comment__avatar">
          {comment.user?.avatarUrl ? (
            <img 
              src={comment.user.avatarUrl} 
              alt={comment.user.name}
              className="comment__avatar-img"
            />
          ) : (
            <div className="comment__avatar-placeholder">
              {comment.user?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="comment__meta">
          <span className="comment__author">{comment.user?.name || 'Unknown'}</span>
          <span className="comment__date">{formattedDate}</span>
        </div>
      </header>
      <div className="comment__body markdown-content">
        <Markdown>{comment.body}</Markdown>
      </div>
    </article>
  );
}
