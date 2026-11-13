import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import PostCard from '../components/PostCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { formatDate, formatDateTime, getErrorMessage, getInitials } from '../utils/format.js';

export default function ProfilePage() {
  useDocumentTitle('My profile');
  const { logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', profile_image: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    blog.getProfile().then(({ data: d }) => setData(d)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const startEdit = () => {
    setForm({ name: data.user.name, bio: data.user.bio || '', profile_image: data.user.profile_image || '' });
    setEditing(true);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Name must be at least 2 characters.');
    setSaving(true);
    try {
      const { data: res } = await blog.updateProfile({ name: form.name.trim(), bio: form.bio.trim(), profile_image: form.profile_image.trim() });
      setData((d) => ({ ...d, user: res.user }));
      updateUser({ name: res.user.name });
      setEditing(false);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    navigate('/');
  };

  if (error) return <div className="container narrow section"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <Loader fullPage label="Loading your profile…" />;
  const { user, posts, comments } = data;

  return (
    <div className="container section-tight">
      <section className="profile-card">
        <div className="profile-avatar">
          {user.profile_image
            ? <img src={user.profile_image} alt={user.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            : getInitials(user.name)}
        </div>
        {editing ? (
          <form className="profile-form" onSubmit={handleSave} noValidate>
            <FormField label="Name" id="p-name" name="name" value={form.name} onChange={onChange} />
            <FormField label="Profile image link (optional)" id="p-image" name="profile_image" value={form.profile_image}
              onChange={onChange} placeholder="https://…" />
            <div className="field">
              <label htmlFor="p-bio">Bio</label>
              <textarea id="p-bio" name="bio" className="input" rows={3} maxLength={500} value={form.bio} onChange={onChange}
                placeholder="Tell readers a little about yourself" />
            </div>
            <div className="row">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p className="muted">{user.email}</p>
            <p>{user.bio || 'No bio yet. Add one so readers know who you are.'}</p>
            <p className="muted-sm">Member since {formatDate(user.created_at)} · {posts.length} published {posts.length === 1 ? 'article' : 'articles'}</p>
            <div className="row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={startEdit}><Pencil size={15} /> Edit profile</button>
              <Link to="/my-blogs" className="btn btn-ghost btn-sm">My Blogs</Link>
              <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={handleLogout}><LogOut size={15} /> Log out</button>
            </div>
          </div>
        )}
      </section>

      <section className="block">
        <div className="block-head"><h2>Published articles</h2></div>
        {posts.length === 0 ? (
          <EmptyState title="No published articles yet" text="Publish a post and it will show up here.">
            <Link to="/create" className="btn btn-primary">Write a post</Link>
          </EmptyState>
        ) : (
          <div className="post-grid">{posts.map((p) => <PostCard key={p.id} post={{ ...p, author_name: user.name }} />)}</div>
        )}
      </section>

      <section className="block">
        <div className="block-head"><h2>My recent comments</h2></div>
        {comments.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No comments yet" text="Comments you write on posts will be listed here." />
        ) : (
          <ul className="my-comments">
            {comments.map((c) => (
              <li key={c.id}>
                <p>{c.comment_text}</p>
                <span className="muted-sm">On <Link to={`/blogs/${c.post_id}`}>{c.post_title}</Link> · {formatDateTime(c.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
