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

          {selectedProject.keywords && selectedProject.keywords.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProject.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
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
                    {supervisor.vbnUrl ? (
                      // Active employee - show VBN link
                      <a
                        href={supervisor.vbnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aau-blue hover:text-aau-light-blue"
                      >
                        {supervisor.name}
                      </a>
                    ) : (
                      // Not active or no VBN profile - show name only
                      <span className="text-gray-600">{supervisor.name}</span>
                    )}
                    {supervisor.orcid && (
                      <a
                        href={`https://orcid.org/${supervisor.orcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`ORCID: ${supervisor.orcid}`}
                        className="inline-flex items-center"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 256 256"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z"
                            fill="#A6CE39"
                          />
                          <path
                            d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 111.2 178 93 148 93h-23.7v79.4zM71.3 54.8c0 5.2-4.2 9.4-9.4 9.4s-9.4-4.2-9.4-9.4 4.2-9.4 9.4-9.4 9.4 4.2 9.4 9.4z"
                            fill="#fff"
                          />
                        </svg>
                      </a>
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
