import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SubjectCard from '../components/SubjectCard';
import { Book } from 'lucide-react';

interface SubjectData {
  subject: string;
  paperTypes: string[];
  semts: string[];
}

const DashboardPage: React.FC = () => {
  const { student } = useAuth();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!student?.usn) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:8000/students/subjects/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ usn: student.usn }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        // Map the array of subject names to full SubjectData objects with empty arrays for paperTypes and semts
        const subjectList: SubjectData[] = data.subjects.map((subject: string) => ({
          subject,
          paperTypes: [], // TODO: update with real data if available
          semts: [],      // TODO: update with real data if available
        }));

        setSubjects(subjectList);
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [student]);

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">View your subjects and exam papers</p>
      </header>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Your Subjects</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg h-32 border border-slate-200"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <SubjectCard key={subject.subject} subject={subject} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <div className="flex justify-center">
              <div className="rounded-full p-3 bg-slate-100">
                <Book className="h-8 w-8 text-slate-400" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">No subjects found</h3>
            <p className="mt-2 text-sm text-slate-500">
              You don't have any subjects assigned yet.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Welcome to GraderPro</h3>
              <p className="mt-2 text-sm text-slate-500">
                View your exam papers, check marks, and read feedback from your instructors.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
