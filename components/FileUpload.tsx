import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange }) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type.startsWith('image/'));
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = (Array.from(e.target.files) as File[]).filter(file => file.type.startsWith('image/'));
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ease-in-out ${
          isDragging 
            ? 'border-brand-400 bg-brand-400/10' 
            : 'border-dark-700 hover:border-brand-500/50 hover:bg-dark-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
          <div className="p-3 bg-dark-700 rounded-full text-brand-400">
            <Upload size={24} />
          </div>
          <p className="text-sm font-medium text-slate-300">
            {t('upload.drop_text')}
          </p>
          <p className="text-xs text-slate-500">
            {t('upload.click_text')}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-dark-700 bg-dark-800">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors z-20"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                <p className="text-[10px] text-white truncate px-1">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
