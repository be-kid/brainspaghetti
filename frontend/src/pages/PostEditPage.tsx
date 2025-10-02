import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Form, Button, Alert } from "react-bootstrap"; // Import Form, Button, Alert
import { useToast } from "../contexts/ToastContext";
import { SpinnerInline } from "../components/Loading";
import { useAuth } from "../contexts/AuthContext";

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch
  const { showToast } = useToast();

  // 로그인 체크 - 로딩이 완료된 후에만 실행
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login");
      return;
    }
  }, [isLoggedIn, isLoading, navigate]);

  useEffect(() => {
    if (isLoading || !isLoggedIn) return; // 로그인 확인 후 실행

    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (err) {
        setError("게시글 데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPost();
  }, [id, isLoading, isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.patch(`/post/${id}`, { title, content });
      navigate(`/posts/${id}`); // Navigate back to the detail page
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(
          err.response.data.message || "게시글 수정 중 오류가 발생했습니다."
        );
        showToast({
          variant: "danger",
          message:
            err.response.data.message || "게시글 수정 중 오류가 발생했습니다.",
        });
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
        showToast({
          variant: "danger",
          message: "알 수 없는 오류가 발생했습니다.",
        });
      }
      console.error("Update post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // AuthContext가 로딩 중이면 로딩 표시
  if (isLoading) {
    return <div>인증 정보를 확인하는 중...</div>;
  }

  // 로그인되지 않은 경우 (로딩 완료 후)
  if (!isLoggedIn) {
    return null; // navigate가 실행되므로 아무것도 렌더링하지 않음
  }

  if (pageLoading) return <p>게시글 불러오는 중...</p>;

  return (
    <div>
      <h1>게시글 수정</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formPostTitle">
          <Form.Label>제목</Form.Label>
          <Form.Control
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPostContent">
          <Form.Label>내용</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <SpinnerInline /> 수정 중...
            </>
          ) : (
            "게시글 수정"
          )}
        </Button>
      </Form>
    </div>
  );
}
