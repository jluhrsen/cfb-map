# Football Map Full Application Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the MVP into a full-fledged application with auto-updating schedules, team search, and comprehensive NCAA + NFL coverage.

**Architecture:** Static site generation with daily GitHub Actions builds. Data fetched from CollegeFootballData.com API and ESPN API, processed into per-week JSON files, and deployed to GitHub Pages.

**Tech Stack:** React 19, Leaflet maps, Node.js build scripts, GitHub Actions, CollegeFootballData.com API, ESPN API

---

## Task 1: Fix Jest Configuration

**Files:**
- Modify: `package.json`

**Step 1: Add Jest transformIgnorePatterns**

Edit `package.json` to add Jest configuration for ESM modules:

```json
"jest": {
  "transformIgnorePatterns": [
    "node_modules/(?!(react-leaflet|@react-leaflet)/)"
  ]
}
```

Add this after the `browserslist` section.

**Step 2: Verify tests run**

Run: `CI=true npm test`
Expected: Tests should run without syntax errors (may still fail on assertions, but no parse errors)

**Step 3: Commit**

```bash
git add package.json
git commit -m "fix: configure Jest for ESM modules in react-leaflet"
```

---

## Task 2: Create Static Venue Database

**Files:**
- Create: `src/data/venues.json`

**Step 1: Create venues data file**

Create initial venue database with major stadiums:

```json
{
  "War Memorial Stadium": {
    "lat": 41.3114,
    "lng": -105.5680,
    "city": "Laramie",
    "state": "WY"
  },
  "Falcon Stadium": {
    "lat": 38.9975,
    "lng": -104.8444,
    "city": "Colorado Springs",
    "state": "CO"
  },
  "Autzen Stadium": {
    "lat": 44.0584,
    "lng": -123.0681,
    "city": "Eugene",
    "state": "OR"
  },
  "Spartan Stadium": {
    "lat": 37.3975,
    "lng": -121.8635,
    "city": "San Jose",
    "state": "CA"
  },
  "Canvas Stadium": {
    "lat": 40.5749,
    "lng": -105.0896,
    "city": "Fort Collins",
    "state": "CO"
  },
  "McCulloch Stadium": {
    "lat": 44.9388,
    "lng": -123.0355,
    "city": "Salem",
    "state": "OR"
  },
  "Allegiant Stadium": {
    "lat": 36.0909,
    "lng": -115.1833,
    "city": "Las Vegas",
    "state": "NV"
  }
}
```

**Step 2: Commit**

```bash
git add src/data/venues.json
git commit -m "feat: add initial venue database with coordinates"
```

---

## Task 3: Create Team Logo Overrides File

**Files:**
- Create: `src/data/team-logos.json`

**Step 1: Create logo overrides file**

Create empty overrides file for manual logo additions:

```json
{}
```

**Step 2: Commit**

```bash
git add src/data/team-logos.json
git commit -m "feat: add team logo overrides file"
```

---

## Task 4: Create Scripts Directory Structure

**Files:**
- Create: `scripts/fetch-ncaa-data.js`
- Create: `scripts/fetch-nfl-data.js`
- Create: `scripts/generate-data-files.js`
- Create: `scripts/utils/api-client.js`

**Step 1: Create scripts directory**

Run: `mkdir -p scripts/utils`

**Step 2: Create API client utility**

File: `scripts/utils/api-client.js`

```javascript
const https = require('https');

/**
 * Make an HTTPS GET request
 * @param {string} url - Full URL to fetch
 * @param {Object} headers - Optional headers
 * @returns {Promise<Object>} Parsed JSON response
 */
async function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchJSON, sleep };
```

**Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add API client utilities for build scripts"
```

---

## Task 5: Implement NCAA Data Fetcher

**Files:**
- Create: `scripts/fetch-ncaa-data.js`

**Step 1: Write NCAA data fetcher**

File: `scripts/fetch-ncaa-data.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { fetchJSON, sleep } = require('./utils/api-client');

const API_BASE = 'https://api.collegefootballdata.com';
const API_KEY = process.env.CFBD_API_KEY;

const DIVISIONS = ['fbs', 'fcs', 'd2', 'd3'];

/**
 * Fetch games for a specific year and division
 * @param {number} year - Season year
 * @param {string} division - Division (fbs, fcs, d2, d3)
 * @returns {Promise<Array>} Array of games
 */
