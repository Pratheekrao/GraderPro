import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SubjectCard from '../components/SubjectCard';
import { Book } from 'lucide-react';

interface SubjectData {
  subject: string;
  paperTypes: string[];
  sem: string;
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

        const response = await fetch('http://localhost:8000/student/subjects/', {
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

        const subjectList: SubjectData[] = data.subjects.map((subject: string) => ({
          subject,
          paperTypes: [],
          sem: '',
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
    </div>
  );
};

export default DashboardPage;