const fs = require('fs').promises;
const path = require('path');

const VENUES = require('../src/data/venues.json');
const LOGO_OVERRIDES = require('../src/data/team-logos.json');
const MANUAL_GAMES = require('../src/data/manual-games.json');
const KICKOFF_OVERRIDES = require('../src/data/kickoff-overrides.json');

const DISPLAY_TIME_ZONE = 'America/Los_Angeles';

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
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
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
    if (Number.isNaN(date.getTime())) return 'TBD';

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DISPLAY_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).formatToParts(date);

    const hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value?.toLowerCase();

    if (!hour || !minute || !dayPeriod) return 'TBD';

    const suffix = dayPeriod.startsWith('a') ? 'a' : 'p';
    return minute === '00' ? `${hour}${suffix}` : `${hour}:${minute}${suffix}`;
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
  const datePart = dateStr.split('T')[0];
  const date = new Date(`${datePart}T00:00:00Z`);
  return days[date.getUTCDay()];
}

function isUnsetNCAAKickoff(dateStr) {
  return /T0[45]:00:00(?:\.000)?Z$/.test(dateStr);
}

function normalizeNCAADivision(classification, fallback) {
  return NCAA_DIVISION_MAP[classification] || fallback || 'unknown';
}

function gameVisibilityDivisions(game) {
  return [...new Set([game.homeDivision, game.awayDivision, game.division].filter(Boolean))];
}

function findKickoffOverride(year, date, home, away) {
  return KICKOFF_OVERRIDES.find(override =>
    override.year === Number(year) &&
    override.date === date &&
    teamsMatch(override.home, override.away, home, away)
  );
}

function teamsMatch(overrideHome, overrideAway, home, away) {
  const normalizedOverrideHome = normalizeTeamName(overrideHome);
  const normalizedOverrideAway = normalizeTeamName(overrideAway);
  const normalizedHome = normalizeTeamName(home);
  const normalizedAway = normalizeTeamName(away);

  return (normalizedOverrideHome === normalizedHome && normalizedOverrideAway === normalizedAway) ||
    (normalizedOverrideHome === normalizedAway && normalizedOverrideAway === normalizedHome);
}

