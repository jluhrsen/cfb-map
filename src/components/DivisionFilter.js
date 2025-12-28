import React from 'react';
import { useFilters } from '../contexts/FilterContext';
import './DivisionFilter.css';

const DIVISIONS = [
  { id: 'fbs', label: 'FBS' },
  { id: 'fcs', label: 'FCS' },
  { id: 'd2', label: 'D2' },
  { id: 'd3', label: 'D3' },
  { id: 'nfl', label: 'NFL' }
];

function DivisionFilter() {
  const { selectedDivisions, toggleDivision } = useFilters();

  return (
    <div className="division-filter">
      <span className="filter-label">Show:</span>
      {DIVISIONS.map(division => (
        <label key={division.id} className="division-checkbox">
          <input
            type="checkbox"
            checked={selectedDivisions.includes(division.id)}
            onChange={() => toggleDivision(division.id)}
          />
          <span>{division.label}</span>
        </label>
      ))}
    </div>
  );
}

export default DivisionFilter;
