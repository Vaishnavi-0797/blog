import { Link } from 'react-router-dom';
import { MessageSquare, PenLine, Search, ShieldCheck, Tags, UserRound } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const FEATURES = [
  { icon: UserRound, title: 'Accounts', text: 'Register, log in and keep your own profile. Passwords are stored hashed, never in plain text.' },
  { icon: PenLine, title: 'Write and publish', text: 'Create posts with a title, category and cover image. Save a draft first, publish when ready.' },
  { icon: MessageSquare, title: 'Comments', text: 'Join the conversation under any post. You can edit or delete your own comments at any time.' },
  { icon: Search, title: 'Search and sort', text: 'Find posts by title or keyword, and sort by newest, oldest or most discussed.' },
  { icon: Tags, title: 'Categories', text: 'Browse by topic, or add a new category when your subject is not listed.' },
  { icon: ShieldCheck, title: 'Your content, your control', text: 'Only you can edit or delete your posts and comments. The server checks this on every request.' },
];

export default function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="container narrow-lg section-tight">
      <header className="page-head">
        <h1>About Inkwell</h1>
        <p className="lead">Inkwell is a simple blogging platform where anyone can publish an article and anyone can reply to it.</p>
      </header>

      <section className="prose">
        <h2>Why it exists</h2>
        <p>Good writing starts conversations. Inkwell keeps the focus on reading and replying: clean pages, no clutter, and comments right beneath each article so ideas can be questioned, improved and shared.</p>
        <p>It was built as a full-stack learning project, using React on the front end, Node.js and Express for the REST API, and MySQL for the database.</p>
      </section>

      <section className="block">
        <h2>What you can do</h2>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature">
              <span className="feature-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="row about-cta">
        <Link to="/blogs" className="btn btn-ghost">Explore Blogs</Link>
        <Link to="/register" className="btn btn-primary">Create an account</Link>
      </div>
    </div>
  );
}
