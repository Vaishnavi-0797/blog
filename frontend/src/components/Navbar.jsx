import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, PenLine, LogOut, User, FileText, SquarePen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getInitials } from '../utils/format.js';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close menus whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  // Close the profile dropdown when clicking outside of it.
  useEffect(() => {
    const onClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    navigate('/');
  };

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Inkwell home">
          <span className="brand-mark"><PenLine size={18} /></span>
          <span className="brand-name">Inkwell</span>
        </Link>

        <button type="button" className="icon-btn nav-burger" onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={menuOpen ? 'nav-menu open' : 'nav-menu'}>
          <div className="nav-links">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/blogs" className={linkClass}>Explore Blogs</NavLink>
            <NavLink to="/categories" className={linkClass}>Categories</NavLink>
            <NavLink to="/about" className={linkClass}>About</NavLink>
          </div>

          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <Link to="/create" className="btn btn-primary btn-sm"><SquarePen size={16} /> Write</Link>
                <div className="dropdown" ref={dropRef}>
                  <button type="button" className="avatar-btn" onClick={() => setDropOpen((o) => !o)}
                    aria-haspopup="menu" aria-expanded={dropOpen} aria-label="Account menu">
                    {getInitials(user.name)}
                  </button>
                  {dropOpen && (
                    <div className="dropdown-menu" role="menu">
                      <div className="dropdown-head">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <Link to="/profile" role="menuitem"><User size={16} /> Profile</Link>
                      <Link to="/my-blogs" role="menuitem"><FileText size={16} /> My Blogs</Link>
                      <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={16} /> Log out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
