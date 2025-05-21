import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, FileText, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/api';

interface Subject {
  subject: string;
  sem: string;
  paperTypes: string[];
}

const Dashboard: React.FC = () => {
  const { usn } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!usn) return;
      
      try {
        setIsLoading(true);
        const data = await studentService.getSubjects(usn);
        setSubjects(data.subjects || []);
        setSubjectsData(data.subjectsData || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [usn]);

  const handleSubjectClick = (subject: string) => {
    navigate(`/subject/${subject}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader size={48} className="text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading your subjects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 text-sm underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-title">My Subjects</h1>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Book size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No subjects found</h3>
          <p className="text-gray-500">You don't have any subjects registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, index) => {
            const subjectData = subjectsData.find(s => s.subject === subject) || { 
              subject,
              sem: "Unknown",
              paperTypes: []
            };
            
            return (
              <div 
                key={index} 
                className="card p-6 cursor-pointer hover:translate-y-[-4px] transition-all duration-300"
                onClick={() => handleSubjectClick(subject)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText size={24} className="text-blue-700" />
                  </div>
                  <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    Sem {subjectData.sem || "Unknown"}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{subject}</h3>
                <p className="text-gray-600 mb-4">
                  {subjectData.paperTypes.length > 0 
                    ? `${subjectData.paperTypes.length} test${subjectData.paperTypes.length !== 1 ? 's' : ''} available`
                    : 'No tests available'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {subjectData.paperTypes.join(", ") || "No tests"}
                  </span>
                  <span className="text-blue-600 text-sm font-medium">View Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;