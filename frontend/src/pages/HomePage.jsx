import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import * as blog from '../services/blogService.js';
import PostCard from '../components/PostCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../utils/format.js';

export default function HomePage() {
  useDocumentTitle('');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      blog.getPosts({ sort: 'popular', limit: 3 }),
      blog.getPosts({ sort: 'newest', limit: 6 }),
      blog.getCategories(),
    ])
      .then(([pop, newest, cats]) => {
        if (!active) return;
        setFeatured(pop.data.posts);
        setLatest(newest.data.posts);
        setCategories([...cats.data.categories].sort((a, b) => b.post_count - a.post_count).slice(0, 6));
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/blogs?search=${encodeURIComponent(query.trim())}` : '/blogs');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <h1>Read thoughtful posts. Write your own.</h1>
          <p className="lead">
            Inkwell is a free place to publish articles, explore ideas by topic and talk with other readers in the comments.
          </p>
          <form className="hero-search" onSubmit={onSearch} role="search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or keyword" aria-label="Search posts" />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <div className="row hero-cta">
            <Link to="/blogs" className="btn btn-ghost">Explore Blogs</Link>
            {!isLoggedIn && <Link to="/register" className="btn btn-primary">Start writing</Link>}
            {isLoggedIn && <Link to="/create" className="btn btn-primary">Write a post</Link>}
          </div>
        </div>
      </section>

      <div className="container">
        {loading ? <Loader label="Loading posts…" /> : error ? (
          <div className="alert alert-error">{error}</div>
        ) : latest.length === 0 ? (
          <EmptyState icon={BookOpen} title="No posts yet" text="Be the first to publish something on Inkwell.">
            <Link to={isLoggedIn ? '/create' : '/register'} className="btn btn-primary">
              {isLoggedIn ? 'Write a post' : 'Create an account'}
            </Link>
          </EmptyState>
        ) : (
          <>
            <section className="block">
              <div className="block-head"><h2>Featured articles</h2><Link to="/blogs?sort=popular">Most discussed</Link></div>
              <div className="post-grid">{featured.map((p) => <PostCard key={p.id} post={p} />)}</div>
            </section>

            <section className="block">
              <div className="block-head"><h2>Latest posts</h2><Link to="/blogs">See all posts</Link></div>
              <div className="post-grid">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
            </section>

            {categories.length > 0 && (
              <section className="block">
                <div className="block-head"><h2>Popular categories</h2><Link to="/categories">All categories</Link></div>
                <div className="chip-row">
                  {categories.map((c) => (
                    <Link key={c.id} to={`/blogs?category=${c.id}`} className="chip chip-lg">
                      {c.category_name} <span className="chip-count">{c.post_count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
