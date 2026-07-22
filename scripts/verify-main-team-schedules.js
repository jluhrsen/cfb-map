const fs = require('fs').promises;
const path = require('path');

const MAIN_TEAMS = require('../config/main-teams.json');
const MANUAL_GAMES = require('../src/data/manual-games.json');

const DIVISION_MAP = {
  fbs: 'fbs',
  fcs: 'fcs',
  ii: 'd2',
  iii: 'd3',
  nfl: 'nfl'
};

function teamNames(team) {
  return new Set([team.name, ...(team.aliases || [])]);
}

function hasTeam(game, names, sport) {
  if (game.source === 'manual') {
    return names.has(game.home) || names.has(game.away);
  }

  if (sport === 'nfl') {
    return names.has(game.home_team) || names.has(game.away_team);
  }

  return names.has(game.homeTeam) || names.has(game.awayTeam);
}

function rawGameKey(game, sport) {
  if (game.source === 'manual') return game.id;
  return sport === 'nfl' ? `nfl-${game.id}` : `${game.season}-ncaa-${game.id}`;
}

function normalizeForMatch(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function isManualCoveredByEspn(manualGame, espnGames) {
  const mHome = normalizeForMatch(manualGame.home);
  const mAway = normalizeForMatch(manualGame.away);
  const manualMs = new Date(manualGame.date + 'T00:00:00Z').getTime();
  return espnGames.some(e => {
    const eHome = normalizeForMatch(e.homeTeam);
    const eAway = normalizeForMatch(e.awayTeam);
    const eDate = (e.startDate || '').split('T')[0];
    const espnMs = new Date(eDate + 'T00:00:00Z').getTime();
    return Math.abs(espnMs - manualMs) <= 2 * 86400000 &&
      ((eHome === mHome && eAway === mAway) || (eHome === mAway && eAway === mHome));
  });
}

function normalizeDivision(classification, fallback) {
  return DIVISION_MAP[classification] || fallback || 'unknown';
}

async function readJSON(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function loadGeneratedGames(dataDir, year) {
  const yearDir = path.join(dataDir, String(year));
  const gamesById = new Map();

  let divisions = [];
  try {
    divisions = await fs.readdir(yearDir);
  } catch (error) {
    if (error.code === 'ENOENT') return gamesById;
    throw error;
  }

  for (const division of divisions) {
    const divisionDir = path.join(yearDir, division);
    const stat = await fs.stat(divisionDir);
    if (!stat.isDirectory()) continue;

    const files = await fs.readdir(divisionDir);
    for (const file of files.filter(name => /^week-\d+\.json$/.test(name))) {
      const games = await readJSON(path.join(divisionDir, file), []);
      games.forEach(game => gamesById.set(game.id, game));
    }
  }

  return gamesById;
}

function getYears(rawData, nflData) {
  return [...new Set([...Object.keys(rawData), ...Object.keys(nflData), ...Object.keys(MANUAL_GAMES)])].sort();
}

function describeGeneratedGame(game) {
  return `${game.away} at ${game.home} on ${game.date}`;
}

async function verify({ dataDir = 'public/data', rawDir = 'build-data' } = {}) {
  const ncaaRaw = await readJSON(path.join(rawDir, 'ncaa-raw.json'), {});
  const nflRaw = await readJSON(path.join(rawDir, 'nfl-raw.json'), {});
  const years = getYears(ncaaRaw, nflRaw);
  const failures = [];
  const summary = [];

  for (const year of years) {
    const generatedGames = await loadGeneratedGames(dataDir, year);

    for (const team of MAIN_TEAMS) {
      const names = teamNames(team);
      const espnForTeam = team.sport === 'ncaa'
        ? (ncaaRaw[year] || []).filter(game => hasTeam(game, names, 'ncaa'))
        : [];
      const manualForTeam = team.sport === 'ncaa'
        ? (MANUAL_GAMES[year] || [])
          .map(game => ({ ...game, source: 'manual' }))
          .filter(game => hasTeam(game, names, 'ncaa'))
          .filter(game => !isManualCoveredByEspn(game, espnForTeam))
        : [];
      const rawGames = team.sport === 'nfl'
        ? (nflRaw[year] || []).filter(game => hasTeam(game, names, 'nfl'))
        : [...espnForTeam, ...manualForTeam];

      if (rawGames.length === 0) {
        summary.push(`${year} ${team.name}: no source games found`);
        continue;
      }

      const generatedForTeam = rawGames
        .map(game => generatedGames.get(rawGameKey(game, team.sport)))
        .filter(Boolean);

      const expectedMin = team.expectedMinGamesByYear?.[year];
      if (expectedMin && generatedForTeam.length < expectedMin) {
        failures.push(`${year} ${team.name}: generated ${generatedForTeam.length} games, expected at least ${expectedMin}`);
      }

      const missingGenerated = rawGames.filter(game => !generatedGames.has(rawGameKey(game, team.sport)));
      if (missingGenerated.length > 0) {
        const examples = missingGenerated
          .slice(0, 5)
          .map(game => team.sport === 'nfl'
            ? `${game.away_team} at ${game.home_team} (${game.venue || 'unknown venue'})`
            : game.source === 'manual'
              ? `${game.away} at ${game.home} (${game.venue || 'unknown venue'})`
              : `${game.awayTeam} at ${game.homeTeam} (${game.venue || 'unknown venue'})`)
          .join('; ');
        failures.push(`${year} ${team.name}: ${missingGenerated.length} source games missing from generated data: ${examples}`);
      }

      if (team.sport === 'ncaa') {
        const gamesByWeek = new Map();
        generatedForTeam.forEach(game => {
          const key = `${game.week}`;
          if (!gamesByWeek.has(key)) {
            gamesByWeek.set(key, []);
          }
          gamesByWeek.get(key).push(game);
        });

        for (const [week, games] of gamesByWeek.entries()) {
          if (games.length > 1) {
            failures.push(`${year} ${team.name}: ${games.length} generated games in week ${week}: ${games.map(describeGeneratedGame).join('; ')}`);
          }
        }

        const generatedTeamDivisions = generatedForTeam.map(game => {
          if (names.has(game.home)) return game.homeDivision;
          if (names.has(game.away)) return game.awayDivision;
          return null;
        }).filter(Boolean);

        const wrongDivision = generatedTeamDivisions.filter(division => division !== team.division);
        if (wrongDivision.length > 0) {
          failures.push(`${year} ${team.name}: expected division ${team.division}, found ${[...new Set(wrongDivision)].join(', ')}`);
        }

        const rawDivisions = rawGames.map(game => {
          if (game.source === 'manual') {
            if (names.has(game.home)) return game.homeDivision || game.division;
            if (names.has(game.away)) return game.awayDivision || game.division;
            return null;
          }

          if (names.has(game.homeTeam)) return normalizeDivision(game.homeClassification, game.division);
          if (names.has(game.awayTeam)) return normalizeDivision(game.awayClassification, game.division);
          return null;
        }).filter(Boolean);

        const wrongRawDivision = rawDivisions.filter(division => division !== team.division);
        if (wrongRawDivision.length > 0) {
          failures.push(`${year} ${team.name}: source classification does not match configured division ${team.division}: ${[...new Set(wrongRawDivision)].join(', ')}`);
        }
      }

      summary.push(`${year} ${team.name}: ${generatedForTeam.length}/${rawGames.length} source games generated`);
    }
  }

  console.log('Main team schedule verification summary:');
  summary.forEach(line => console.log(`  - ${line}`));

  if (failures.length > 0) {
    console.error('\nVerification failures:');
    failures.forEach(line => console.error(`  - ${line}`));
    throw new Error(`${failures.length} main team schedule verification failure(s)`);
  }
}

if (require.main === module) {
  verify().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { verify };
