import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/api';

const Register: React.FC = () => {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // USN format validation (1RV22XX000)
    if (!/^1RV22[A-Z]{2}\d+$/.test(usn)) {
      setError('Invalid USN format. Expected format: 1RV22XX000');
      return false;
    }
    
    // Password strength validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
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
      await authService.register(usn, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Registration failed. Please try again later.');
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
          <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
          <p className="text-gray-600 mt-2">Join GraderPro to track your academic progress</p>
        </div>
        
        <div className="card p-6 md:p-8">
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              <p>Registration successful! Redirecting to login page...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
          
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
                disabled={isLoading || success}
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
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading || success}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading || success}
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
              disabled={isLoading || success}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;