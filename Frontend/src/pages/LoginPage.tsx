import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, UserPlus, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isValidatingUsn } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usnError, setUsnError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (usn: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/student/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usn, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      alert('Signup successful! Please login.');
      setIsSignup(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (usn: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/student/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usn, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('student', JSON.stringify({ usn }));
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsnError('');

    const usnPattern = /^1RV22[A-Z]{3}\d+$/;
    if (!usnPattern.test(usn)) {
      setUsnError('Invalid USN format. Format should be 1RV22XXXNNN');
      return;
    }

    if (isSignup) {
      await handleSignup(usn, email, password);
    } else {
      await handleLogin(usn, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">GraderPro</h2>
          <p className="mt-2 text-slate-600">Student Grading Platform</p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow-md rounded-lg sm:px-10 animate-fade-in">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setIsSignup(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                !isSignup
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LogIn className="h-4 w-4 inline mr-2" />
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isSignup
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              Sign Up
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="usn" className="block text-sm font-medium text-slate-700">
                University Seat Number (USN)
              </label>
              <div className="mt-1 relative">
                <input
                  id="usn"
                  name="usn"
                  type="text"
                  required
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  placeholder="1RV22CSXXX"
                  className="input pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              {usnError && (
                <div className="mt-2 text-sm text-error-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {usnError}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Enter your USN in the format 1RV22XXXNNN (e.g., 1RV22CS123)
              </p>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="input pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              {isSignup && (
                <p className="mt-2 text-xs text-slate-500">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isSignup ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignup ? (
                      <UserPlus className="h-5 w-5 mr-1" />
                    ) : (
                      <LogIn className="h-5 w-5 mr-1" />
                    )}
                    {isSignup ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <div className="text-xs text-slate-500">
              <p>Demo Hint: Enter any USN in format 1RV22CSXXX</p>
              <p>Example: 1RV22CS123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;