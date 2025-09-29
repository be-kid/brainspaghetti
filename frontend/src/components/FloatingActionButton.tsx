import { Link } from 'react-router-dom';
import { FaPencilAlt } from 'react-icons/fa'; // Import the pencil icon

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
  fontSize: '1.5rem', // Adjusted font size for the icon
  textDecoration: 'none',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  zIndex: 1000, // Ensure it stays on top
};

export default function FloatingActionButton() {
  return (
    <Link to="/posts/new" style={fabStyle} title="새 글 작성">
      <FaPencilAlt />
    </Link>
  );
}
