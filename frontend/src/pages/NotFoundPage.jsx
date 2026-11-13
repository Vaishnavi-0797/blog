import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container narrow section center">
      <h1>This page doesn’t exist</h1>
      <p className="lead">The link may be broken, or the page may have been removed.</p>
      <Link to="/" className="btn btn-primary">Go to the homepage</Link>
    </div>
  );
}
