import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PaperCard from '../components/PaperCard';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects, SubjectData } from '../api/api';

const SubjectPage: React.FC = () => {
  const { subject } = useParams<{ subject: string }>();
  const { student } = useAuth();
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (student?.usn && subject) {
      setLoading(true);
      fetchSubjects(student.usn)
        .then(data => {
          const matchedSubject = data.find(s => s.subject === subject);
          setSubjectData(matchedSubject || null);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching subject data:', error);
          setLoading(false);
        });
    }
  }, [student, subject]);
  
  // Generate dates based on paper types (for demo)
  const getDemoDate = (paperType: string): string => {
    const now = new Date();
    if (paperType === 'Midterm') {
      return new Date(now.setMonth(now.getMonth() - 2)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else {
      return new Date(now.setMonth(now.getMonth() - 1)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };
  
  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        {loading ? (
          <div className="animate-pulse h-8 bg-slate-200 w-64 rounded-md mb-2"></div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-slate-900">{subject}</h1>
            <p className="mt-2 text-slate-600">
              Semester {subjectData?.sem || '-'} • {subjectData?.paperTypes.length || 0} Papers
            </p>
          </>
        )}
      </header>
      
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Exam Papers</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-lg h-40 border border-slate-200"></div>
            ))}
          </div>
        ) : subjectData && subjectData.paperTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectData.paperTypes.map((paperType) => (
              <PaperCard
                key={paperType}
                subject={subject || ''}
                paperType={paperType}
                date={getDemoDate(paperType)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <div className="flex justify-center">
              <div className="rounded-full p-3 bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No papers found</h3>
            <p className="mt-2 text-sm text-slate-500">There are no exam papers available for this subject yet.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default SubjectPage;