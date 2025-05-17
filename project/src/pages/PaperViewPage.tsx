import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Loader, Download } from 'lucide-react';
import FeedbackCard from '../components/FeedbackCard';
import { useAuth } from '../context/AuthContext';
import { fetchDemoFeedback, fetchDemoPaper, FeedbackData, PaperData } from '../api/api';

const PaperViewPage: React.FC = () => {
  const { subject, paperType } = useParams<{ subject: string; paperType: string }>();
  const { student } = useAuth();
  
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [feedbacks, setFeedbacks] = useState<{ [key: string]: FeedbackData }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('paper');
  const [activeQuestion, setActiveQuestion] = useState('Q1');
  
  useEffect(() => {
    if (student?.usn && subject && paperType) {
      setLoading(true);
      
      const fetchData = async () => {
        try {
          // Fetch paper and first question feedback in parallel
          const [paperData, q1Feedback] = await Promise.all([
            fetchDemoPaper(subject, paperType),
            fetchDemoFeedback(subject, paperType, 'Q1'),
          ]);
          
          setPaper(paperData);
          setFeedbacks({ Q1: q1Feedback });
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [student, subject, paperType]);
  
  // Fetch feedback for a question when selected
  const handleQuestionSelect = async (qno: string) => {
    if (!feedbacks[qno] && subject && paperType) {
      try {
        const feedback = await fetchDemoFeedback(subject, paperType, qno);
        setFeedbacks(prev => ({ ...prev, [qno]: feedback }));
      } catch (error) {
        console.error(`Error fetching feedback for ${qno}:`, error);
      }
    }
    
    setActiveQuestion(qno);
  };
  
  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <Link 
          to={`/subject/${subject}`} 
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {subject}
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900">{paperType} Paper</h1>
        <p className="mt-2 text-slate-600">
          {subject} • Semester {paper?.sem || '-'}
        </p>
      </header>
      
      <div className="flex flex-wrap mb-6 border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'paper'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('paper')}
        >
          Paper View
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'feedback'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 text-primary-500 animate-spin" />
          <span className="ml-2 text-slate-600">Loading paper...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Questions sidebar */}
          <div className="md:col-span-1 order-2 md:order-1">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sticky top-20">
              <h3 className="font-medium text-slate-900 mb-4">Questions</h3>
              
              <div className="space-y-2">
                {['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].map((qno) => (
                  <button
                    key={qno}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                      activeQuestion === qno
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => handleQuestionSelect(qno)}
                  >
                    <span className="font-medium">{qno}</span>
                    {feedbacks[qno] && (
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        feedbacks[qno].marks >= 8 
                          ? 'bg-accent-100 text-accent-700' 
                          : feedbacks[qno].marks >= 6 
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-error-100 text-error-700'
                      }`}>
                        {feedbacks[qno].marks}/10
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200">
                <button className="btn-secondary w-full">
                  <Download className="h-4 w-4" />
                  Download All
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-2 order-1 md:order-2">
            {activeTab === 'paper' ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-0 overflow-hidden">
                {paper?.paper && paper.paper.length > 0 ? (
                  <>
                    {/* For demo purposes, using placeholder images, but in production, 
                        you would convert the base64 string from API to an image */}
                    <div className="relative aspect-[4/5] bg-slate-200">
                      <img 
                        src={paper.paper[0]} 
                        alt="Exam paper" 
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Question highlights */}
                      <div 
                        className={`absolute top-1/4 left-1/4 w-1/2 h-1/6 border-2 opacity-80 ${
                          activeQuestion === 'Q1' ? 'border-primary-500 bg-primary-100' : 'border-transparent'
                        }`}
                        onClick={() => handleQuestionSelect('Q1')}
                      ></div>
                      
                      <div 
                        className={`absolute top-2/5 left-1/4 w-1/2 h-1/6 border-2 opacity-80 ${
                          activeQuestion === 'Q2' ? 'border-primary-500 bg-primary-100' : 'border-transparent'
                        }`}
                        onClick={() => handleQuestionSelect('Q2')}
                      ></div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0">
                      <div className="flex items-center justify-between">
                        <div className="text-slate-600 text-sm">
                          <span className="font-medium">{activeQuestion}</span> •  
                          {feedbacks[activeQuestion] && (
                            <span className="ml-1">
                              Score: <span className="font-medium">{feedbacks[activeQuestion].marks}/10</span>
                            </span>
                          )}
                        </div>
                        <button className="btn-secondary text-sm py-1">
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="rounded-full p-3 bg-slate-100">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No paper found</h3>
                    <p className="mt-2 text-sm text-slate-500">This paper is not available yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {feedbacks[activeQuestion] ? (
                  <FeedbackCard
                    qNumber={activeQuestion}
                    feedback={feedbacks[activeQuestion]}
                  />
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
                    <div className="flex justify-center">
                      <div className="rounded-full p-3 bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No feedback yet</h3>
                    <p className="mt-2 text-sm text-slate-500">Feedback for this question hasn't been provided yet.</p>
                  </div>
                )}
                
                {/* More feedback examples for demonstration */}
                {activeTab === 'feedback' && activeQuestion === 'Q1' && (
                  <div className="mt-6 bg-white rounded-lg border border-slate-200 p-5">
                    <h3 className="font-medium text-slate-900 mb-3">Instructor Notes</h3>
                    <p className="text-sm text-slate-600">
                      Good attempt at solving the problem. Make sure to always show your work step by step, 
                      especially in calculus problems. Remember to check your final answer by plugging it 
                      back into the original equation.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperViewPage;