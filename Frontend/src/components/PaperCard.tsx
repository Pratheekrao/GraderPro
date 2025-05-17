import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, Eye } from 'lucide-react';

interface PaperCardProps {
  subject: string;
  paperType: string;
  date: string;
}

const PaperCard: React.FC<PaperCardProps> = ({ subject, paperType, date }) => {
  return (
    <div className="card p-5 hover:border-primary-300 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-slate-900">{paperType}</h3>
          <div className="flex items-center mt-1 text-sm text-slate-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{date}</span>
          </div>
        </div>
        
        <div className={`text-sm px-2 py-1 rounded-md ${
          paperType === 'CIE' 
            ? 'bg-warning-100 text-warning-700' 
            : 'bg-accent-100 text-accent-700'
        }`}>
          {paperType}
        </div>
      </div>
      
      <div className="mt-4 flex space-x-3">
        <Link
          to={`/paper/${subject}/${paperType}`}
          className="btn-primary"
        >
          <Eye className="h-4 w-4" />
          View Paper
        </Link>
        
        <button className="btn-secondary">
          <ExternalLink className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
};

export default PaperCard;