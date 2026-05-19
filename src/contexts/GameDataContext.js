import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

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
  const weekDataRef = useRef({});
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
  const loadWeekData = useCallback(async (year, week, divisions) => {
    const sortedDivisions = [...divisions].sort();
    const key = `${year}-${week}-${sortedDivisions.join(',')}`;
    if (weekDataRef.current[key]) {
      return weekDataRef.current[key];
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
    const gamesById = new Map();
    results.flat().forEach(game => {
      gamesById.set(game.id, game);
    });
    const allGames = Array.from(gamesById.values());

    weekDataRef.current = { ...weekDataRef.current, [key]: allGames };
    setWeekData(weekDataRef.current);
    return allGames;
  }, []);

  return (
    <GameDataContext.Provider value={{ index, weekData, loading, loadWeekData }}>
      {children}
    </GameDataContext.Provider>
  );
}