async function fetchGamesForDivision(year, division) {
  const url = `${API_BASE}/games?year=${year}&division=${division}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  };

  console.log(`Fetching ${division.toUpperCase()} games for ${year}...`);

  try {
    const games = await fetchJSON(url, headers);
    console.log(`  Found ${games.length} games`);
    return games.map(game => ({
      ...game,
      division
    }));
  } catch (error) {
    console.error(`  Error fetching ${division}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch all NCAA games for given years
 * @param {Array<number>} years - Years to fetch
 * @returns {Promise<Object>} Object with year keys and game arrays
 */
async function fetchNCAAData(years) {
  if (!API_KEY) {
    throw new Error('CFBD_API_KEY environment variable not set');
  }

  const allData = {};

  for (const year of years) {
    console.log(`\nFetching NCAA data for ${year}...`);
    allData[year] = [];

    for (const division of DIVISIONS) {
      const games = await fetchGamesForDivision(year, division);
      allData[year].push(...games);

      // Rate limiting: pause between divisions
      await sleep(2000);
    }

    console.log(`Total games for ${year}: ${allData[year].length}`);
  }

  return allData;
}

/**
 * Save NCAA data to file
 * @param {Object} data - NCAA data object
 * @param {string} outputPath - Path to save file
 */
async function saveNCAAData(data, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nSaved NCAA data to ${outputPath}`);
}

module.exports = { fetchNCAAData, saveNCAAData };

// CLI usage
if (require.main === module) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  fetchNCAAData(years)
    .then(data => saveNCAAData(data, 'build-data/ncaa-raw.json'))
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
```

**Step 2: Test manually (requires API key)**

Create test API key file:
```bash
echo "your-api-key-here" > .collegefootballdata_api.key
```

Run: `CFBD_API_KEY=$(cat .collegefootballdata_api.key) node scripts/fetch-ncaa-data.js`
Expected: Script fetches data and saves to `build-data/ncaa-raw.json`

**Step 3: Commit**

```bash
git add scripts/fetch-ncaa-data.js
git commit -m "feat: add NCAA data fetcher script"
```

---

## Task 6: Implement NFL Data Fetcher

**Files:**
- Create: `scripts/fetch-nfl-data.js`

**Step 1: Write NFL data fetcher**

File: `scripts/fetch-nfl-data.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { fetchJSON } = require('./utils/api-client');

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

/**
 * Fetch NFL schedule for a specific season
 * @param {number} year - Season year
 * @returns {Promise<Array>} Array of games
 */
async function fetchNFLSeason(year) {
  console.log(`Fetching NFL schedule for ${year}...`);

  const allGames = [];

  // NFL has 18 weeks in regular season
  for (let week = 1; week <= 18; week++) {
    const url = `${ESPN_API_BASE}/scoreboard?seasontype=2&week=${week}&dates=${year}`;

    try {
      const data = await fetchJSON(url);
      const games = data.events || [];

      console.log(`  Week ${week}: ${games.length} games`);

      games.forEach(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

        allGames.push({
          week,
          id: event.id,
          date: event.date,
          name: event.name,
          shortName: event.shortName,
          home_team: homeTeam.team.displayName,
          away_team: awayTeam.team.displayName,
          home_team_logo: homeTeam.team.logo,
          away_team_logo: awayTeam.team.logo,
          venue: competition.venue?.fullName || 'TBD',
          division: 'nfl'
        });
      });
    } catch (error) {
      console.error(`  Error fetching week ${week}: ${error.message}`);
    }
  }

  console.log(`Total NFL games for ${year}: ${allGames.length}`);
  return allGames;
}

/**
 * Fetch NFL data for given years
 * @param {Array<number>} years - Years to fetch
 * @returns {Promise<Object>} Object with year keys and game arrays
 */
async function fetchNFLData(years) {
  const allData = {};

  for (const year of years) {
    allData[year] = await fetchNFLSeason(year);
  }

  return allData;
}

/**
 * Save NFL data to file
 * @param {Object} data - NFL data object
 * @param {string} outputPath - Path to save file
 */
async function saveNFLData(data, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nSaved NFL data to ${outputPath}`);
}

module.exports = { fetchNFLData, saveNFLData };

