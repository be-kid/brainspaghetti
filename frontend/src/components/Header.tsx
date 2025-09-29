import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home after logout
  };

  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/">
          <img src="/bs.png" alt="BrainSpaghetti 로고" style={{ height: '40px' }} />
        </Link>
        <div></div> {/* Empty div to push auth links to the right */}
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <li>
                <Link to="/profile" title="프로필">
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#eee', borderRadius: '50%' }} />
                </Link>
              </li>
              <li><button onClick={handleLogout}>로그아웃</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">로그인</Link></li>
              <li><Link to="/signup">회원가입</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
