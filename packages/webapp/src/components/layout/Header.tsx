'use client';

import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';

export default function Header() {
  const { projects, getFilteredProjects, metadata } = useAppStore();
  const filteredProjects = getFilteredProjects();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <header className="bg-aau-blue text-white shadow-lg z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">AAU Student Project Collaboration Explorer</h1>
              <p className="text-sm text-gray-300 mt-1">
                Exploring external collaborations in Aalborg University thesis projects
              </p>
              {metadata && (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-gray-400">
                    Last updated: {formatDate(metadata.lastUpdated)}
                  </p>
                  <button
                    onClick={() => setShowDisclaimer(true)}
                    className="text-xs text-gray-300 hover:text-white underline"
                  >
                    About this data
                  </button>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold">{filteredProjects.length.toLocaleString()}</p>
              <p className="text-sm text-gray-300">
                {filteredProjects.length === projects.length
                  ? 'Total Projects'
                  : `of ${projects.length.toLocaleString()} Projects`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10001]"
          onClick={() => setShowDisclaimer(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-aau-blue text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">About This Data</h2>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Source</h3>
                <p className="text-sm text-gray-600">
                  This portal displays student thesis projects from Aalborg University (AAU) that have been published
                  in the AAU VBN (Viden om Aalborg) portal. The data is extracted from the Pure API and includes
                  information about external collaborations, supervisors, and project metadata.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Coverage</h3>
                <p className="text-sm text-gray-600">
                  The data includes thesis projects where external collaboration information is available in the VBN
                  system. Not all AAU thesis projects are included - only those that have been registered with
                  collaboration partners in the Pure system.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Geolocation Data</h3>
                <p className="text-sm text-gray-600">
                  Geographic coordinates are obtained through geocoding of organization names and locations. The
                  accuracy of these coordinates may vary, and some projects may not have geographic information
                  available. Coordinates are automatically generated and may not always reflect the exact location
                  of the collaboration.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Quality & Limitations</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Data is extracted from AAU's Pure system and may contain inconsistencies</li>
                  <li>Some collaborations may not have complete location information</li>
                  <li>Organization names and types are as registered in the Pure system</li>
                  <li>Abstracts and titles may contain HTML formatting that has been stripped for display</li>
                  <li>Supervisor links may be inactive if the person is no longer employed at AAU</li>
                  <li>Project types and education programs reflect Pure system classifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Updates</h3>
                <p className="text-sm text-gray-600">
                  The data is periodically updated from the AAU VBN portal. The last update date is shown in the
                  header. New projects and changes to existing projects may not be immediately reflected.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Privacy & Usage</h3>
                <p className="text-sm text-gray-600">
                  All data displayed in this portal is publicly available through AAU's VBN portal. This tool is
                  intended for research and informational purposes to explore patterns in AAU student-industry
                  collaborations.
                </p>
              </div>

              {metadata && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Version:</strong> {metadata.version} | <strong>Last Updated:</strong> {formatDate(metadata.lastUpdated)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="w-full px-4 py-2 bg-aau-blue text-white rounded-md hover:bg-aau-light-blue transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
