import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import React, { useState, useEffect } from 'react';
import { useFilters } from './contexts/FilterContext';
import { useGameData } from './contexts/GameDataContext';
import TeamSelector from './components/TeamSelector';
import WeekSelector from './components/WeekSelector';
import DivisionFilter from './components/DivisionFilter';

const defaultLogo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpZ1-dHcxFDeEw9c96sfI6kKv03hMN1L_TRw&s";

function App() {
  const { selectedTeams, selectedDivisions, selectedWeek, selectedYear } = useFilters();
  const { loadWeekData, loading } = useGameData();
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Load games when filters change
  useEffect(() => {
    if (selectedDivisions.length === 0) {
      setGames([]);
      return;
    }

    setLoadingGames(true);
    loadWeekData(selectedYear, selectedWeek, selectedDivisions)
      .then(weekGames => {
        // Filter to only selected teams
        const filtered = weekGames.filter(game =>
          selectedTeams.includes(game.home) || selectedTeams.includes(game.away)
        );
        setGames(filtered);
        setLoadingGames(false);
      })
      .catch(error => {
        console.error('Error loading games:', error);
        setLoadingGames(false);
      });
  }, [selectedTeams, selectedDivisions, selectedWeek, selectedYear, loadWeekData]);

  if (loading) {
    return (
      <div className="App">
        <h1>Football Game Map</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🏈 Football Game Map</h1>
      </header>

      <div className="controls">
        <WeekSelector />
        <TeamSelector />
        <DivisionFilter />
      </div>

      {selectedTeams.length === 0 && (
        <div className="empty-state">
          Search and add teams above to see their games
        </div>
      )}

      {selectedTeams.length > 0 && games.length === 0 && !loadingGames && (
        <div className="empty-state">
          No games for selected teams in Week {selectedWeek}
        </div>
      )}

      <MapContainer
        center={[38.5816, -121.4944]} // Sacramento, CA
        zoom={6.5}
        scrollWheelZoom={true}
        zoomSnap={0.15}
        zoomDelta={0.15}
        style={{ height: "calc(100vh - 200px)", width: "100%" }}
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

export default App;
