import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FormField from '../components/FormField.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage, isValidEmail } from '../utils/format.js';

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const { register, isLoggedIn, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isLoggedIn) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // These rules match the backend, so people see problems before sending.
  const validate = () => {
    const e = {};
    const name = form.name.trim();
    if (name.length < 2) e.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) e.email = 'Enter your email address.';
    else if (!isValidEmail(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Use at least 8 characters, including a letter and a number.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const user = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(`Account created. Welcome, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <h2>Write something worth reading.</h2>
        <p>Create a free account to publish posts, save drafts and join the discussion in the comments.</p>
      </aside>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit} noValidate>
          <h1>Create your account</h1>
          <p className="auth-sub">It takes less than a minute.</p>

          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          <FormField label="Full name" id="name" name="name" autoComplete="name"
            value={form.name} onChange={onChange} error={errors.name} placeholder="Your full name" />
          <FormField label="Email" id="email" name="email" type="email" autoComplete="email"
            value={form.email} onChange={onChange} error={errors.email} placeholder="you@example.com" />
          <FormField label="Password" id="password" name="password" type="password" autoComplete="new-password"
            value={form.password} onChange={onChange} error={errors.password}
            hint="At least 8 characters with a letter and a number." placeholder="Create a password" />
          <FormField label="Confirm password" id="confirm" name="confirm" type="password" autoComplete="new-password"
            value={form.confirm} onChange={onChange} error={errors.confirm} placeholder="Type the password again" />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <UserPlus size={18} /> {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </section>
    </div>
  );
}
