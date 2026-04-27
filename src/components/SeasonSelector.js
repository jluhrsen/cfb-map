import React from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';
import './SeasonSelector.css';

function SeasonSelector() {
  const { selectedYear, setSelectedYear, setSelectedWeek } = useFilters();
  const { index } = useGameData();

  if (!index || !index.availableSeasons) return null;

  const handleSeasonChange = (e) => {
    setSelectedYear(Number(e.target.value));
    // Reset to week 1 when changing seasons
    setSelectedWeek(1);
  };

  return (
    <div className="season-selector">
      <label htmlFor="season-select">Season:</label>
      <select
        id="season-select"
        value={selectedYear}
        onChange={handleSeasonChange}
        className="season-select"
      >
        {index.availableSeasons.map(season => (
          <option key={season} value={season}>
            {season}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SeasonSelector;
