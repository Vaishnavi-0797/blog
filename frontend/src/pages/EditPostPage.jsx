import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import PostForm from '../components/PostForm.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../utils/format.js';

export default function EditPostPage() {
  useDocumentTitle('Edit post');
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    blog.getPost(id)
      .then(({ data }) => active && setPost(data.post))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const handleSubmit = async (values, status) => {
    setSubmitting(true);
    try {
      await blog.updatePost(id, { ...values, status });
      toast.success(status === 'draft' ? 'Draft saved.' : 'Changes saved.');
      navigate(status === 'draft' ? '/my-blogs' : `/blogs/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading post…" />;
  if (error || !post) {
    return <div className="container narrow section"><div className="alert alert-error">{error || 'Post not found.'}</div></div>;
  }
  // The server also checks this. The screen check just gives a friendlier message.
  if (post.user_id !== user.id) {
    return (
      <div className="container narrow section">
        <EmptyState icon={Lock} title="You can only edit your own posts" text="This post belongs to another author.">
          <Link to={`/blogs/${post.id}`} className="btn btn-primary">Back to the post</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container narrow section-tight">
      <header className="page-head"><h1>Edit post</h1></header>
      <PostForm mode="edit" initial={post} submitting={submitting} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
