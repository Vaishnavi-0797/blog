import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';
import { formatDateTime, getErrorMessage, getInitials } from '../utils/format.js';

export default function CommentSection({ postId }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    blog.getComments(postId)
      .then(({ data }) => active && setComments(data.comments))
      .catch((err) => active && setLoadError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [postId]);

  // The page does not reload: we update the list in memory after each change.
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error('Write something before posting.');
    setPosting(true);
    try {
      const { data } = await blog.addComment(postId, text.trim());
      setComments((list) => [data.comment, ...list]);
      setText('');
      toast.success('Comment added.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditText(c.comment_text); };

  const handleSave = async (id) => {
    if (!editText.trim()) return toast.error('Comment cannot be empty.');
    setSaving(true);
    try {
      const { data } = await blog.updateComment(id, editText.trim());
      setComments((list) => list.map((c) => (c.id === id ? data.comment : c)));
      setEditingId(null);
      toast.success('Comment updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await blog.deleteComment(deleteTarget.id);
      setComments((list) => list.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Comment deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const wasEdited = (c) => new Date(c.updated_at) - new Date(c.created_at) > 1500;

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">Comments ({comments.length})</h2>

      {isLoggedIn ? (
        <form className="comment-form" onSubmit={handleAdd}>
          <label htmlFor="new-comment" className="sr-only">Add a comment</label>
          <textarea id="new-comment" className="input" rows={3} maxLength={1000} value={text}
            onChange={(e) => setText(e.target.value)} placeholder="Share your thoughts…" />
          <div className="comment-form-foot">
            <span className="field-hint">{text.length}/1000</span>
            <button type="submit" className="btn btn-primary btn-sm" disabled={posting}>
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-info">
          <Link to="/login" state={{ from: `/blogs/${postId}` }}>Log in</Link> or <Link to="/register">create an account</Link> to join the conversation.
        </div>
      )}

      {loading ? <Loader label="Loading comments…" /> : loadError ? (
        <div className="alert alert-error">{loadError}</div>
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No comments yet" text="Be the first to share what you think." />
      ) : (
        <ul className="comment-list">
          {comments.map((c) => {
            const mine = user && user.id === c.user_id;
            return (
              <li key={c.id} className="comment">
                <span className="mini-avatar large">{getInitials(c.user_name)}</span>
                <div className="comment-main">
                  <div className="comment-head">
                    <strong>{c.user_name}</strong>
                    <time dateTime={c.created_at}>{formatDateTime(c.created_at)}</time>
                    {wasEdited(c) && <span className="muted-sm">(edited)</span>}
                  </div>

                  {editingId === c.id ? (
                    <div>
                      <textarea className="input" rows={3} maxLength={1000} value={editText}
                        onChange={(e) => setEditText(e.target.value)} aria-label="Edit your comment" />
                      <div className="row comment-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSave(c.id)} disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{c.comment_text}</p>
                  )}

                  {mine && editingId !== c.id && (
                    <div className="row comment-actions">
                      <button type="button" className="link-btn" onClick={() => startEdit(c)}><Pencil size={14} /> Edit</button>
                      <button type="button" className="link-btn danger" onClick={() => setDeleteTarget(c)}><Trash2 size={14} /> Delete</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete this comment?" message="This cannot be undone."
        busy={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </section>
  );
}
