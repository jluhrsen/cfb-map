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
