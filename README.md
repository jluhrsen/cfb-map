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
