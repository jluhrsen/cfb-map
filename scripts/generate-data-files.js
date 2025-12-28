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

  // Skip games without a start date
  if (!game.start_date) {
    console.warn(`Missing start_date for game: ${game.home_team} vs ${game.away_team}`);
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
