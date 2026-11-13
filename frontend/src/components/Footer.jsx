import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <span className="brand-mark"><PenLine size={18} /></span>
            <span className="brand-name">Inkwell</span>
          </Link>
          <p>A place to write, read and talk about ideas that matter to you.</p>
        </div>
        <div className="footer-col">
          <h4>Read</h4>
          <Link to="/blogs">Explore Blogs</Link>
          <Link to="/categories">Categories</Link>
        </div>
        <div className="footer-col">
          <h4>Write</h4>
          <Link to="/create">New post</Link>
          <Link to="/my-blogs">My Blogs</Link>
        </div>
        <div className="footer-col">
          <h4>Inkwell</h4>
          <Link to="/about">About</Link>
          <Link to="/login">Log in</Link>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} Inkwell. Built as an internship project.</div>
    </footer>
  );
}
