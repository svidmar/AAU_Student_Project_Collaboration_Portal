'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';

export default function YearFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const minYear = metadata.filters.years.min;
  const maxYear = metadata.filters.years.max;

  // Local state for slider values
  const [rangeMin, setRangeMin] = useState(minYear);
  const [rangeMax, setRangeMax] = useState(maxYear);

  // Sync with global filters
  useEffect(() => {
    if (filters.years.length === 0) {
      setRangeMin(minYear);
      setRangeMax(maxYear);
    }
  }, [filters.years, minYear, maxYear]);

  const handleRangeChange = () => {
    // Generate array of years in range
    if (rangeMin === minYear && rangeMax === maxYear) {
      // No filter applied
      setFilters({ years: [] });
    } else {
      const yearsInRange = [];
      for (let year = rangeMin; year <= rangeMax; year++) {
        yearsInRange.push(year);
      }
      setFilters({ years: yearsInRange });
    }
  };

  const clearFilter = () => {
    setRangeMin(minYear);
    setRangeMax(maxYear);
    setFilters({ years: [] });
  };

  const isFiltered = rangeMin !== minYear || rangeMax !== maxYear;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Year Range</label>
        {isFiltered && (
          <button
            onClick={clearFilter}
            className="text-xs text-aau-light-blue hover:text-aau-blue"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Display selected range */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">{rangeMin}</span>
          <span className="text-gray-500">to</span>
          <span className="font-semibold text-gray-700">{rangeMax}</span>
        </div>

        {/* Min slider */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">From</label>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={rangeMin}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              if (newMin <= rangeMax) {
                setRangeMin(newMin);
              }
            }}
            onMouseUp={handleRangeChange}
            onTouchEnd={handleRangeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #E0E0E0 0%, #E0E0E0 ${((rangeMin - minYear) / (maxYear - minYear)) * 100}%, #00305C ${((rangeMin - minYear) / (maxYear - minYear)) * 100}%, #00305C 100%)`
            }}
          />
        </div>

        {/* Max slider */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">To</label>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={rangeMax}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              if (newMax >= rangeMin) {
                setRangeMax(newMax);
              }
            }}
            onMouseUp={handleRangeChange}
            onTouchEnd={handleRangeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #00305C 0%, #00305C ${((rangeMax - minYear) / (maxYear - minYear)) * 100}%, #E0E0E0 ${((rangeMax - minYear) / (maxYear - minYear)) * 100}%, #E0E0E0 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
