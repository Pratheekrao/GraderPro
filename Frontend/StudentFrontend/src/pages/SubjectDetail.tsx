import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/api';

interface Feedback {
  qno: number;
  question: string;
  answer: string;
  feedback: string;
  score: number;
  total: number;
}

interface SubjectData {
  subject: string;
  sem: string;
  paperTypes: string[];
}

const SubjectDetail: React.FC = () => {
  const { subject } = useParams<{ subject: string }>();
  const { usn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string>('');

  // Fetch subject data first
  useEffect(() => {
    const fetchSubjectData = async () => {
      if (!usn || !subject) return;
      
      try {
        setIsLoading(true);
        const data = await studentService.getSubjects(usn);
        
        // Find the subject in the data
        const foundSubject = data.subjectsData?.find((s: SubjectData) => s.subject === subject);
        
        if (foundSubject) {
          setSubjectData(foundSubject);
          // Set the first exam type as selected by default if available
          if (foundSubject.paperTypes && foundSubject.paperTypes.length > 0) {
            setSelectedExamType(foundSubject.paperTypes[0]);
          }
        } else {
          setError('Subject not found');
        }
      } catch (err) {
        console.error('Error fetching subject data:', err);
        setError('Failed to load subject data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectData();
  }, [usn, subject]);

  // Fetch feedback when exam type changes
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!usn || !subject || !selectedExamType) return;
      
      try {
        setIsLoading(true);
        const data = await studentService.getSubjectDetails(usn, subject, selectedExamType);
        setFeedbacks(data.feedbacks || []);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        // Don't show error for feedback, just show empty state
        setFeedbacks([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedExamType) {
      fetchFeedback();
    }
  }, [usn, subject, selectedExamType]);

  const calculateTotalScore = () => {
    if (!feedbacks.length) return { earned: 0, total: 0 };
    
    const earned = feedbacks.reduce((sum, item) => sum + (item.score || 0), 0);
    const total = feedbacks.reduce((sum, item) => sum + (item.total || 0), 0);
    
    return { earned, total };
  };

  const { earned, total } = calculateTotalScore();
  const scorePercentage = total > 0 ? (earned / total) * 100 : 0;

  return (
    <div>
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
          {subject}
          {subjectData?.sem && (
            <span className="ml-2 text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
              Semester {subjectData.sem}
            </span>
          )}
        </h1>

        {subjectData?.paperTypes && subjectData.paperTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjectData.paperTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedExamType(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedExamType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading exam data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
            <AlertTriangle size={24} className="mx-auto mb-2" />
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-3 text-sm underline hover:text-red-800"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
          {selectedExamType && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">{selectedExamType} Summary</h2>
                
                <div className="flex flex-col md:flex-row md:items-center mb-4">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 md:mb-0 md:mr-6 md:w-1/3">
                    <h3 className="text-lg font-medium text-blue-800 mb-1">Overall Score</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold text-blue-700">{earned}</span>
                      <span className="text-xl text-blue-600 ml-1">/ {total}</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          scorePercentage >= 70 ? 'bg-green-500' : 
                          scorePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${scorePercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {scorePercentage.toFixed(1)}% {' '}
                      {scorePercentage >= 70 ? 'Excellent' : 
                       scorePercentage >= 40 ? 'Satisfactory' : 'Needs improvement'}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-4">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                      <FileText size={18} className="mr-2" />
                      Review Paper
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedbacks section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Question-wise Feedback</h2>
                
                {feedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <FileText size={32} className="mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No feedback available</h3>
                    <p className="text-gray-500">Feedback for this exam has not been provided yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {feedbacks.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Question {item.qno}</h3>
                          <div className="flex items-center">
                            <span className="font-semibold mr-1">
                              {item.score} / {item.total}
                            </span>
                            {item.score === item.total ? (
                              <CheckCircle size={18} className="text-green-500" />
                            ) : item.score === 0 ? (
                              <XCircle size={18} className="text-red-500" />
                            ) : (
                              <span className="text-yellow-500">●</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Question:</h4>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{item.question}</p>
                        </div>
                        
                        
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Feedback:</h4>
                          <p className="text-gray-800 bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">{item.feedback}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubjectDetail;