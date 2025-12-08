'use client';

import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
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
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden mr-3 p-2 rounded-md hover:bg-aau-light-blue transition-colors"
              aria-label="Open filters menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* AAU Logo */}
            <a
              href="https://en.aau.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-4 hover:opacity-80 transition-opacity hidden sm:block"
            >
              <img
                src="https://homes.aub.aau.dk/sv/themes/images/AAU_WHITE_UK.png"
                alt="AAU Logo"
                className="h-10 lg:h-12"
              />
            </a>

            <div className="flex-1">
              <h1 className="text-lg lg:text-2xl font-bold">AAU Student Project Collaboration Explorer</h1>
              <p className="text-xs lg:text-sm text-gray-300 mt-1 hidden sm:block">
                Exploring external collaborations in Aalborg University thesis projects
              </p>
              {metadata && (
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <p className="text-xs text-gray-400">
                    Last updated: {formatDate(metadata.lastUpdated)}
                  </p>
                  <button
                    onClick={() => setShowDisclaimer(true)}
                    className="text-xs text-gray-300 hover:text-white underline"
                  >
                    About this data
                  </button>
                  <a
                    href="https://vbn.aau.dk/themes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-white text-aau-blue px-3 py-1 rounded-md hover:bg-gray-100 transition-colors font-medium"
                  >
                    Explore other Themes
                  </a>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-xl lg:text-3xl font-bold">{filteredProjects.length.toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-gray-300">
                {filteredProjects.length === projects.length
                  ? 'Total'
                  : `of ${projects.length.toLocaleString()}`}
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
This portal presents selected student thesis projects from Aalborg University (AAU). The data is retrieved from the Pure system and includes information on external collaboration partners, supervisors, and key project metadata.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Coverage</h3>
                <p className="text-sm text-gray-600">
                  The dataset includes only thesis projects in Pure that have been marked by students as having external collaboration. As a result, not all AAU thesis projects are represented: only non-confidential projects with registered collaboration partners are included. Furthermore, the portal covers master’s theses, professional bachelor projects, and further education (EVU) master’s projects. Semester projects and bachelor projects are thus not included.
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
                  <li>Supervisor links will be inactive if the person is no longer employed at AAU</li>
                  <li>Project types and education programs reflect Pure system classifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Updates</h3>
                <p className="text-sm text-gray-600">
                  The data is updated daily. The last update date is shown in the header.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Privacy & Usage</h3>
                <p className="text-sm text-gray-600">
                  The projects displayed in this portal are publicly available through{' '}
                  <a
                    href="https://projekter.aau.dk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aau-blue hover:text-aau-light-blue underline"
                  >
                    AAU Student Projects
                  </a>
                  . To explore the full range of student projects from Aalborg University you should visit AAU Student Projects. This tool is
                  intended for informational purposes to explore patterns in AAU student-societal
                  collaborations. For questions, corrections, or takedown requests, please contact:{' '}
                  <a
                    href="mailto:vbn@aub.aau.dk"
                    className="text-aau-blue hover:text-aau-light-blue underline"
                  >
                    vbn@aub.aau.dk
                  </a>
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
