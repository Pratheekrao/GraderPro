import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import { SubjectData } from '../api/api';

interface SubjectCardProps {
  subject: SubjectData;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  return (
    <Link
      to={`/subject/${subject.subject}`}
      className="card p-5 hover:border-primary-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-primary-100 text-primary-500 mr-3">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{subject.subject}</h3>
            <p className="text-sm text-slate-500">Semester {subject.sem}</p>
          </div>
        </div>
        <span className="text-slate-400 group-hover:text-primary-500 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {subject.paperTypes.map((type) => (
          <span 
            key={type}
            className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700"
          >
            {type}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default SubjectCard;