import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Toast, ToastContainer } from "react-bootstrap";

export type ToastVariant = "success" | "danger" | "warning" | "info";

export interface AppToast {
  id: number;
  title?: string;
  message: string;
  variant?: ToastVariant;
  autohideMs?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<AppToast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const showToast = useCallback((toast: Omit<AppToast, "id">) => {
    setToasts((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        variant: "danger",
        autohideMs: 2500,
        ...toast,
      },
    ]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 2000 }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={
              t.variant === "success"
                ? "success"
                : t.variant === "warning"
                ? "warning"
                : t.variant === "info"
                ? "info"
                : "danger"
            }
            onClose={() => remove(t.id)}
            autohide
            delay={t.autohideMs ?? 2500}
          >
            {t.title && (
              <Toast.Header closeButton>
                <strong className="me-auto">{t.title}</strong>
              </Toast.Header>
            )}
            <Toast.Body style={{ color: "#fff" }}>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
