import { useState } from 'react';
import type { Resume } from '../lib/types';

interface ResumeListProps {
  resumes: Resume[];
  defaultResumeId: string | null;
  onSetDefault: (resumeId: string) => Promise<void>;
  onRename: (resumeId: string, newName: string) => Promise<void>;
  onDelete: (resumeId: string) => Promise<void>;
  loading: boolean;
}

export function ResumeList({
  resumes,
  defaultResumeId,
  onSetDefault,
  onRename,
  onDelete,
  loading,
}: ResumeListProps) {
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
      <h3 className="text-lg font-semibold text-gray-900">Your Resumes</h3>
      
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingId === resume.id ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(resume.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {resume.name}
                  </h4>
                  {defaultResumeId === resume.id && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-2">
                Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === resume.id ? null : resume.id)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {expandedId === resume.id ? 'Hide Details' : 'View Details'}
                </button>
                
                {defaultResumeId !== resume.id && (
                  <button
                    onClick={() => onSetDefault(resume.id)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                    disabled={loading}
                  >
                    Set as Default
                  </button>
                )}
                
                <button
                  onClick={() => handleStartEdit(resume)}
                  className="text-sm text-gray-600 hover:text-gray-900"
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
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm">
              {/* Summary */}
              {resume.parsedProfile.summary && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Summary</h5>
                  <p className="text-gray-600">{resume.parsedProfile.summary}</p>
                </div>
              )}

              {/* Skills */}
              {resume.parsedProfile.skills.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {resume.parsedProfile.skills.slice(0, 10).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {resume.parsedProfile.skills.length > 10 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{resume.parsedProfile.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resume.parsedProfile.experience.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Experience</h5>
                  <ul className="space-y-2">
                    {resume.parsedProfile.experience.slice(0, 3).map((exp, idx) => (
                      <li key={idx} className="text-gray-600">
                        <span className="font-medium">{exp.title}</span> at {exp.company}
                        <span className="text-gray-500 ml-2">
                          ({exp.startDate} - {exp.endDate})
                        </span>
                      </li>
                    ))}
                    {resume.parsedProfile.experience.length > 3 && (
                      <li className="text-gray-500">
                        +{resume.parsedProfile.experience.length - 3} more positions
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Education */}
              {resume.parsedProfile.education.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Education</h5>
                  <ul className="space-y-1">
                    {resume.parsedProfile.education.map((edu, idx) => (
                      <li key={idx} className="text-gray-600">
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
