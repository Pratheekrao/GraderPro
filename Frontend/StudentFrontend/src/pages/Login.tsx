import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!usn.trim()) {
      setError('USN is required');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    // USN format validation (1RV22XX000)
    if (!/^1RV22[A-Z]{2}\d+$/.test(usn)) {
      setError('Invalid USN format. Expected format: 1RV22XX000');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authService.login(usn, password);
      login(usn);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <GraduationCap size={48} className="text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Login to GraderPro</h1>
          <p className="text-gray-600 mt-2">Access your academic performance and feedback</p>
        </div>
        
        <div className="card p-6 md:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="usn" className="form-label">USN</label>
              <input
                type="text"
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="e.g., 1RV22CS001"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;