import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AuthUser } from '@/types/auth';
import { onAuthStateChange, login, signup, logout as firebaseLogout } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    // State will be updated via the auth state listener
  };

  const handleSignup = async (email: string, password: string) => {
    await signup(email, password);
    // State will be updated via the auth state listener
  };

  const handleLogout = async () => {
    await firebaseLogout();
    // State will be updated via the auth state listener
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
