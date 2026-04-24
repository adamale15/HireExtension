import { useState, useCallback } from 'react';
import type { ThemeMode } from '../lib/types';

interface ResumeUploaderProps {
  onUpload: (file: File, name: string) => Promise<void>;
  loading: boolean;
  themeMode: ThemeMode;
}

export function ResumeUploader({ onUpload, loading, themeMode }: ResumeUploaderProps) {
  const isDark = themeMode === 'dark';
  const [dragActive, setDragActive] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      const files = event.dataTransfer.files;
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
    },
    [resumeName],
  );

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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
    if (!selectedFile || !resumeName) {
      return;
    }

    await onUpload(selectedFile, resumeName);
    setSelectedFile(null);
    setResumeName('');
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-[26px] border-2 border-dashed p-8 text-center transition-colors"
        style={{
          borderColor: dragActive ? 'var(--accent)' : 'var(--border-strong)',
          background: dragActive
            ? 'var(--accent-soft)'
            : isDark
              ? 'rgba(15, 23, 42, 0.46)'
              : 'rgba(248, 250, 252, 0.95)',
        }}
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
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] text-sm font-semibold uppercase tracking-[0.24em]"
            style={{
              background: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
          >
            PDF
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-strong)]">
            {selectedFile ? selectedFile.name : 'Upload Resume PDF'}
          </h3>
          <p className="mb-4 text-sm text-[var(--text)]">Drag and drop or click to browse</p>
          <span
            className="inline-block rounded-2xl px-6 py-2 text-sm font-medium text-white"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                : 'linear-gradient(135deg, #0f172a, #0369a1)',
            }}
          >
            Choose file
          </span>
        </label>
      </div>

      {selectedFile && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Resume name
            </label>
            <input
              type="text"
              value={resumeName}
              onChange={(event) => setResumeName(event.target.value)}
              placeholder="e.g., Frontend Resume, Data Engineer Resume"
              className="w-full rounded-2xl px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-sky-500"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text-strong)',
              }}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading || !resumeName}
              className="flex-1 rounded-2xl px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                  : 'linear-gradient(135deg, #0f172a, #0369a1)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Parsing with AI...
                </span>
              ) : (
                'Upload and parse resume'
              )}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setResumeName('');
              }}
              disabled={loading}
              className="rounded-2xl px-6 py-3 transition-colors disabled:opacity-50"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-strong)',
                color: 'var(--text)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
