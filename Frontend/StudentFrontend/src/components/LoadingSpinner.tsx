import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 24 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader size={size} className="text-blue-600 animate-spin mb-3" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;