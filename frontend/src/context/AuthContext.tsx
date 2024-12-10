import { createContext, useContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";

interface AuthContextType {
  authToken: string | null;
  user: { email: string; user_id: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; user_id: string } | null>(null);

  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken: { sub: string; user_id: string; exp: number } = jwt_decode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          logout(); // Logout if token is expired
        } else {
          setAuthToken(token);
          setUser({ email: decodedToken.sub, user_id: decodedToken.user_id });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        logout();
      }
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decodedToken: { sub: string; user_id: string } = jwt_decode(token);
    setAuthToken(token);
    setUser({ email: decodedToken.sub, user_id: decodedToken.user_id });
  };

  return (
    <AuthContext.Provider value={{ authToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
