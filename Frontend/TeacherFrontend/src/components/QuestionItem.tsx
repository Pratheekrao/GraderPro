import { useState, useRef } from 'react';

type QuestionItemProps = {
  questionNum: string;
  questionText: string;
  requiresDiagram: boolean;
  onDiagramUpload: (questionNum: string, file: File | null) => void;
};

const QuestionItem: React.FC<QuestionItemProps> = ({
  questionNum,
  questionText,
  requiresDiagram,
  onDiagramUpload,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      onDiagramUpload(questionNum, file);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      onDiagramUpload(questionNum, null);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="px-5 py-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium text-gray-900">Question {questionNum}</h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </button>
      </div>
      
      <div className={`px-5 pb-4 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <p className="text-gray-700 mb-4">{questionText}</p>
        
        {requiresDiagram && (
          <div className="mt-2 pt-3 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Upload Diagram
            </label>
            <p className="text-sm text-gray-500 mb-2">
              This question requires a diagram. Please upload an image file.
            </p>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full border-gray-300 rounded-md p-2.5 border shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Diagram for Question ${questionNum}`}
                className="mt-3 max-w-full max-h-60 rounded border"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionItem;
