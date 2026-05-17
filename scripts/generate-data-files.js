const fs = require('fs').promises;
const path = require('path');

const VENUES = require('../src/data/venues.json');
const LOGO_OVERRIDES = require('../src/data/team-logos.json');
const MANUAL_GAMES = require('../src/data/manual-games.json');

const NCAA_DIVISION_MAP = {
  'fbs': 'fbs',
  'fcs': 'fcs',
  'ii': 'd2',
  'iii': 'd3'
};

/**
 * Find venue data with fuzzy matching
 * @param {string} venueName - Venue name from API
 * @returns {Object|null} Venue data with coordinates and matched key
 */
function findVenue(venueName) {
  if (!venueName) return null;

  // Try exact match first
  if (VENUES[venueName]) {
    return { ...VENUES[venueName], matchedKey: venueName, matchType: 'exact' };
  }

  const venueKeys = Object.keys(VENUES);
  const lowerVenueName = venueName.toLowerCase();
  const normalizedVenueName = normalizeVenueName(venueName);

  // Try case-insensitive exact match
  for (const key of venueKeys) {
    if (key.toLowerCase() === lowerVenueName) {
      return { ...VENUES[key], matchedKey: key, matchType: 'case-insensitive' };
    }
  }

  // Try punctuation-insensitive exact match. Avoid partial matching: short or
  // generic names like "Memorial Stadium" can otherwise match the wrong venue.
  for (const key of venueKeys) {
    if (normalizeVenueName(key) === normalizedVenueName) {
      return { ...VENUES[key], matchedKey: key, matchType: 'normalized-exact' };
    }
  }

  return null;
}

function normalizeVenueName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

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

function normalizeNCAADivision(classification, fallback) {
  return NCAA_DIVISION_MAP[classification] || fallback || 'unknown';
}

function gameVisibilityDivisions(game) {
  return [...new Set([game.homeDivision, game.awayDivision, game.division].filter(Boolean))];
}

/**
 * Normalize NCAA game data
 * @param {Object} game - Raw game data from API
 * @param {Date} seasonStart - Season start date
 * @returns {Object} Normalized game with optional missingVenue diagnostic
 */
function normalizeNCAAGame(game, seasonStart) {
  const venueName = game.venue;
  const venueData = findVenue(venueName);

  // Skip games without a start date
  if (!game.startDate) {
    console.warn(`Missing startDate for game: ${game.homeTeam} vs ${game.awayTeam}`);
    return null;
  }

  const homeDivision = normalizeNCAADivision(game.homeClassification, game.division);
  const awayDivision = normalizeNCAADivision(game.awayClassification, game.division);
  const gameDivision = homeDivision;
  const week = game.week || calculateWeek(game.startDate, seasonStart);

  return {
    id: `${game.season}-ncaa-${game.id}`,
    sourceId: game.id,
    week,
    date: game.startDate.split('T')[0],
    day: getDayOfWeek(game.startDate),
    kickoff: parseKickoffTime(game.startDate),
    home: game.homeTeam,
    away: game.awayTeam,
    homeDivision,
    awayDivision,
    homeLogo: LOGO_OVERRIDES[game.homeTeam] || null,
    awayLogo: LOGO_OVERRIDES[game.awayTeam] || null,
    venue: venueData ? {
      name: venueData.matchedKey,
      lat: venueData.lat,
      lng: venueData.lng
    } : {
      name: venueName || 'TBD',
      lat: null,
      lng: null,
      missing: true
    },
    missingVenue: !venueData,
    division: gameDivision
  };
}

function normalizeManualGame(game) {
  const venueData = findVenue(game.venue);

  return {
    id: game.id,
    sourceId: game.id,
    source: 'manual',
    week: game.week,
    date: game.date,
    day: getDayOfWeek(game.date),
    kickoff: game.kickoff || 'TBD',
    home: game.home,
    away: game.away,
    homeDivision: game.homeDivision || game.division,
    awayDivision: game.awayDivision || game.division,
    homeLogo: LOGO_OVERRIDES[game.home] || null,
    awayLogo: LOGO_OVERRIDES[game.away] || null,
    venue: venueData ? {
      name: venueData.matchedKey,
      lat: venueData.lat,
      lng: venueData.lng
    } : {
      name: game.venue || 'TBD',
      lat: null,
      lng: null,
      missing: true
    },
    missingVenue: !venueData,
    division: game.division || game.homeDivision || game.awayDivision
  };
}

/**
 * Normalize NFL game data
 * @param {Object} game - Raw game data from ESPN API
 * @returns {Object|null} Normalized game or null if missing date
 */
