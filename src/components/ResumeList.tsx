import { useState } from 'react';
import type { Resume } from '../lib/types';
import type { ThemeMode } from '../lib/types';

interface ResumeListProps {
  resumes: Resume[];
  defaultResumeId: string | null;
  onSetDefault: (resumeId: string) => Promise<void>;
  onRename: (resumeId: string, newName: string) => Promise<void>;
  onDelete: (resumeId: string) => Promise<void>;
  loading: boolean;
  themeMode: ThemeMode;
}

export function ResumeList({
  resumes,
  defaultResumeId,
  onSetDefault,
  onRename,
  onDelete,
  loading,
  themeMode,
}: ResumeListProps) {
  const isDark = themeMode === 'dark';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartEdit = (resume: Resume) => {
    setEditingId(resume.id);
    setEditName(resume.name);
  };

  const handleSaveEdit = async (resumeId: string) => {
    if (editName.trim()) {
      await onRename(resumeId, editName.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (resumes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[var(--text-strong)]">Your Resumes</h3>
      
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="rounded-[22px] p-4 transition-colors"
          style={{
            background: 'var(--surface-soft)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingId === resume.id ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    style={{
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface-strong)',
                      color: 'var(--text-strong)',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(resume.id)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-white"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                        : 'linear-gradient(135deg, #0f172a, #0369a1)',
                    }}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{
                      border: '1px solid var(--border-strong)',
                      background: 'var(--surface-strong)',
                      color: 'var(--text)',
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="truncate font-medium text-[var(--text-strong)]">
                    {resume.name}
                  </h4>
                  {defaultResumeId === resume.id && (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
              )}
              
              <p className="mb-2 text-sm text-[var(--text)]">
                Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === resume.id ? null : resume.id)}
                  className="text-sm text-[var(--accent)]"
                >
                  {expandedId === resume.id ? 'Hide Details' : 'View Details'}
                </button>
                
                {defaultResumeId !== resume.id && (
                  <button
                    onClick={() => onSetDefault(resume.id)}
                    className="text-sm text-[var(--text)]"
                    disabled={loading}
                  >
                    Set as Default
                  </button>
                )}
                
                <button
                  onClick={() => handleStartEdit(resume)}
                  className="text-sm text-[var(--text)]"
                  disabled={loading}
                >
                  Rename
                </button>
                
                <button
                  onClick={() => {
                    if (confirm(`Delete "${resume.name}"?`)) {
                      onDelete(resume.id);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {expandedId === resume.id && (
            <div className="mt-4 space-y-3 border-t pt-4 text-sm" style={{ borderTop: '1px solid var(--border)' }}>
              {resume.parsedProfile.summary && (
                <div>
                  <h5 className="mb-1 font-medium text-[var(--text-strong)]">Summary</h5>
                  <p className="text-[var(--text)]">{resume.parsedProfile.summary}</p>
                </div>
              )}

              {resume.parsedProfile.skills.length > 0 && (
                <div>
                  <h5 className="mb-1 font-medium text-[var(--text-strong)]">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {resume.parsedProfile.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full px-2.5 py-1 text-xs"
                        style={{
                          background: 'var(--surface-strong)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {skill.name}
                      </span>
                    ))}
                    {resume.parsedProfile.skills.length > 10 && (
                      <span className="px-2 py-1 text-xs text-[var(--text-soft)]">
                        +{resume.parsedProfile.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {resume.parsedProfile.experience.length > 0 && (
                <div>
                  <h5 className="mb-1 font-medium text-[var(--text-strong)]">Experience</h5>
                  <ul className="space-y-2">
                    {resume.parsedProfile.experience.slice(0, 3).map((exp, idx) => (
                      <li key={idx} className="text-[var(--text)]">
                        <span className="font-medium text-[var(--text-strong)]">{exp.title}</span> at {exp.company}
                        <span className="ml-2 text-[var(--text-soft)]">
                          ({exp.startDate} - {exp.endDate})
                        </span>
                      </li>
                    ))}
                    {resume.parsedProfile.experience.length > 3 && (
                      <li className="text-[var(--text-soft)]">
                        +{resume.parsedProfile.experience.length - 3} more positions
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {resume.parsedProfile.education.length > 0 && (
                <div>
                  <h5 className="mb-1 font-medium text-[var(--text-strong)]">Education</h5>
                  <ul className="space-y-1">
                    {resume.parsedProfile.education.map((edu, idx) => (
                      <li key={idx} className="text-[var(--text)]">
                        {edu.degree} in {edu.field} - {edu.institution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
