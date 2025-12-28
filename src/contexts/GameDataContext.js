import React, { createContext, useState, useContext, useEffect } from 'react';

const GameDataContext = createContext();

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
};

export const GameDataProvider = ({ children }) => {
  const [index, setIndex] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the index.json file on mount
  useEffect(() => {
    const loadIndex = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/index.json');
        if (!response.ok) {
          throw new Error(`Failed to load index.json: ${response.statusText}`);
        }
        const data = await response.json();
        setIndex(data);
        setError(null);
      } catch (err) {
        console.error('Error loading index.json:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadIndex();
  }, []);

  // Load specific week data
  const loadWeekData = async (year, week) => {
    if (!index) {
      console.warn('Index not loaded yet');
      return null;
    }

    try {
      setLoading(true);
      const weekEntry = index.weeks?.find(
        w => w.year === year && w.week === week
      );

      if (!weekEntry) {
        throw new Error(`No data found for ${year} Week ${week}`);
      }

      const response = await fetch(weekEntry.path);
      if (!response.ok) {
        throw new Error(`Failed to load week data: ${response.statusText}`);
      }

      const data = await response.json();
      setWeekData(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error loading week data:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    index,
    weekData,
    loading,
    error,
    loadWeekData,
  };

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
};
