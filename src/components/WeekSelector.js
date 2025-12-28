import React from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';
import './WeekSelector.css';

function WeekSelector() {
  const { selectedWeek, setSelectedWeek } = useFilters();
  const { index } = useGameData();

  if (!index) return null;

  const maxWeek = index.weeks.length || 18;
  const weekInfo = index.weeks.find(w => w.number === selectedWeek);

  const handlePrevious = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNext = () => {
    if (selectedWeek < maxWeek) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  return (
    <div className="week-selector">
      <button
        onClick={handlePrevious}
        disabled={selectedWeek === 1}
        className="week-nav-btn"
        aria-label="Previous week"
      >
        ◄
      </button>

      <div className="week-info">
        <strong>Week {selectedWeek}</strong>
        {weekInfo && (
          <div className="week-date">{new Date(weekInfo.startDate).toLocaleDateString()}</div>
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={selectedWeek === maxWeek}
        className="week-nav-btn"
        aria-label="Next week"
      >
        ►
      </button>
    </div>
  );
}

export default WeekSelector;
