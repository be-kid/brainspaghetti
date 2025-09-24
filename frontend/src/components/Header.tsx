import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
          BrainSpaghetti
        </Link>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0 }}>
          <li><Link to="/posts">All Posts</Link></li>
          <li><Link to="/map">Mind Map</Link></li>
          <li><Link to="/posts/new">New Post</Link></li>
        </ul>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0 }}>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
      </nav>
    </header>
  );
}