// CLI usage
if (require.main === module) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  fetchNFLData(years)
    .then(data => saveNFLData(data, 'build-data/nfl-raw.json'))
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
```

**Step 2: Test manually**

Run: `node scripts/fetch-nfl-data.js`
Expected: Script fetches data and saves to `build-data/nfl-raw.json`

**Step 3: Commit**

```bash
git add scripts/fetch-nfl-data.js
git commit -m "feat: add NFL data fetcher script"
```

---

## Task 7: Implement Data File Generator

**Files:**
- Create: `scripts/generate-data-files.js`

**Step 1: Write data file generator**

File: `scripts/generate-data-files.js`

```javascript
const fs = require('fs').promises;
const path = require('path');

const VENUES = require('../src/data/venues.json');
const LOGO_OVERRIDES = require('../src/data/team-logos.json');

/**
 * Calculate week number from date and season start
 * @param {string} dateStr - ISO date string
 * @param {Date} seasonStart - Season start date
 * @returns {number} Week number (1-based)
 */
function calculateWeek(dateStr, seasonStart) {
  const gameDate = new Date(dateStr);
  const diffTime = gameDate - seasonStart;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
}

/**
 * Parse kickoff time from various formats
 * @param {string} dateStr - ISO datetime or time string
 * @returns {string} Formatted time (e.g., "12:30p") or "TBD"
 */
