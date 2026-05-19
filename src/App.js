import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFilters } from './contexts/FilterContext';
import { useGameData } from './contexts/GameDataContext';
import TeamSelector from './components/TeamSelector';
import WeekSelector from './components/WeekSelector';
import DivisionFilter from './components/DivisionFilter';
import SeasonSelector from './components/SeasonSelector';

const defaultLogo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpZ1-dHcxFDeEw9c96sfI6kKv03hMN1L_TRw&s";

function App() {
  const {
    selectedTeams,
    selectedDivisions,
    selectedWeek,
    selectedYear,
    setSelectedWeek,
    setSelectedYear
  } = useFilters();
  const { index, loadWeekData, loading } = useGameData();
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const lastAutoLocatedTeams = useRef('');

  const loadWeekWindowData = useCallback(async (year, weekNumber, divisions) => {
    const nonNFLDivisions = divisions.filter(division => division !== 'nfl');
    const requests = [];

    if (nonNFLDivisions.length > 0) {
      requests.push(loadWeekData(year, weekNumber, nonNFLDivisions));
    }

    if (divisions.includes('nfl')) {
      getNFLWeekNumbers(index, year).forEach(nflWeek => {
        requests.push(loadWeekData(year, nflWeek, ['nfl']));
      });
    }

    const results = await Promise.all(requests);

    const gamesById = new Map();
    results.flat().forEach(game => {
      gamesById.set(game.id, game);
    });

    return Array.from(gamesById.values());
  }, [index, loadWeekData]);

  // Load games when filters change
  useEffect(() => {
    if (selectedDivisions.length === 0) {
      setGames([]);
      return;
    }

    setLoadingGames(true);
    loadWeekWindowData(selectedYear, selectedWeek, selectedDivisions)
      .then(weekGames => {
        const selectedWindow = getSelectedWeekWindow(index, selectedYear, selectedWeek);
        // Filter to only selected teams
        const filtered = weekGames.filter(game =>
          (selectedTeams.includes(game.home) || selectedTeams.includes(game.away)) &&
          isGameInWindow(game, selectedWindow)
        );
        setGames(filtered);
        setLoadingGames(false);
      })
      .catch(error => {
        console.error('Error loading games:', error);
        setLoadingGames(false);
      });
  }, [index, selectedTeams, selectedDivisions, selectedWeek, selectedYear, loadWeekWindowData]);

  // When a new team is selected, move to the first available game instead of
  // leaving the map on an empty default week/year.
  useEffect(() => {
    if (!index || selectedTeams.length === 0) {
      lastAutoLocatedTeams.current = '';
      return;
    }

    const teamsKey = selectedTeams.slice().sort().join('|');
    if (teamsKey === lastAutoLocatedTeams.current) {
      return;
    }

    lastAutoLocatedTeams.current = teamsKey;
    let cancelled = false;

    const findAvailableGame = async () => {
      const divisionsToSearch = index.divisions || selectedDivisions;
      const years = [
        selectedYear,
        ...(index.availableSeasons || [])
          .filter(year => year !== selectedYear)
          .sort((a, b) => b - a)
      ];

      for (const year of years) {
        const weeks = index.weeksByYear?.[year] || [];
        const orderedWeeks = [...weeks].sort((a, b) => a.number - b.number);

        for (const week of orderedWeeks) {
          const weekGames = await loadWeekWindowData(year, week.number, divisionsToSearch);
          const selectedWindow = getSelectedWeekWindow(index, year, week.number);
          const matchingGame = weekGames.find(game =>
            (selectedTeams.includes(game.home) || selectedTeams.includes(game.away)) &&
            isGameInWindow(game, selectedWindow)
          );

          if (matchingGame && !cancelled) {
            if (year !== selectedYear) {
              setSelectedYear(year);
            }
            if (week.number !== selectedWeek) {
              setSelectedWeek(week.number);
            }
            return;
          }
        }
      }
    };

    findAvailableGame();

    return () => {
      cancelled = true;
    };
  }, [
    index,
    selectedTeams,
    selectedDivisions,
    selectedWeek,
    selectedYear,
    loadWeekWindowData,
    setSelectedWeek,
    setSelectedYear
  ]);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading football game map...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <aside className="sidebar" aria-label="Map controls">
        <header className="app-header">
          <h1>Football Game Map</h1>
          <div className="game-count">
            {selectedTeams.length === 0
              ? 'Choose teams to map games'
              : `${games.length} game${games.length === 1 ? '' : 's'} this week`}
          </div>
        </header>

        <section className="control-section">
          <h2>Schedule</h2>
          <SeasonSelector />
          <WeekSelector />
        </section>

        <section className="control-section control-section-teams">
          <h2>Teams</h2>
          <TeamSelector />
        </section>

        <section className="control-section">
          <h2>Leagues</h2>
          <DivisionFilter />
        </section>
      </aside>

      <main className="map-panel">
        {selectedTeams.length === 0 && (
          <div className="empty-state map-message">
            Search and add teams to see their games
          </div>
        )}

        {selectedTeams.length > 0 && games.length === 0 && !loadingGames && (
          <div className="empty-state map-message">
            No games for selected teams in Week {selectedWeek}
          </div>
        )}

        <MapContainer
          center={[38.5816, -121.4944]} // Sacramento, CA
          zoom={6.5}
          scrollWheelZoom={true}
          zoomSnap={0.15}
          zoomDelta={0.15}
          className="map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {games.map((game, idx) => {
            const offsetLat = 0.0;
            const offsetLng = 0.5;

            const homeIcon = L.icon({
              iconUrl: game.homeLogo || defaultLogo,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            });

            const awayIcon = L.icon({
              iconUrl: game.awayLogo || defaultLogo,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            });

            return (
              <React.Fragment key={game.id || idx}>
                <Marker
                  position={[
                    game.venue.lat + offsetLat,
                    game.venue.lng - offsetLng
                  ]}
                  icon={homeIcon}
                >
                  <Popup>
                    <strong>{game.home}</strong><br />
                    Home<br />
                    📅 {game.day}, {game.date}<br />
                    📍 {game.venue.name}<br />
                    Kickoff: {game.kickoff}
                  </Popup>
                </Marker>

                <Marker
                  position={[
                    game.venue.lat - offsetLat,
                    game.venue.lng + offsetLng
                  ]}
                  icon={awayIcon}
                >
                  <Popup>
                    <strong>{game.away}</strong><br />
                    Away<br />
                    📅 {game.day}, {game.date}<br />
                    📍 {game.venue.name}<br />
                    Kickoff: {game.kickoff}
                  </Popup>
                  <Tooltip direction="right" offset={[20, 0]} permanent>
                    {formatGameLabel(game)}
                  </Tooltip>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </main>
    </div>
  );
}

