import React, { createContext, useContext, useState, useEffect } from 'react';

interface Student {
  usn: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  student: Student | null;
  isAuthenticated: boolean;
  login: (usn: string, password: string) => void;
  signup: (usn: string, email: string, password: string) => void;
  logout: () => void;
  isValidatingUsn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidatingUsn, setIsValidatingUsn] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      try {
        const parsedStudent = JSON.parse(storedStudent);
        setStudent(parsedStudent);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored student data', error);
        localStorage.removeItem('student');
      }
    }
  }, []);

  const login = (usn: string, password: string) => {
    setIsValidatingUsn(true);
    
    // Simple regex validation for USN pattern: 1RV22[A-Z]{3}\d+
    const usnPattern = /^1RV22[A-Z]{3}\d+$/;
    
    if (!usnPattern.test(usn)) {
      alert('Invalid USN format');
      setIsValidatingUsn(false);
      return;
    }

    if (!password) {
      alert('Password is required');
      setIsValidatingUsn(false);
      return;
    }
    
    // In a real scenario, you would validate this with the backend
    // For now, we'll simulate a successful login with any valid USN and password
    setTimeout(() => {
      const newStudent = { usn };
      setStudent(newStudent);
      setIsAuthenticated(true);
      localStorage.setItem('student', JSON.stringify(newStudent));
      setIsValidatingUsn(false);
    }, 800);
  };

  const signup = (usn: string, email: string, password: string) => {
    setIsValidatingUsn(true);
    
    const usnPattern = /^1RV22[A-Z]{3}\d+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!usnPattern.test(usn)) {
      alert('Invalid USN format');
      setIsValidatingUsn(false);
      return;
    }

    if (!emailPattern.test(email)) {
      alert('Invalid email format');
      setIsValidatingUsn(false);
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      setIsValidatingUsn(false);
      return;
    }
    
    // Simulate signup API call
    setTimeout(() => {
      const newStudent = { usn, email };
      setStudent(newStudent);
      setIsAuthenticated(true);
      localStorage.setItem('student', JSON.stringify(newStudent));
      setIsValidatingUsn(false);
    }, 800);
  };

  const logout = () => {
    setStudent(null);
    setIsAuthenticated(false);
    localStorage.removeItem('student');
  };

  return (
    <AuthContext.Provider value={{ student, isAuthenticated, login, signup, logout, isValidatingUsn }}>
      {children}
    </AuthContext.Provider>
  );
};