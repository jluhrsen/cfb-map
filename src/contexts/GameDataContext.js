import React, { createContext, useState, useContext, useEffect } from 'react';

const GameDataContext = createContext();

export function useGameData() {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within GameDataProvider');
  }
  return context;
}

export function GameDataProvider({ children }) {
  const [index, setIndex] = useState(null);
  const [weekData, setWeekData] = useState({});
  const [loading, setLoading] = useState(true);

  // Load index on mount
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/index.json`)
      .then(res => res.json())
      .then(data => {
        setIndex(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading index:', error);
        setLoading(false);
      });
  }, []);

  /**
   * Load games for specific week and divisions
   * @param {number} year - Season year
   * @param {number} week - Week number
   * @param {Array<string>} divisions - Divisions to load
   */
  const loadWeekData = async (year, week, divisions) => {
    const key = `${year}-${week}`;
    if (weekData[key]) {
      return weekData[key];
    }

    const promises = divisions.map(division =>
      fetch(`${process.env.PUBLIC_URL}/data/${year}/${division}/week-${week}.json`)
        .then(res => {
          if (!res.ok) return [];
          return res.json();
        })
        .catch(() => [])
    );

    const results = await Promise.all(promises);
    const allGames = results.flat();

    setWeekData(prev => ({ ...prev, [key]: allGames }));
    return allGames;
  };

  return (
    <GameDataContext.Provider value={{ index, weekData, loading, loadWeekData }}>
      {children}
    </GameDataContext.Provider>
  );
}
