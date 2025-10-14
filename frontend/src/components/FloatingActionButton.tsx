import { Link } from 'react-router-dom';
import { FaPencilAlt } from 'react-icons/fa'; // Import the pencil icon
import './FloatingActionButton.css'; // Import the CSS file

export default function FloatingActionButton() {
  return (
    <Link to="/posts/new" className="fab" title="새 글 작성">
      <FaPencilAlt />
    </Link>
  );
}
