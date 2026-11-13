import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as blog from '../services/blogService.js';
import Loader from '../components/Loader.jsx';
import FormField from '../components/FormField.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../utils/format.js';

export default function CategoriesPage() {
  useDocumentTitle('Categories');
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ category_name: '', description: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    blog.getCategories()
      .then(({ data }) => setCategories(data.categories))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.category_name.trim().length < 2) return toast.error('Category name must be at least 2 characters.');
    setAdding(true);
    try {
      const { data } = await blog.createCategory(form);
      setCategories((list) => [...list, { ...data.category, post_count: 0 }].sort((a, b) => a.category_name.localeCompare(b.category_name)));
      setForm({ category_name: '', description: '' });
      toast.success('Category created.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container section-tight">
      <header className="page-head">
        <h1>Categories</h1>
        <p className="lead">Pick a topic to see every post filed under it.</p>
      </header>

      {loading ? <Loader label="Loading categories…" /> : error ? <div className="alert alert-error">{error}</div> : (
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c.id} to={`/blogs?category=${c.id}`} className="category-card">
              <h3>{c.category_name}</h3>
              <p>{c.description || 'Posts on this topic.'}</p>
              <span className="chip">{c.post_count} {c.post_count === 1 ? 'post' : 'posts'}</span>
            </Link>
          ))}
        </div>
      )}

      {isLoggedIn && (
        <form className="add-category" onSubmit={handleAdd} noValidate>
          <h2>Add a category</h2>
          <div className="add-category-fields">
            <FormField label="Name" id="cat-name" value={form.category_name} placeholder="e.g. Photography"
              onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
            <FormField label="Description (optional)" id="cat-desc" value={form.description} placeholder="One short sentence"
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={adding}><Plus size={16} /> {adding ? 'Adding…' : 'Add category'}</button>
        </form>
      )}
    </div>
  );
}