function parseKickoffTime(dateStr) {
  if (!dateStr || dateStr === 'TBD') return 'TBD';

  try {
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'p' : 'a';

    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    if (minutes === 0) {
      return `${hours}${ampm}`;
    }
    return `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  } catch (error) {
    return 'TBD';
  }
}

/**
 * Get day of week from date
 * @param {string} dateStr - ISO date string
 * @returns {string} Day name (e.g., "Saturday")
 */
function getDayOfWeek(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

/**
 * Normalize NCAA game data
 * @param {Object} game - Raw game data from API
 * @param {Date} seasonStart - Season start date
 * @returns {Object|null} Normalized game or null if missing venue
 */
function normalizeNCAAGame(game, seasonStart) {
  const venueName = game.venue;
  const venueData = VENUES[venueName];

  if (!venueData) {
    console.warn(`Missing venue: ${venueName}`);
    return null;
  }

  const week = game.week || calculateWeek(game.start_date, seasonStart);

  return {
    id: `${game.season}-${game.division}-${game.id}`,
    week,
    date: game.start_date.split('T')[0],
    day: getDayOfWeek(game.start_date),
    kickoff: parseKickoffTime(game.start_date),
    home: game.home_team,
    away: game.away_team,
    homeLogo: LOGO_OVERRIDES[game.home_team] || game.home_team_logo || null,
    awayLogo: LOGO_OVERRIDES[game.away_team] || game.away_team_logo || null,
    venue: {
      name: venueName,
      lat: venueData.lat,
      lng: venueData.lng
    },
    division: game.division
  };
}

/**
 * Normalize NFL game data
 * @param {Object} game - Raw game data from ESPN API
 * @returns {Object|null} Normalized game or null if missing venue
 */
function normalizeNFLGame(game) {
  const venueName = game.venue;
  const venueData = VENUES[venueName];

  if (!venueData) {
    console.warn(`Missing venue: ${venueName}`);
    return null;
  }

  return {
    id: `nfl-${game.id}`,
    week: game.week,
    date: game.date.split('T')[0],
    day: getDayOfWeek(game.date),
    kickoff: parseKickoffTime(game.date),
    home: game.home_team,
    away: game.away_team,
    homeLogo: LOGO_OVERRIDES[game.home_team] || game.home_team_logo,
    awayLogo: LOGO_OVERRIDES[game.away_team] || game.away_team_logo,
    venue: {
      name: venueName,
      lat: venueData.lat,
      lng: venueData.lng
    },
    division: 'nfl'
  };
}

/**
 * Generate data files from raw API data
 * @param {Object} ncaaData - Raw NCAA data by year
 * @param {Object} nflData - Raw NFL data by year
 * @param {string} outputDir - Output directory path
 */
async function generateDataFiles(ncaaData, nflData, outputDir) {
  // NCAA season typically starts last week of August
  const seasonStarts = {
    2025: new Date(2025, 7, 30), // Aug 30, 2025
    2026: new Date(2026, 7, 29)  // Aug 29, 2026
  };

  const teams = new Set();
  const weeks = {};

  for (const [year, games] of Object.entries(ncaaData)) {
    console.log(`\nProcessing NCAA ${year}...`);
    const seasonStart = seasonStarts[year] || new Date(year, 7, 30);

    const normalized = games
      .map(g => normalizeNCAAGame(g, seasonStart))
      .filter(g => g !== null);

    console.log(`  Normalized ${normalized.length} games (${games.length - normalized.length} missing venues)`);

    // Group by division and week
    const byDivisionWeek = {};
    normalized.forEach(game => {
      teams.add(JSON.stringify({
        name: game.home,
        division: game.division,
        abbreviation: game.home.substring(0, 3).toUpperCase(),
        logo: game.homeLogo
      }));
      teams.add(JSON.stringify({
        name: game.away,
        division: game.division,
        abbreviation: game.away.substring(0, 3).toUpperCase(),
        logo: game.awayLogo
      }));

      const key = `${game.division}/week-${game.week}`;
      if (!byDivisionWeek[key]) {
        byDivisionWeek[key] = [];
      }
      byDivisionWeek[key].push(game);

      if (!weeks[game.week]) {
        weeks[game.week] = {
          number: game.week,
          startDate: game.date,
          label: `Week ${game.week}`
        };
      }
    });

    // Write division/week files
    for (const [key, games] of Object.entries(byDivisionWeek)) {
      const filepath = path.join(outputDir, year.toString(), `${key}.json`);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(games, null, 2));
      console.log(`  Wrote ${filepath} (${games.length} games)`);
    }
  }

  // Process NFL data
  for (const [year, games] of Object.entries(nflData)) {
    console.log(`\nProcessing NFL ${year}...`);

    const normalized = games
      .map(g => normalizeNFLGame(g))
      .filter(g => g !== null);

    console.log(`  Normalized ${normalized.length} games (${games.length - normalized.length} missing venues)`);

    // Group by week
    const byWeek = {};
    normalized.forEach(game => {
      teams.add(JSON.stringify({
        name: game.home,
        division: 'nfl',
        abbreviation: game.home.substring(0, 3).toUpperCase(),
        logo: game.homeLogo
      }));
      teams.add(JSON.stringify({
        name: game.away,
        division: 'nfl',
        abbreviation: game.away.substring(0, 3).toUpperCase(),
        logo: game.awayLogo
      }));

      const key = `nfl/week-${game.week}`;
      if (!byWeek[key]) {
        byWeek[key] = [];
      }
      byWeek[key].push(game);
    });

    // Write week files
    for (const [key, games] of Object.entries(byWeek)) {
      const filepath = path.join(outputDir, year.toString(), `${key}.json`);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(games, null, 2));
      console.log(`  Wrote ${filepath} (${games.length} games)`);
    }
  }

  // Write index file
  const index = {
    season: new Date().getFullYear(),
    lastUpdated: new Date().toISOString(),
    weeks: Object.values(weeks).sort((a, b) => a.number - b.number),
    divisions: ['fbs', 'fcs', 'd2', 'd3', 'nfl'],
    teams: Array.from(teams).map(t => JSON.parse(t))
      .sort((a, b) => a.name.localeCompare(b.name))
  };

  const indexPath = path.join(outputDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nWrote index to ${indexPath}`);
  console.log(`Total teams: ${index.teams.length}`);
}

module.exports = { generateDataFiles };

