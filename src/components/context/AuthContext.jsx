import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { API_URL } from "../../API/api";
import { AuthContext } from "./AuthState";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger le profil.");
      }

      setUser(data.user);
      return data.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch((error) => {
      console.error("Erreur de vérification de session :", error);
    });
  }, [refreshUser]);

  const logout = async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Impossible de terminer la session.");
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, authError, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
