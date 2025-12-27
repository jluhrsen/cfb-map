import React, { createContext, useState, useContext, useEffect } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

// Helper functions for localStorage
const getStoredValue = (key, defaultValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStoredValue = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};

export const FilterProvider = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [selectedTeams, setSelectedTeams] = useState(() =>
    getStoredValue('selectedTeams', [])
  );
  const [selectedDivisions, setSelectedDivisions] = useState(() =>
    getStoredValue('selectedDivisions', [])
  );
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getStoredValue('selectedWeek', 1)
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    getStoredValue('selectedYear', new Date().getFullYear())
  );

  // Persist selectedTeams to localStorage
  useEffect(() => {
    setStoredValue('selectedTeams', selectedTeams);
  }, [selectedTeams]);

  // Persist selectedDivisions to localStorage
  useEffect(() => {
    setStoredValue('selectedDivisions', selectedDivisions);
  }, [selectedDivisions]);

  // Persist selectedWeek to localStorage
  useEffect(() => {
    setStoredValue('selectedWeek', selectedWeek);
  }, [selectedWeek]);

  // Persist selectedYear to localStorage
  useEffect(() => {
    setStoredValue('selectedYear', selectedYear);
  }, [selectedYear]);

  // Helper functions for managing filters
  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  const toggleDivision = (division) => {
    setSelectedDivisions(prev =>
      prev.includes(division)
        ? prev.filter(d => d !== division)
        : [...prev, division]
    );
  };

  const clearAllFilters = () => {
    setSelectedTeams([]);
    setSelectedDivisions([]);
  };

  const value = {
    selectedTeams,
    setSelectedTeams,
    selectedDivisions,
    setSelectedDivisions,
    selectedWeek,
    setSelectedWeek,
    selectedYear,
    setSelectedYear,
    toggleTeam,
    toggleDivision,
    clearAllFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
