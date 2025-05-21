import React from 'react';

type ResultItemProps = {
  questionNumber: number;
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  diagramFeedback?: string; // Added for diagram evaluation
};

const ResultItem: React.FC<ResultItemProps> = ({
  questionNumber,
  question,
  score,
  maxScore,
  feedback,
  diagramFeedback
}) => {
  // Calculate percentage for score bar
  const percentage = (score / maxScore) * 100;
  
  // Determine color based on score
  const getScoreColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Question {questionNumber}</h3>
        <span className="text-lg font-semibold">
          <span className={percentage >= 60 ? 'text-green-600' : 'text-red-600'}>
            {score}
          </span>
          <span className="text-gray-600">/{maxScore}</span>
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Question:</p>
        <p className="text-gray-800">{question}</p>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Score</span>
          <span className="font-medium">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getScoreColor()}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">Feedback:</p>
        <p className="text-gray-800 bg-gray-50 p-3 rounded">{feedback}</p>
      </div>
      
      {diagramFeedback && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Diagram Feedback:</p>
          <p className="text-gray-800 bg-gray-50 p-3 rounded border-l-4 border-blue-500">{diagramFeedback}</p>
        </div>
      )}
    </div>
  );
};

export default ResultItem;
