import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  usn: string | null;
  login: (usn: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usn, setUsn] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUsn = localStorage.getItem('usn');
    if (storedUsn) {
      setIsAuthenticated(true);
      setUsn(storedUsn);
    }
  }, []);

  const login = (usn: string) => {
    localStorage.setItem('usn', usn);
    setIsAuthenticated(true);
    setUsn(usn);
  };

  const logout = () => {
    localStorage.removeItem('usn');
    setIsAuthenticated(false);
    setUsn(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, usn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};