function normalizeNFLGame(game) {
  const venueName = game.venue;
  const venueData = findVenue(venueName);

  // Skip games without a date
  if (!game.date) {
    console.warn(`Missing date for NFL game: ${game.home_team} vs ${game.away_team}`);
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
    venue: venueData ? {
      name: venueData.matchedKey,
      lat: venueData.lat,
      lng: venueData.lng
    } : {
      name: venueName || 'TBD',
      lat: null,
      lng: null,
      missing: true
    },
    missingVenue: !venueData,
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

  const availableSeasons = [...new Set([...Object.keys(ncaaData), ...Object.keys(nflData)])].map(Number).sort();
  for (const year of availableSeasons) {
    await fs.rm(path.join(outputDir, year.toString()), { recursive: true, force: true });
  }

  const teams = new Set();
  const weeksByYear = {};
  const diagnostics = {};

  for (const [year, games] of Object.entries(ncaaData)) {
    console.log(`\nProcessing NCAA ${year}...`);
    const seasonStart = seasonStarts[year] || new Date(year, 7, 30);

    if (!weeksByYear[year]) {
      weeksByYear[year] = {};
    }
    if (!diagnostics[year]) {
      diagnostics[year] = { missingVenues: [] };
    }

    const normalized = games
      .map(g => normalizeNCAAGame(g, seasonStart))
      .filter(g => g !== null);
    const normalizedManual = (MANUAL_GAMES[year] || [])
      .map(g => normalizeManualGame(g))
      .filter(g => g !== null);
    const combined = [...normalized, ...normalizedManual];
    const mappable = combined.filter(g => !g.missingVenue);
    const missingVenueGames = combined.filter(g => g.missingVenue);

    missingVenueGames.forEach(game => {
      diagnostics[year].missingVenues.push({
        sport: 'ncaa',
        id: game.id,
        week: game.week,
        date: game.date,
        home: game.home,
        away: game.away,
        venue: game.venue.name,
        division: game.division
      });
    });
    logMissingVenueSummary(year, 'NCAA', missingVenueGames);

    console.log(`  Normalized ${mappable.length} mappable games (${missingVenueGames.length} missing venues, ${games.length - normalized.length} missing dates, ${normalizedManual.length} manual games)`);

    // Group by division and week
    const byDivisionWeek = {};
    mappable.forEach(game => {
      teams.add(JSON.stringify({
        name: game.home,
        division: game.homeDivision,
        abbreviation: game.home.substring(0, 3).toUpperCase(),
        logo: game.homeLogo
      }));
      teams.add(JSON.stringify({
        name: game.away,
        division: game.awayDivision,
        abbreviation: game.away.substring(0, 3).toUpperCase(),
        logo: game.awayLogo
      }));

      gameVisibilityDivisions(game).forEach(division => {
        const key = `${division}/week-${game.week}`;
        if (!byDivisionWeek[key]) {
          byDivisionWeek[key] = [];
        }
        byDivisionWeek[key].push(game);
      });

      if (!weeksByYear[year][game.week]) {
        weeksByYear[year][game.week] = {
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

    if (!weeksByYear[year]) {
      weeksByYear[year] = {};
    }
    if (!diagnostics[year]) {
      diagnostics[year] = { missingVenues: [] };
    }

    const normalized = games
      .map(g => normalizeNFLGame(g))
      .filter(g => g !== null);
    const mappable = normalized.filter(g => !g.missingVenue);
    const missingVenueGames = normalized.filter(g => g.missingVenue);

    missingVenueGames.forEach(game => {
      diagnostics[year].missingVenues.push({
        sport: 'nfl',
        id: game.id,
        week: game.week,
        date: game.date,
        home: game.home,
        away: game.away,
        venue: game.venue.name,
        division: game.division
      });
    });
    logMissingVenueSummary(year, 'NFL', missingVenueGames);

    console.log(`  Normalized ${mappable.length} mappable games (${missingVenueGames.length} missing venues, ${games.length - normalized.length} missing dates)`);

    // Group by week
    const byWeek = {};
    mappable.forEach(game => {
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

      if (!weeksByYear[year][game.week]) {
        weeksByYear[year][game.week] = {
          number: game.week,
          startDate: game.date,
          label: `Week ${game.week}`
        };
      }
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
  // Convert weeksByYear to sorted arrays
  const weeksByYearSorted = {};
  for (const [year, weeksObj] of Object.entries(weeksByYear)) {
    weeksByYearSorted[year] = Object.values(weeksObj).sort((a, b) => a.number - b.number);
  }

  const index = {
    season: new Date().getFullYear(),
    availableSeasons,
    lastUpdated: new Date().toISOString(),
    weeksByYear: weeksByYearSorted,
    divisions: ['fbs', 'fcs', 'd2', 'd3', 'nfl'],
    teams: Array.from(teams).map(t => JSON.parse(t))
      .sort((a, b) => a.name.localeCompare(b.name))
  };

  const indexPath = path.join(outputDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nWrote index to ${indexPath}`);
  console.log(`Total teams: ${index.teams.length}`);

  const diagnosticsPath = path.join(outputDir, 'data-quality.json');
  await fs.writeFile(diagnosticsPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    years: diagnostics
  }, null, 2));
  console.log(`Wrote diagnostics to ${diagnosticsPath}`);
}

function logMissingVenueSummary(year, sport, games) {
  if (games.length === 0) return;

  const venues = [...new Set(games.map(game => game.venue.name))].sort();
  const sample = venues.slice(0, 10).join(', ');
  const suffix = venues.length > 10 ? `, and ${venues.length - 10} more` : '';
  console.warn(`  ${sport} ${year}: ${games.length} games missing ${venues.length} unique venues (${sample}${suffix})`);
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
