import { Link } from 'react-router-dom';

const fabStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '2rem',
  textDecoration: 'none',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
};

export default function FloatingActionButton() {
  return (
    <Link to="/posts/new" style={fabStyle} title="새 글 작성">
      ✏️
    </Link>
  );
}
