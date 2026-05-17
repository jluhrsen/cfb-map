const fs = require('fs').promises;
const path = require('path');
const { fetchJSON, sleep } = require('./utils/api-client');

const API_BASE = 'https://api.collegefootballdata.com';

const DIVISIONS = ['fbs', 'fcs', 'd2', 'd3'];

async function getAPIKey() {
  if (process.env.CFBD_API_KEY) {
    return process.env.CFBD_API_KEY.trim();
  }

  try {
    return (await fs.readFile('.collegefootballdata_api.key', 'utf8')).trim();
  } catch (error) {
    return '';
  }
}

/**
 * Fetch games for a specific year and division
 * @param {number} year - Season year
 * @param {string} division - Division (fbs, fcs, d2, d3)
 * @returns {Promise<Array>} Array of games
 */
async function fetchGamesForDivision(year, division, apiKey) {
  const url = `${API_BASE}/games?year=${year}&division=${division}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
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
  const apiKey = await getAPIKey();
  if (!apiKey) {
    throw new Error('CFBD_API_KEY environment variable not set and .collegefootballdata_api.key not found');
  }

  const allData = {};

  for (const year of years) {
    console.log(`\nFetching NCAA data for ${year}...`);
    const gamesMap = new Map();

    for (const division of DIVISIONS) {
      const games = await fetchGamesForDivision(year, division, apiKey);

      // Deduplicate by game ID (API returns all games for each division request)
      games.forEach(game => {
        if (!gamesMap.has(game.id)) {
          gamesMap.set(game.id, game);
        }
      });

      // Rate limiting: pause between divisions
      await sleep(2000);
    }

    allData[year] = Array.from(gamesMap.values());
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
  // Fetch previous year and current year to handle season transitions
  const years = [currentYear - 1, currentYear];

  fetchNCAAData(years)
    .then(data => saveNCAAData(data, 'build-data/ncaa-raw.json'))
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