function normalizeTeamName(name) {
  const normalized = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bno\.?\s*\d+\b/gi, '')
    .replace(/\bsiu\b/gi, 'southern illinois')
    .replace(/\buni\b/gi, 'northern iowa')
    .replace(/\bniu\b/gi, 'northern illinois')
    .replace(/\bucf\b/gi, 'central florida')
    .replace(/\buconn\b/gi, 'connecticut')
    .replace(/\bcal\b/gi, 'california')
    .replace(/\bmiami oh\b/gi, 'miami ohio')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const aliases = {
    hawaii: 'hawaii',
    'hawai i': 'hawaii',
    umass: 'massachusetts',
    massachusetts: 'massachusetts',
    liu: 'long island university',
    'long island university': 'long island university',
    pitt: 'pittsburgh',
    pittsburgh: 'pittsburgh',
    'miami ohio': 'miami oh',
    'miami oh': 'miami oh',
    'miami fl': 'miami',
    uconn: 'connecticut',
    connecticut: 'connecticut'
  };

  return aliases[normalized] || normalized;
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
  const week = calculateWeek(game.startDate, seasonStart);
  const date = game.startDate.split('T')[0];
  const kickoffOverride = findKickoffOverride(game.season, date, game.homeTeam, game.awayTeam);

  return {
    id: `${game.season}-ncaa-${game.id}`,
    sourceId: game.id,
    sourceWeek: game.week || null,
    week,
    date,
    day: getDayOfWeek(game.startDate),
    kickoff: kickoffOverride?.kickoff || (isUnsetNCAAKickoff(game.startDate) ? 'TBD' : parseKickoffTime(game.startDate)),
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

function normalizeManualGame(game, seasonStart) {
  const venueData = findVenue(game.venue);
  const week = calculateWeek(game.date, seasonStart);

  return {
    id: game.id,
    sourceId: game.id,
    source: 'manual',
    week,
    sourceWeek: game.week || null,
    date: game.date,
    day: getDayOfWeek(game.date),
    kickoff: game.kickoff || (game.home === 'Willamette' || game.away === 'Willamette' ? '1p' : 'TBD'),
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
  const availableSeasons = [...new Set([...Object.keys(ncaaData), ...Object.keys(nflData)])].map(Number).sort();
  for (const year of availableSeasons) {
    await fs.rm(path.join(outputDir, year.toString()), { recursive: true, force: true });
  }

  const teams = new Set();
  const seasonStartsByYear = {};
  const dateBoundsByYear = {};
  const diagnostics = {};

  for (const [year, games] of Object.entries(ncaaData)) {
    console.log(`\nProcessing NCAA ${year}...`);
    const seasonStart = findNCAASeasonStart(year, games);
    seasonStartsByYear[year] = formatDate(seasonStart);

    if (!diagnostics[year]) {
      diagnostics[year] = { missingVenues: [] };
    }

    const normalized = games
      .map(g => normalizeNCAAGame(g, seasonStart))
      .filter(g => g !== null);
    const normalizedManual = (MANUAL_GAMES[year] || [])
      .map(g => normalizeManualGame(g, seasonStart))
      .filter(g => g !== null);

    // Deduplicate: when ESPN and manual have the same game (same teams,
    // date within ±2 days), keep the ESPN entry but inherit the manual
    // entry's venue if ESPN's venue didn't resolve.
    const dedupedManual = normalizedManual.filter(manual => {
      const manualMs = new Date(manual.date + 'T00:00:00Z').getTime();
      const duplicate = normalized.find(espn => {
        const espnMs = new Date(espn.date + 'T00:00:00Z').getTime();
        return Math.abs(espnMs - manualMs) <= 2 * 86400000 &&
          teamsMatch(espn.home, espn.away, manual.home, manual.away);
      });
      if (duplicate) {
        if (duplicate.missingVenue && !manual.missingVenue) {
          duplicate.venue = manual.venue;
          duplicate.missingVenue = false;
          console.log(`  Dedup: dropping manual "${manual.away} at ${manual.home}" (${manual.date}), ESPN has it as ${duplicate.id} (using manual venue "${manual.venue.name}")`);
        } else {
          console.log(`  Dedup: dropping manual "${manual.away} at ${manual.home}" (${manual.date}), ESPN has it as ${duplicate.id}`);
        }
      }
      return !duplicate;
    });

    const combined = [...normalized, ...dedupedManual];
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

      updateDateBounds(dateBoundsByYear, year, game.date);
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

      updateDateBounds(dateBoundsByYear, year, game.date);
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
  const weeksByYear = {};
  for (const year of availableSeasons.map(String)) {
    weeksByYear[year] = buildDisplayWeeks(year, seasonStartsByYear[year], dateBoundsByYear[year]);
  }

  const index = {
    season: new Date().getFullYear(),
    availableSeasons,
    lastUpdated: new Date().toISOString(),
    weeksByYear,
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

function findNCAASeasonStart(year, games) {
  const dates = [
    ...games
      .map(game => game.startDate?.split('T')[0])
      .filter(Boolean),
    ...(MANUAL_GAMES[year] || [])
      .map(game => game.date)
      .filter(Boolean)
  ].sort();

  if (dates.length === 0) {
    return new Date(Number(year), 7, 30);
  }

  return new Date(`${dates[0]}T00:00:00Z`);
}

function updateDateBounds(dateBoundsByYear, year, date) {
  if (!dateBoundsByYear[year]) {
    dateBoundsByYear[year] = { min: date, max: date };
    return;
  }

  if (date < dateBoundsByYear[year].min) {
    dateBoundsByYear[year].min = date;
  }
  if (date > dateBoundsByYear[year].max) {
    dateBoundsByYear[year].max = date;
  }
}

function buildDisplayWeeks(year, seasonStartDate, dateBounds) {
  if (!dateBounds) {
    return [];
  }

  const startDate = seasonStartDate || dateBounds.min;
  const start = parseDate(startDate);
  const weekCount = calculateWeek(dateBounds.max, start);

  return Array.from({ length: weekCount }, (_, idx) => ({
    number: idx + 1,
    startDate: formatDate(addDays(start, idx * 7)),
    label: `Week ${idx + 1}`
  }));
}

function parseDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
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
