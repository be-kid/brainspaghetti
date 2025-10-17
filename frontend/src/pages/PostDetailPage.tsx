import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

// Define the types for our data
interface Author {
  id: number;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: Author;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get<Post>(`/post/${id}`);
        setPost(response.data);
      } catch (err) {
        setError("Failed to fetch post.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const location = useLocation();

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/post/${id}`);
      showToast({
        variant: "success",
        message: "게시글이 삭제되었습니다.",
      });
      // Navigate to the previous page, or default to /posts
      const from = location.state?.from || "/posts";
      navigate(from);
    } catch (err) {
      console.error(err);
      showToast({
        variant: "danger",
        message: "게시글 삭제에 실패했습니다.",
      });
    }
  };

  if (loading) return <p>Loading post...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!post) return <p>Post not found.</p>;

  const isAuthor = user?.id === post.author.id;

  return (
    <article>
      <h1>{post.title}</h1>
      <div
        style={{
          color: "#b0b0b0", // Changed from #555 for better visibility
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span>by {post.author.email}</span>
          <span style={{ marginLeft: "1rem" }}>
            {new Date(post.createdAt).toLocaleDateString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}
          </span>
        </div>
        {isAuthor && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link to={`/posts/${id}/edit`}>
              <button>수정</button>
            </Link>
            <button
              onClick={handleDeleteClick}
              style={{ backgroundColor: "#dc3545", color: "white" }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: "1.6",
          color: "#e8e8e8", // Explicitly set light color
        }}
      >
        {post.content}
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </article>
  );
}
