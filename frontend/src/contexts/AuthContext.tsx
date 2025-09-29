import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

interface JwtPayload {
  email: string;
  sub: number; // 'sub' is the standard claim for subject (user ID)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        setUser({ id: decodedToken.sub, email: decodedToken.email });
      } catch (error) {
        console.error('Invalid token found in storage', error);
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  const login = (token: string) => {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      setUser({ id: decodedToken.sub, email: decodedToken.email });
    } catch (error) {
      console.error('Failed to decode token on login', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
