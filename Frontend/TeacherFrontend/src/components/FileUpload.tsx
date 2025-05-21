import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

type FileUploadProps = {
  onChange: (files: File[]) => void;
  acceptedTypes?: string;
  label: string;
  description?: string;
  multiple?: boolean;
  maxFiles?: number;
  minFiles?: number;
  className?: string;
  files?: File[];
};

const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  acceptedTypes = 'image/*',
  label,
  description,
  multiple = true,
  maxFiles = 5,
  minFiles = 1,
  className = '',
  files = [],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);

    if (fileArray.length < minFiles || fileArray.length > maxFiles) {
      alert(`Please select between ${minFiles} and ${maxFiles} files.`);
      return;
    }

    onChange(fileArray);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const updated = files?.filter((_, i) => i !== index) || [];
    onChange(updated);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
              <span className="text-sm text-gray-800 truncate max-w-[80%]">{file.name}</span>
              <button onClick={() => removeFile(idx)} className="text-gray-500 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
