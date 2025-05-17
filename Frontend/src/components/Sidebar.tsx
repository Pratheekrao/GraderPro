import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Home, BookOpen, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects, SubjectData } from '../api/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { student } = useAuth();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (student?.usn) {
      setLoading(true);
      fetchSubjects(student.usn)
        .then(data => {
          setSubjects(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          setLoading(false);
        });
    }
  }, [student]);
  
  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900 bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 md:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4 h-[calc(100vh-4rem)] overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
                onClick={() => onClose()}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </NavLink>
            </li>
            
            <li className="pt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                Subjects
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-2 px-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-9 bg-slate-200 rounded-md"></div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {subjects.map((subject) => (
                    <li key={subject.subject}>
                      <NavLink
                        to={`/subject/${subject.subject}`}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-4 py-2 rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`
                        }
                        onClick={() => onClose()}
                      >
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-3" />
                          <span>{subject.subject}</span>
                        </div>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          Sem {subject.sem}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            
            <li className="pt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                Reports
              </div>
              <NavLink
                to="/performance"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
                onClick={() => onClose()}
              >
                <BarChart2 className="h-5 w-5 mr-3" />
                Performance
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;