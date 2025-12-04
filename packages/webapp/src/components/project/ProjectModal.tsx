'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/app-store';
import { stripHtml } from '../../lib/text-utils';

export default function ProjectModal() {
  const { selectedProject, setSelectedProject } = useAppStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && e.target === modalRef.current) {
        setSelectedProject(null);
      }
    };

    if (selectedProject) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [selectedProject, setSelectedProject]);

  if (!selectedProject) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-aau-blue text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{stripHtml(selectedProject.title)}</h2>
            <p className="text-sm text-gray-200 mt-1">
              {selectedProject.year} • {selectedProject.educationProgram.name}
            </p>
          </div>
          <button
            onClick={() => setSelectedProject(null)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedProject.abstract && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Abstract</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{stripHtml(selectedProject.abstract)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Authors</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {selectedProject.authors.map((author, i) => (
                  <li key={i}>{author.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Supervisors</h3>
              <ul className="text-sm space-y-1">
                {selectedProject.supervisors.map((supervisor, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {supervisor.isActive === false ? (
                      // Not currently employed - show name only
                      <span className="text-gray-600">{supervisor.name}</span>
                    ) : (
                      // Currently employed or status unknown - show link
                      <a
                        href={supervisor.vbnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aau-blue hover:text-aau-light-blue"
                      >
                        {supervisor.name}
                      </a>
                    )}
                    {supervisor.isActive === false && (
                      <span className="text-xs text-gray-400" title="Former employee - profile may be unavailable">
                        (former employee)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">External Collaborations</h3>
            <div className="space-y-3">
              {selectedProject.collaborations.map((collab, i) => (
                <div key={i} className="border-l-4 border-aau-light-blue pl-3">
                  <div className="font-medium text-sm">{collab.name}</div>
                  <div className="text-xs text-gray-600">
                    {collab.type}
                    {collab.location && (
                      <>
                        {' '}• {collab.location.city ? `${collab.location.city}, ` : ''}
                        {collab.location.country}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProject.campus && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Campus</h3>
              <p className="text-sm text-gray-600">{selectedProject.campus}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <a
            href={selectedProject.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-aau-blue text-white rounded-md hover:bg-aau-light-blue transition-colors font-medium"
          >
            View Full Project
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
