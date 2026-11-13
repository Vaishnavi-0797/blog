import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import PostImage from './PostImage.jsx';
import { formatDate, getInitials } from '../utils/format.js';

export default function PostCard({ post }) {
  const url = `/blogs/${post.id}`;
  return (
    <article className="post-card">
      <Link to={url} className="post-card-media" tabIndex={-1} aria-hidden="true">
        <PostImage src={post.featured_image} />
      </Link>
      <div className="post-card-body">
        {post.category_name && <span className="chip">{post.category_name}</span>}
        <h3><Link to={url}>{post.title}</Link></h3>
        <p className="excerpt">{post.excerpt}</p>
        <div className="post-meta">
          <span className="mini-avatar">{getInitials(post.author_name)}</span>
          <span className="meta-text">
            <strong>{post.author_name}</strong>
            <span>{formatDate(post.created_at)}</span>
          </span>
          {post.comment_count !== undefined && (
            <span className="meta-count" title="Comments"><MessageCircle size={15} /> {post.comment_count}</span>
          )}
        </div>
        <Link to={url} className="read-more">Read more</Link>
      </div>
    </article>
  );
}