// CLI usage
if (require.main === module) {
  (async () => {
    const ncaaData = JSON.parse(await fs.readFile('build-data/ncaa-raw.json', 'utf8'));
    const nflData = JSON.parse(await fs.readFile('build-data/nfl-raw.json', 'utf8'));

    await generateDataFiles(ncaaData, nflData, 'public/data');
    console.log('\nData generation complete!');
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
```

**Step 2: Test manually**

Run: `node scripts/generate-data-files.js`
Expected: Creates `public/data/{year}/{division}/week-{N}.json` files and `public/data/index.json`

**Step 3: Commit**

```bash
git add scripts/generate-data-files.js
git commit -m "feat: add data file generator script"
```

---

## Task 8: Add Build Script

**Files:**
- Modify: `package.json`

**Step 1: Add build:data script**

Add to `scripts` section in `package.json`:

```json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "build:data": "node scripts/fetch-ncaa-data.js && node scripts/fetch-nfl-data.js && node scripts/generate-data-files.js",
  "test": "react-scripts test",
  "eject": "react-scripts eject",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add build:data npm script"
```

---

## Task 9: Create React Contexts

**Files:**
- Create: `src/contexts/GameDataContext.js`
- Create: `src/contexts/FilterContext.js`

**Step 1: Create GameDataContext**

File: `src/contexts/GameDataContext.js`

```javascript
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
    fetch('/data/index.json')
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
      fetch(`/data/${year}/${division}/week-${week}.json`)
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
```

**Step 2: Create FilterContext**

File: `src/contexts/FilterContext.js`

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';

const FilterContext = createContext();

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}

const STORAGE_KEYS = {
  TEAMS: 'cfb-map-selected-teams',
  DIVISIONS: 'cfb-map-selected-divisions'
};

export function FilterProvider({ children }) {
  // Load from localStorage or defaults
  const [selectedTeams, setSelectedTeams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDivisions, setSelectedDivisions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIVISIONS);
      return saved ? JSON.parse(saved) : ['fbs', 'fcs', 'd2', 'd3', 'nfl'];
    } catch {
      return ['fbs', 'fcs', 'd2', 'd3', 'nfl'];
    }
  });

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(selectedTeams));
  }, [selectedTeams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(selectedDivisions));
  }, [selectedDivisions]);

  const addTeam = (teamName) => {
    setSelectedTeams(prev => [...new Set([...prev, teamName])]);
  };

  const removeTeam = (teamName) => {
    setSelectedTeams(prev => prev.filter(t => t !== teamName));
  };

  const toggleDivision = (division) => {
    setSelectedDivisions(prev =>
      prev.includes(division)
        ? prev.filter(d => d !== division)
        : [...prev, division]
    );
  };

  return (
    <FilterContext.Provider value={{
      selectedTeams,
      selectedDivisions,
      selectedWeek,
      selectedYear,
      addTeam,
      removeTeam,
      toggleDivision,
      setSelectedWeek,
      setSelectedYear
    }}>
      {children}
    </FilterContext.Provider>
  );
}
```

**Step 3: Commit**

```bash
git add src/contexts/
git commit -m "feat: add React contexts for game data and filters"
```

---

## Task 10: Create Team Selector Component

**Files:**
- Create: `src/components/TeamSelector.js`
- Create: `src/components/TeamSelector.css`

**Step 1: Create TeamSelector component**

File: `src/components/TeamSelector.js`

```javascript
import React, { useState } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { useGameData } from '../contexts/GameDataContext';
import './TeamSelector.css';

function TeamSelector() {
  const { selectedTeams, addTeam, removeTeam } = useFilters();
  const { index } = useGameData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  if (!index) return null;

  const filteredTeams = index.teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTeams.includes(team.name)
  );

  const handleAddTeam = (teamName) => {
    addTeam(teamName);
    setSearchTerm('');
    setShowDropdown(false);
  };

  return (
    <div className="team-selector">
      <div className="selected-teams">
        {selectedTeams.map(teamName => (
          <div key={teamName} className="team-chip">
            <span>{teamName}</span>
            <button
              onClick={() => removeTeam(teamName)}
              className="remove-btn"
              aria-label={`Remove ${teamName}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search to add teams..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="search-input"
        />

        {showDropdown && searchTerm && (
          <div className="search-dropdown">
            {filteredTeams.length > 0 ? (
              filteredTeams.slice(0, 10).map(team => (
                <div
                  key={team.name}
                  className="search-result"
                  onClick={() => handleAddTeam(team.name)}
                >
                  {team.logo && (
                    <img src={team.logo} alt="" className="team-logo-small" />
                  )}
                  <span>{team.name}</span>
                  <span className="team-division">{team.division.toUpperCase()}</span>
                </div>
              ))
            ) : (
              <div className="no-results">No teams found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamSelector;
```

**Step 2: Create TeamSelector styles**

File: `src/components/TeamSelector.css`

```css
.team-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.selected-teams {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.team-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.9rem;
}

.team-chip .remove-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.team-chip .remove-btn:hover {
  color: #ffdddd;
}

.search-container {
  position: relative;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.search-result {
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-result:hover {
  background: #f0f0f0;
}

.team-logo-small {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.team-division {
  margin-left: auto;
  font-size: 0.75rem;
  color: #666;
  font-weight: bold;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #666;
}
```

**Step 3: Commit**

```bash
git add src/components/TeamSelector.js src/components/TeamSelector.css
git commit -m "feat: add team selector component with search"
```

---

## Task 11: Create Week Selector Component

**Files:**
- Create: `src/components/WeekSelector.js`
- Create: `src/components/WeekSelector.css`

**Step 1: Create WeekSelector component**

File: `src/components/WeekSelector.js`

```javascript
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
```

**Step 2: Create WeekSelector styles**

File: `src/components/WeekSelector.css`

```css
.week-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.week-nav-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.week-nav-btn:hover:not(:disabled) {
  background: #0056b3;
}

.week-nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.week-info {
  text-align: center;
  min-width: 150px;
}

.week-date {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}
```

**Step 3: Commit**

```bash
git add src/components/WeekSelector.js src/components/WeekSelector.css
git commit -m "feat: add week selector component with navigation"
```

---

## Task 12: Create Division Filter Component

**Files:**
- Create: `src/components/DivisionFilter.js`
- Create: `src/components/DivisionFilter.css`

**Step 1: Create DivisionFilter component**

File: `src/components/DivisionFilter.js`

```javascript
import React from 'react';
import { useFilters } from '../contexts/FilterContext';
import './DivisionFilter.css';

const DIVISIONS = [
  { id: 'fbs', label: 'FBS' },
  { id: 'fcs', label: 'FCS' },
  { id: 'd2', label: 'D2' },
  { id: 'd3', label: 'D3' },
  { id: 'nfl', label: 'NFL' }
];

function DivisionFilter() {
  const { selectedDivisions, toggleDivision } = useFilters();

  return (
    <div className="division-filter">
      <span className="filter-label">Show:</span>
      {DIVISIONS.map(division => (
        <label key={division.id} className="division-checkbox">
          <input
            type="checkbox"
            checked={selectedDivisions.includes(division.id)}
            onChange={() => toggleDivision(division.id)}
          />
          <span>{division.label}</span>
        </label>
      ))}
    </div>
  );
}

export default DivisionFilter;
```

**Step 2: Create DivisionFilter styles**

File: `src/components/DivisionFilter.css`

```css
.division-filter {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: bold;
}

.division-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  user-select: none;
}

.division-checkbox input[type="checkbox"] {
  cursor: pointer;
}
```

**Step 3: Commit**

```bash
git add src/components/DivisionFilter.js src/components/DivisionFilter.css
git commit -m "feat: add division filter component"
```

---

## Task 13: Update App Component

**Files:**
- Modify: `src/App.js`
- Modify: `src/App.css`
- Modify: `src/index.js`

**Step 1: Update index.js to include providers**

File: `src/index.js`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GameDataProvider } from './contexts/GameDataContext';
import { FilterProvider } from './contexts/FilterContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GameDataProvider>
      <FilterProvider>
        <App />
      </FilterProvider>
    </GameDataProvider>
  </React.StrictMode>
);

reportWebVitals();
```

**Step 2: Refactor App.js**

File: `src/App.js`

```javascript
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
```

**Step 3: Update App.css**

File: `src/App.css`

```css
.App {
  text-align: center;
}

.app-header {
  background-color: #282c34;
  padding: 1rem;
  color: white;
}

.app-header h1 {
  margin: 0;
}

.controls {
  padding: 1.5rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .controls {
    padding: 1rem;
  }
}
```

**Step 4: Commit**

```bash
git add src/App.js src/App.css src/index.js
git commit -m "feat: refactor App to use contexts and new components"
```

---

## Task 14: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-update.yml`

**Step 1: Create workflow file**

File: `.github/workflows/daily-update.yml`

```yaml
name: Daily Data Update

on:
  schedule:
    # Run daily at 6:00 AM ET (10:00 UTC)
    - cron: '0 10 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch NCAA data
        env:
          CFBD_API_KEY: ${{ secrets.CFBD_API_KEY }}
        run: node scripts/fetch-ncaa-data.js

      - name: Fetch NFL data
        run: node scripts/fetch-nfl-data.js

      - name: Generate data files
        run: node scripts/generate-data-files.js

      - name: Build React app
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
          cname: # Add custom domain here if desired

      - name: Notify on failure
        if: failure()
        run: echo "Build failed - check logs"
```

**Step 2: Commit**

```bash
git add .github/workflows/daily-update.yml
git commit -m "feat: add GitHub Actions workflow for daily updates"
```

---

## Task 15: Add GitHub Secret Documentation

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Step 1: Create deployment documentation**

File: `docs/DEPLOYMENT.md`

```markdown
# Deployment Guide

## GitHub Secrets Setup

To enable automated builds, you need to add your CollegeFootballData API key to GitHub Secrets:

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CFBD_API_KEY`
5. Value: Your API key from `.collegefootballdata_api.key`
6. Click "Add secret"

## Manual Trigger

To manually trigger a data update:

1. Go to Actions tab on GitHub
2. Select "Daily Data Update" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Local Development

To build data locally:

```bash
# Set API key
export CFBD_API_KEY=$(cat .collegefootballdata_api.key)

# Run build process
npm run build:data

# Start dev server
npm start
```

## Deployment

The app automatically deploys to GitHub Pages after successful builds.

Access at: `https://<username>.github.io/cfb-map/`

## Monitoring

- Check GitHub Actions tab for build status
- Build runs daily at 6:00 AM ET
- Email notifications sent on failure (configure in Settings)
```

**Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add deployment and secrets setup guide"
```

---

## Task 16: Update README

**Files:**
- Modify: `README.md`

**Step 1: Update README with new features**

Replace the entire `README.md` with:

```markdown
# Football Game Map

A comprehensive interactive map showing college football (FBS, FCS, D2, D3) and NFL games. Visualize game locations, plan multi-game trips, and track your favorite teams.

## Features

- 🗺️ Interactive map with all NCAA and NFL games
- 🔍 Search and track any team
- 📅 Week-by-week navigation
- 🏟️ Automatic daily schedule updates
- 📱 Mobile responsive

## How to Use

1. **Search for teams**: Type in the search box to find and add your favorite teams
2. **Select week**: Use ◄ ► arrows to navigate between weeks
3. **Filter divisions**: Toggle FBS, FCS, D2, D3, or NFL checkboxes
4. **Explore the map**: Click markers to see game details

Your selected teams are saved in your browser for future visits.

## Development

### Prerequisites

- Node.js 18+
- CollegeFootballData.com API key (free at https://collegefootballdata.com)

### Setup

```bash
# Install dependencies
npm install

# Add your API key
echo "your-api-key" > .collegefootballdata_api.key

# Fetch data and generate files
export CFBD_API_KEY=$(cat .collegefootballdata_api.key)
npm run build:data

# Start development server
npm start
```

### Build Scripts

- `npm start` - Run development server
- `npm run build:data` - Fetch and generate game data
- `npm run build` - Build production bundle
- `npm test` - Run tests

## Architecture

- **Frontend**: React 19 + Leaflet maps
- **Data**: Static JSON files generated daily
- **Deployment**: GitHub Pages
- **Automation**: GitHub Actions (daily 6 AM ET)

Game data fetched from:
- CollegeFootballData.com API (NCAA)
- ESPN API (NFL)

## Contributing

We'd love your help! See [How to Contribute](https://github.com/jluhrsen/cfb-map#-how-to-contribute-add-a-new-team-schedule) for details.

To add missing venues or logos:
- Venues: Edit `src/data/venues.json`
- Logos: Edit `src/data/team-logos.json`

## License

See [LICENSE](LICENSE) file for details.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for redesigned application"
```

---

## Task 17: Clean Up Old Schedule Files

**Files:**
- Delete: `src/schedules/*.js`
- Delete: `src/data/logos.js`

**Step 1: Remove old schedule files**

Run:
```bash
rm -rf src/schedules
rm -f src/data/logos.js
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove old hardcoded schedule files"
```

---

## Task 18: Add .gitignore Entry for Build Data

**Files:**
- Modify: `.gitignore`

**Step 1: Add build-data directory to gitignore**

Add to `.gitignore`:

```
build-data/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore build-data directory"
```

---

## Summary

This plan transforms the MVP into a full application:

✅ Automated data fetching from APIs
✅ Static file generation for fast loading
✅ Team search with autocomplete
✅ Division filtering
✅ Week navigation
✅ localStorage persistence
✅ Daily GitHub Actions builds
✅ Comprehensive documentation

**Next Steps After Implementation:**
1. Add GitHub Secret `CFBD_API_KEY`
2. Manually trigger first workflow run
3. Verify deployment to GitHub Pages
4. Add missing venues/logos as needed
5. Test on mobile devices

**Estimated Time:** 6-8 hours for full implementation
