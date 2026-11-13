import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FormField from '../components/FormField.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage, isValidEmail } from '../utils/format.js';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, isLoggedIn, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isLoggedIn) return <Navigate to={redirectTo} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Enter your email address.';
    else if (!isValidEmail(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Enter your password.';
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
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <h2>Pick up where you left off.</h2>
        <p>Your drafts, your posts and the conversations around them are waiting.</p>
      </aside>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit} noValidate>
          <h1>Log in</h1>
          <p className="auth-sub">Use the email and password you registered with.</p>

          {location.state?.from && !serverError && (
            <div className="alert alert-info">Please log in to open that page.</div>
          )}
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          <FormField label="Email" id="email" name="email" type="email" autoComplete="email"
            value={form.email} onChange={onChange} error={errors.email} placeholder="you@example.com" />
          <FormField label="Password" id="password" name="password" type="password" autoComplete="current-password"
            value={form.password} onChange={onChange} error={errors.password} placeholder="Your password" />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <LogIn size={18} /> {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
        </form>
      </section>
    </div>
  );
}
