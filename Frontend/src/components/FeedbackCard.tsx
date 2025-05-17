import React from 'react';
import { CheckCircle, AlertTriangle, ArrowUp } from 'lucide-react';
import { FeedbackData } from '../api/api';

interface FeedbackCardProps {
  qNumber: string;
  feedback: FeedbackData;
  maxMarks?: number;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
  qNumber, 
  feedback,
  maxMarks = 10
}) => {
  const percentage = (feedback.marks / maxMarks) * 100;
  
  let scoreColor = 'text-error-500';
  if (percentage >= 80) {
    scoreColor = 'text-accent-500';
  } else if (percentage >= 60) {
    scoreColor = 'text-warning-500';
  }
  
  return (
    <div className="card p-5 animate-fade-in mb-4">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-slate-900">{qNumber}</h3>
        <div className={`text-lg font-bold ${scoreColor}`}>
          {feedback.marks}/{maxMarks}
        </div>
      </div>
      
      <div className="mt-4 space-y-3">
        {feedback.feedback?.positives && (
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-accent-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700">Positives</h4>
              <p className="text-sm text-slate-600">{feedback.feedback.positives}</p>
            </div>
          </div>
        )}
        
        {feedback.feedback?.improvement && (
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-warning-500">
              <ArrowUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700">Areas to Improve</h4>
              <p className="text-sm text-slate-600">{feedback.feedback.improvement}</p>
            </div>
          </div>
        )}
        
        {feedback.feedback?.errors && feedback.feedback.errors.length > 0 && (
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-error-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700">Errors</h4>
              <ul className="text-sm text-slate-600 list-disc list-inside">
                {feedback.feedback.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackCard;