    import { MapContainer, TileLayer } from 'react-leaflet';
    import 'leaflet/dist/leaflet.css';
    import './App.css';
    import { useMapEvents } from 'react-leaflet';
    import { Marker, Popup, Tooltip } from 'react-leaflet';
    import L from 'leaflet';
    import React, { useState } from 'react';
    import { LOGOS } from './data/logos';
    import * as scheduleExports from './schedules';

    export const games = Object.values(scheduleExports).flat();

    const trackedTeams = Object.keys(scheduleExports).map(key =>
        key.replace('_GAMES', '').replace(/_/g, ' ')
    );


    function App() {
        const [selectedWeek, setSelectedWeek] = useState(1);
        const firstGameSaturday = new Date(2025, 7, 30); // Aug 30
        const selectedDateString = getDateForWeek(firstGameSaturday, selectedWeek);
        const defaultLogo = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpZ1-dHcxFDeEw9c96sfI6kKv03hMN1L_TRw&s";
        const teamSet = new Set();
        games.forEach(game => {
            teamSet.add(game.home);
            teamSet.add(game.away);
        });
        const byeTeams = getByeTeams(trackedTeams, games, selectedWeek);

        return (
            <div className="App">
                <h1>College Football Map</h1>
                <div style={{ margin: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>
                    <div>
                        <label htmlFor="week-select"><strong>Select Week:</strong>{' '}</label>
                        <select
                            id="week-select"
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        >
                            {[...Array(15)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                            ))}
                        </select>
                        <div style={{ marginTop: "0.25rem", fontStyle: "italic", fontSize: "0.9rem" }}>
                            {selectedDateString}
                        </div>
                    </div>

                    {byeTeams.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                            {byeTeams.map((team) => (
                                <div key={team} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <img src={LOGOS[team]} alt={team} style={{ width: 30, height: 30 }} />
                                    <strong>{team}: BYE</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <MapContainer
                    center={[41.4179, -118.8771]}
                    zoom={5.7}
                    scrollWheelZoom={true}
                    zoomSnap={0.15}
                    zoomDelta={0.15}
                    style={{ height: "90vh", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {games
                        .filter(
                            game =>
                                game.week === selectedWeek &&
                                (trackedTeams.includes(game.home) || trackedTeams.includes(game.away))
                        )
                        .map((game, idx) => {
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
                                <React.Fragment key={idx}>
                                    <Marker
                                        position={[
                                            game.location.lat + offsetLat,
                                            game.location.lng - offsetLng
                                        ]}
                                        icon={homeIcon}
                                    >
                                        <Popup>
                                            <strong>{game.home}</strong><br />
                                            Home<br />
                                            📅 {game.day}, {game.date}<br />
                                            📍 {game.location.venue}<br />
                                            Kickoff: {game.kickoff}
                                        </Popup>
                                    </Marker>

                                    <Marker
                                        position={[
                                            game.location.lat - offsetLat,
                                            game.location.lng + offsetLng
                                        ]}
                                        icon={awayIcon}
                                    >
                                        <Popup>
                                            <strong>{game.away}</strong><br />
                                            Away<br />
                                            📅 {game.day}, {game.date}<br />
                                            📍 {game.location.venue}<br />
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

    function MapLogger() {
        useMapEvents({
            moveend: (e) => {
                const map = e.target;
                const center = map.getCenter();
                const zoom = map.getZoom();
                console.log(`Center: [${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}], Zoom: ${zoom}`);
            }
        });
        return null;
    }

    function getByeTeams(trackedTeams, games, selectedWeek) {
        const teamsWithGames = new Set();

        games
            .filter(game => game.week === selectedWeek)
            .forEach(game => {
                teamsWithGames.add(game.home);
                teamsWithGames.add(game.away);
            });

        return trackedTeams.filter(team => !teamsWithGames.has(team));
    }

    function getDateForWeek(startDate, week) {
        const date = new Date(startDate); // clone to avoid mutating original
        date.setDate(date.getDate() + (week - 1) * 7);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    function formatGameLabel(game) {
        const [year, month, day] = game.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
        const datePart = date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });

        let timePart = "TBD";
        if (game.kickoff !== "0h") {
            const hour = parseInt(game.kickoff.replace('h', ''), 10);
            const dateForTime = new Date();
            dateForTime.setHours(hour);
            timePart = dateForTime.toLocaleTimeString(undefined, {
                hour: 'numeric',
                hour12: true,
            }).toLowerCase(); // e.g., "1 pm"
        }

        return `${weekday} ${datePart} ${timePart}`;
    }

    export default App;
