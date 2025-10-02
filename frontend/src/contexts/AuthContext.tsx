import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

interface JwtPayload {
  email: string;
  sub: number; // 'sub' is the standard claim for subject (user ID)
  exp: number; // 'exp' is the expiration time
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTokenExpired = (token: string): boolean => {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000; // Convert to seconds
      return decodedToken.exp < currentTime;
    } catch (error) {
      return true; // If we can't decode the token, consider it expired
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          if (isTokenExpired(token)) {
            console.log("Token expired, removing from storage");
            localStorage.removeItem("accessToken");
            setUser(null);
          } else {
            const decodedToken = jwtDecode<JwtPayload>(token);
            setUser({ id: decodedToken.sub, email: decodedToken.email });
          }
        } catch (error) {
          console.error("Invalid token found in storage", error);
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth-logout events from API interceptor
    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth-logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth-logout", handleAuthLogout);
    };
  }, []);

  const login = (token: string) => {
    try {
      if (isTokenExpired(token)) {
        console.error("Cannot login with expired token");
        return;
      }

      const decodedToken = jwtDecode<JwtPayload>(token);
      localStorage.setItem("accessToken", token); // 토큰을 localStorage에 저장
      setUser({ id: decodedToken.sub, email: decodedToken.email });
    } catch (error) {
      console.error("Failed to decode token on login", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: !!user, user, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
