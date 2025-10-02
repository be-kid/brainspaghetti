import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Form, Button, Alert } from "react-bootstrap"; // Import Form, Button, Alert
import { useToast } from "../contexts/ToastContext";
import { SpinnerInline } from "../components/Loading";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{ accessToken: string }>("/user/login", {
        email,
        password,
      });

      const { accessToken } = response.data;
      login(accessToken); // login 함수에서 localStorage에 저장함
      navigate("/");
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "로그인 중 오류가 발생했습니다.");
        showToast({
          variant: "danger",
          message:
            err.response.data.message || "로그인 중 오류가 발생했습니다.",
        });
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
        showToast({
          variant: "danger",
          message: "알 수 없는 오류가 발생했습니다.",
        });
      }
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>로그인</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>이메일 주소</Form.Label>
          <Form.Control
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>비밀번호</Form.Label>
          <Form.Control
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <SpinnerInline /> 로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </Button>
      </Form>
    </div>
  );
}
