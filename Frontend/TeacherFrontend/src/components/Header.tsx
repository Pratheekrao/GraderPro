import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 transition-transform hover:scale-105">
            <GraduationCap size={28} className="text-white" />
            <h1 className="text-2xl font-bold">AutoGrader</h1>
          </Link>
          <nav>
            <ul className="flex space-x-8">
              <li>
                <Link 
                  to="/" 
                  className="text-white/90 transition-colors hover:text-white"
                >
                  Upload Questions
                </Link>
              </li>
              <li>
                <Link 
                  to="/upload_answer" 
                  className="text-white/90 transition-colors hover:text-white"
                >
                  Upload Answers
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;