function formatGameLabel(game) {
  const [year, month, day] = game.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const datePart = date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

  let timePart = "TBD";
  if (game.kickoff !== "0h" && game.kickoff !== "TBD") {
    const kickoff = game.kickoff.trim();

    let match = kickoff.match(/^(\d{1,2})(?::(\d{2}))?(a|p)$/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minutes = parseInt(match[2] || "0", 10);
      const isPM = match[3].toLowerCase() === "p";
      if (hour === 12) hour = isPM ? 12 : 0;
      else if (isPM) hour += 12;

      const dateForTime = new Date();
      dateForTime.setHours(hour, minutes);
      timePart = dateForTime.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    }

    else if (/^\d{1,2}:\d{2}$/.test(kickoff)) {
      const [hourStr, minStr] = kickoff.split(':');
      const hour = parseInt(hourStr, 10);
      const minutes = parseInt(minStr, 10);
      const dateForTime = new Date();
      dateForTime.setHours(hour, minutes);
      timePart = dateForTime.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    }
  }

  return `${weekday} ${datePart} ${timePart}`;
}

function getSelectedWeekWindow(index, year, weekNumber) {
  const weeks = index?.weeksByYear?.[year] || [];
  const sortedWeeks = [...weeks].sort((a, b) => a.number - b.number);
  const currentWeek = sortedWeeks.find(week => week.number === weekNumber);

  if (!currentWeek) {
    return null;
  }

  const nextWeek = sortedWeeks.find(week => week.number > weekNumber);
  const start = parseDate(currentWeek.startDate);
  const end = nextWeek
    ? parseDate(nextWeek.startDate)
    : addDays(start, 7);

  return { start, end };
}

function isGameInWindow(game, selectedWindow) {
  if (!selectedWindow) {
    return true;
  }

  const gameDate = parseDate(game.date);
  return gameDate >= selectedWindow.start && gameDate < selectedWindow.end;
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

function getNFLWeekNumbers(index, year) {
  const weeks = index?.weeksByYear?.[year] || [];
  const weekNumbers = weeks.map(week => week.number);
  const maxWeek = Math.max(18, ...weekNumbers);
  return Array.from({ length: maxWeek }, (_, idx) => idx + 1);
}

export default App;
