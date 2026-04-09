import { useState, useCallback } from 'react';

interface ResumeUploaderProps {
  onUpload: (file: File, name: string) => Promise<void>;
  loading: boolean;
}

export function ResumeUploader({ onUpload, loading }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        if (!resumeName) {
          setResumeName(file.name.replace('.pdf', ''));
        }
      } else {
        alert('Please upload a PDF file');
      }
    }
  }, [resumeName]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        if (!resumeName) {
          setResumeName(file.name.replace('.pdf', ''));
        }
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !resumeName) return;
    await onUpload(selectedFile, resumeName);
    setSelectedFile(null);
    setResumeName('');
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileInput}
          disabled={loading}
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedFile ? selectedFile.name : 'Upload Resume PDF'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop or click to browse
          </p>
          <button
            type="button"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            Choose File
          </button>
        </label>
      </div>

      {selectedFile && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume Name
            </label>
            <input
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="e.g., Frontend Resume, Data Engineer Resume"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading || !resumeName}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Parsing with AI...
                </span>
              ) : (
                'Upload & Parse Resume'
              )}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setResumeName('');
              }}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
