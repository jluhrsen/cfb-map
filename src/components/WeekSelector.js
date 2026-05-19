import React from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';
import './WeekSelector.css';

function WeekSelector() {
  const { selectedWeek, setSelectedWeek, selectedYear } = useFilters();
  const { index } = useGameData();

  if (!index || !index.weeksByYear) return null;

  const weeks = index.weeksByYear[selectedYear] || [];
  const maxWeek = weeks.length || 18;
  const weekInfo = weeks.find(w => w.number === selectedWeek);
  const nextWeek = weeks.find(w => w.number > selectedWeek);
  const weekDateLabel = weekInfo
    ? formatWeekDateRange(weekInfo.startDate, nextWeek?.startDate)
    : null;

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
        {weekDateLabel && (
          <div className="week-date">{weekDateLabel}</div>
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

function formatWeekDateRange(startDateStr, nextStartDateStr) {
  const start = parseDate(startDateStr);
  const end = nextStartDateStr ? parseDate(nextStartDateStr) : addDays(start, 7);
  end.setDate(end.getDate() - 1);

  const startLabel = start.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default WeekSelector;
