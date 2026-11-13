import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileQuestion, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import CommentSection from '../components/CommentSection.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import PostImage from '../components/PostImage.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { formatDate, getErrorMessage, getInitials } from '../utils/format.js';

// Turns plain text into paragraphs. "## Heading" becomes a heading.
// React escapes the text, so nothing the author types can run as code.
function ArticleBody({ content }) {
  return content.split(/\n{2,}/).map((block, i) => {
    const text = block.trim();
    if (!text) return null;
    if (text.startsWith('## ')) return <h2 key={i}>{text.slice(3)}</h2>;
    return <p key={i}>{text}</p>;
  });
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useDocumentTitle(post?.title || 'Post');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    blog.getPost(id)
      .then(({ data }) => active && setPost(data.post))
      .catch((err) => active && setError(err.response?.status === 404 ? 'notfound' : getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blog.deletePost(id);
      toast.success('Post deleted.');
      navigate('/my-blogs', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading article…" />;
  if (error === 'notfound' || !post) {
    return (
      <div className="container narrow section">
        <EmptyState icon={FileQuestion} title={error && error !== 'notfound' ? 'Could not load this post' : 'Post not found'}
          text={error && error !== 'notfound' ? error : 'It may have been deleted, or it is still a draft.'}>
          <Link to="/blogs" className="btn btn-primary">Browse all posts</Link>
        </EmptyState>
      </div>
    );
  }

  const isOwner = user && user.id === post.user_id;

  return (
    <article className="article">
      <div className="container article-wrap">
        <header className="article-head">
          <div className="row article-tags">
            {post.category_name && <Link to={`/blogs?category=${post.category_id}`} className="chip">{post.category_name}</Link>}
            {post.status === 'draft' && <span className="badge badge-draft">Draft</span>}
          </div>
          <h1>{post.title}</h1>
          <div className="author-row">
            <span className="mini-avatar large">{getInitials(post.author_name)}</span>
            <div>
              <strong>{post.author_name}</strong>
              <div className="muted-sm">
                Published {formatDate(post.created_at)}
                {formatDate(post.updated_at) !== formatDate(post.created_at) && <> · Updated {formatDate(post.updated_at)}</>}
              </div>
            </div>
            {isOwner && (
              <div className="row owner-actions">
                <Link to={`/edit/${post.id}`} className="btn btn-ghost btn-sm"><Pencil size={15} /> Edit</Link>
                <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setConfirmOpen(true)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </div>
        </header>

        {post.featured_image && <div className="article-cover"><PostImage src={post.featured_image} alt={post.title} /></div>}

        <div className="article-body"><ArticleBody content={post.content} /></div>

        {post.author_bio && (
          <aside className="author-box">
            <span className="mini-avatar large">{getInitials(post.author_name)}</span>
            <div><strong>About {post.author_name}</strong><p>{post.author_bio}</p></div>
          </aside>
        )}

        {post.status === 'published' ? <CommentSection postId={post.id} /> : (
          <div className="alert alert-info">Comments open once this post is published.</div>
        )}
      </div>

      <ConfirmDialog open={confirmOpen} title="Delete this post?"
        message="The post and all of its comments will be permanently removed."
        busy={deleting} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </article>
  );
}
