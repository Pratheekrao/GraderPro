import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { logout, usn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <GraduationCap size={28} />
            <span className="text-xl font-bold">GraderPro</span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="hover:text-blue-200 transition-colors">
              Dashboard
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-blue-200">{usn}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-blue-800 hover:bg-blue-900 px-3 py-2 rounded transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-800 pb-4 px-4">
          <Link 
            to="/dashboard" 
            className="block py-2 hover:text-blue-200 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <div className="py-2 border-t border-blue-700 mt-2">
            <p className="text-blue-200 mb-2">{usn}</p>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-950 px-3 py-2 rounded w-full"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;