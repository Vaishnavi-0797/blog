import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import * as blog from '../services/blogService.js';
import PostCard from '../components/PostCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { getErrorMessage } from '../utils/format.js';

const PAGE_SIZE = 9;

export default function BlogListPage() {
  useDocumentTitle('Explore Blogs');
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const [query, setQuery] = useState(search);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { setQuery(search); }, [search]);
  useEffect(() => {
    blog.getCategories().then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  // Fetch again whenever the filters in the address bar change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    blog.getPosts({ search, category, sort, page, limit: PAGE_SIZE })
      .then(({ data }) => {
        if (!active) return;
        setPosts(data.posts);
        setPagination(data.pagination);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, category, sort, page]);

  // Changes one or more filters; goes back to page 1 unless the page itself changed.
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    update({ search: query.trim() });
  };

  const hasFilters = search || category;
  const activeCategory = categories.find((c) => String(c.id) === category);

  return (
    <div className="container section-tight">
      <header className="page-head">
        <h1>Explore Blogs</h1>
        <p className="lead">Search by title or keyword, filter by topic, and sort the way you like.</p>
      </header>

      <div className="filters">
        <form className="search-box" onSubmit={onSearch} role="search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" aria-label="Search posts" />
          {query && (
            <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => { setQuery(''); update({ search: '' }); }}>
              <X size={16} />
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div className="sort-box">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" className="input" value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="popular">Most discussed</option>
          </select>
        </div>
      </div>

      <div className="chip-row filter-chips" role="group" aria-label="Filter by category">
        <button type="button" className={!category ? 'chip chip-btn active' : 'chip chip-btn'} onClick={() => update({ category: '' })}>All</button>
        {categories.map((c) => (
          <button key={c.id} type="button" className={String(c.id) === category ? 'chip chip-btn active' : 'chip chip-btn'}
            onClick={() => update({ category: String(c.id) })}>{c.category_name}</button>
        ))}
      </div>

      {!loading && !error && (
        <p className="result-info">
          {pagination.total} {pagination.total === 1 ? 'post' : 'posts'}
          {search && <> matching “{search}”</>}
          {activeCategory && <> in {activeCategory.category_name}</>}
          {hasFilters && <button type="button" className="link-btn" onClick={() => setParams({})}>Clear filters</button>}
        </p>
      )}

      {loading ? <Loader label="Loading posts…" /> : error ? (
        <div className="alert alert-error">{error}</div>
      ) : posts.length === 0 ? (
        <EmptyState icon={SearchX} title="No posts found" text={hasFilters ? 'Try a different keyword or category.' : 'No posts have been published yet.'}>
          {hasFilters && <button type="button" className="btn btn-ghost" onClick={() => setParams({})}>Clear filters</button>}
        </EmptyState>
      ) : (
        <>
          <div className="post-grid">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
          {pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
              <span>Page {page} of {pagination.totalPages}</span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pagination.totalPages} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
