import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, Pencil, SquarePen, Trash2 } from 'lucide-react';
import * as blog from '../services/blogService.js';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import PostImage from '../components/PostImage.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { formatDate, getErrorMessage } from '../utils/format.js';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

export default function MyBlogsPage() {
  useDocumentTitle('My Blogs');
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    blog.getMyPosts()
      .then(({ data }) => setPosts(data.posts))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blog.deletePost(target.id);
      setPosts((list) => list.filter((p) => p.id !== target.id));
      toast.success('Post deleted.');
      setTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const shown = tab === 'all' ? posts : posts.filter((p) => p.status === tab);
  const count = (key) => (key === 'all' ? posts.length : posts.filter((p) => p.status === key).length);

  return (
    <div className="container narrow-lg section-tight">
      <header className="page-head page-head-row">
        <div>
          <h1>My Blogs</h1>
          <p className="lead">Everything you have written, published or not.</p>
        </div>
        <Link to="/create" className="btn btn-primary"><SquarePen size={16} /> New post</Link>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            className={tab === t.key ? 'tab active' : 'tab'} onClick={() => setTab(t.key)}>
            {t.label} <span className="tab-count">{count(t.key)}</span>
          </button>
        ))}
      </div>

      {loading ? <Loader label="Loading your posts…" /> : error ? (
        <div className="alert alert-error">{error}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={FileText} title={tab === 'draft' ? 'No drafts' : tab === 'published' ? 'Nothing published yet' : 'You have not written anything yet'}
          text="Your posts will appear here.">
          <Link to="/create" className="btn btn-primary">Write a post</Link>
        </EmptyState>
      ) : (
        <ul className="my-list">
          {shown.map((p) => (
            <li key={p.id} className="my-item">
              <div className="my-thumb"><PostImage src={p.featured_image} /></div>
              <div className="my-info">
                <div className="row my-tags">
                  <span className={p.status === 'draft' ? 'badge badge-draft' : 'badge badge-published'}>
                    {p.status === 'draft' ? 'Draft' : 'Published'}
                  </span>
                  {p.category_name && <span className="muted-sm">{p.category_name}</span>}
                </div>
                <h3><Link to={`/blogs/${p.id}`}>{p.title}</Link></h3>
                <p className="muted-sm">Updated {formatDate(p.updated_at)} · {p.comment_count} comments</p>
              </div>
              <div className="my-actions">
                <Link to={`/blogs/${p.id}`} className="btn btn-ghost btn-sm"><Eye size={15} /> View</Link>
                <Link to={`/edit/${p.id}`} className="btn btn-ghost btn-sm"><Pencil size={15} /> Edit</Link>
                <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => setTarget(p)}><Trash2 size={15} /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={!!target} title="Delete this post?"
        message={target ? `“${target.title}” and all of its comments will be permanently removed.` : ''}
        busy={deleting} onConfirm={handleDelete} onCancel={() => setTarget(null)} />
    </div>
  );
}
