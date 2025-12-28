# Football Game Map - Full Application Design

**Date:** 2025-12-26
**Goal:** Transform the MVP into a full-fledged application that works for anyone, with auto-updating schedules, team search, and comprehensive coverage.

## Overview

This design converts the hardcoded MVP into a dynamic, automated application that:
- Covers all NCAA divisions (FBS, FCS, D2, D3) plus NFL
- Auto-updates daily via GitHub Actions
- Lets users search and select any teams
- Shows only selected teams' games on the map
- Helps users identify games in close proximity for trip planning

## 1. Overall Architecture & Build Process

### Build Pipeline (GitHub Actions)

Daily GitHub Action runs at 6:00 AM ET year-round:

**Data Fetching Phase:**
- Fetch current + next season games from CollegeFootballData.com API for all NCAA divisions
- Fetch NFL schedules from ESPN's unofficial API
- Paginated requests to get complete schedules
- Parse responses into normalized format

**Venue Resolution:**
- Load static venue database (`src/data/venues.json`) mapping venue names to coordinates
- Match game venues to database entries
- Flag missing venues as workflow warnings

**Data Generation:**
- Generate separate JSON files per division and week: `public/data/{year}/{division}/week-{number}.json`
- Generate master index: `public/data/index.json` with metadata
- Generate team logos mapping: `public/data/teams.json`

**Build & Deploy:**
- Run `npm run build` to create production React bundle
- Deploy to GitHub Pages
- Process takes ~5-10 minutes

**Why this works:** Static files cached by CDN, instant loads, daily auto-refresh, no backend to maintain.

## 2. Data Handling & Quality

### Logo Resolution Strategy

Three-tiered approach:

1. **Primary Source - ESPN CDN:** CollegeFootballData and ESPN APIs return logo URLs (~90% coverage)
2. **Fallback - Manual Curated List:** `src/data/team-logos.json` with overrides for missing teams
3. **Ultimate Fallback - Generated Placeholders:** React component generates SVG circles with team abbreviation and school colors

### Schedule Data Quality Expectations

- **FBS/FCS:** Complete schedules in July, times finalized 6-12 days before games
- **D2/D3:** Schedules available but times often TBD until week of game
- **NFL:** Full schedule with times released in spring

### Handling Missing Data

- Missing game time: Display as "TBD"
- Missing venue coordinates: Log warning, skip from map
- Missing logo: Use generated placeholder
- Cancelled/postponed games: Display with special indicator

### Data Validation During Build

GitHub Action logs warnings for:
- Games with missing venues
- Teams with no logo URL
- Unusual kickoff times (potential errors)

Iteratively improve data quality without blocking builds.

## 3. Frontend UI & Component Structure

### Main App Layout

```
┌─────────────────────────────────────────────┐
│  🏈 Football Game Map                       │
├─────────────────────────────────────────────┤
│  Week: [◄] [Week 3 - Sept 14, 2025] [►]   │
│  Teams: [WYO] [ORE] [Search to add...]     │
│  Show: [✓FBS ✓FCS ✓D2 ✓D3 ✓NFL]          │
├─────────────────────────────────────────────┤
│                                             │
│              MAP DISPLAY                    │
│      (only selected teams' games)           │
│                                             │
└─────────────────────────────────────────────┘
```

### User Flow

1. Search for a team → adds as chip
2. Map shows ONLY games involving selected teams for current week
3. Add more teams → map updates
4. Remove team chip → games disappear
5. Selected teams persist in localStorage

### React Component Structure

- `App.js` - Manages selected teams and week state
  - `WeekSelector.js` - Week navigation with arrows
  - `TeamSelector.js` - Search + team chips
  - `DivisionFilter.js` - FBS/FCS/D2/D3/NFL checkboxes
  - `GameMap.js` - Leaflet map showing filtered games

### State Management

Using React Context:
- `FilterContext` - Current filters (teams, week, divisions)
- `GameDataContext` - Loaded game data (lazy loaded by week)

### Filtering Logic

```javascript
const visibleGames = allGames.filter(game =>
  game.week === selectedWeek &&
  selectedDivisions.includes(game.division) &&
  (selectedTeams.includes(game.home) || selectedTeams.includes(game.away))
);
```

## 4. Data Formats & Schemas

### Generated Data Structure

**`public/data/index.json`** - Master index:
```json
{
  "season": 2025,
  "lastUpdated": "2025-09-14T06:00:00Z",
  "weeks": [
    { "number": 1, "startDate": "2025-08-30", "label": "Week 1" }
  ],
  "divisions": ["fbs", "fcs", "d2", "d3", "nfl"],
  "teams": [
    {
      "id": "wyoming",
      "name": "Wyoming",
      "division": "fbs",
      "abbreviation": "WYO",
      "logo": "https://..."
    }
  ]
}
```

**`public/data/{year}/{division}/week-{N}.json`** - Per-week games:
```json
[
  {
    "id": "2025-fbs-wyoming-airforce-w3",
    "week": 3,
    "date": "2025-09-14",
    "day": "Saturday",
    "kickoff": "12:30p",
    "home": "Air Force",
    "away": "Wyoming",
    "homeLogo": "https://...",
    "awayLogo": "https://...",
    "venue": {
      "name": "Falcon Stadium",
      "lat": 38.9975,
      "lng": -104.8444
    },
    "division": "fbs"
  }
]
```

### Static Venue Database

**`src/data/venues.json`** - Maintained manually:
```json
{
  "Falcon Stadium": {
    "lat": 38.9975,
    "lng": -104.8444,
    "city": "Colorado Springs",
    "state": "CO"
  }
}
```

### LocalStorage Schema

```json
{
  "selectedTeams": ["Wyoming", "Oregon"],
  "selectedDivisions": ["fbs", "fcs", "d2", "d3", "nfl"]
}
```

## 5. GitHub Actions Workflow

### Workflow File
`.github/workflows/daily-update.yml`

### Schedule & Triggers
- Runs daily at 6:00 AM ET (10:00 UTC) year-round
- Manual trigger via `workflow_dispatch`
- Fetches current year + next year schedules

### Workflow Steps

1. **Setup Environment**
   - Checkout repo
   - Setup Node.js 18
   - Install dependencies (`npm ci`)

2. **Determine Seasons to Fetch**
   - Detects current month
   - Fetches current + next year (always looking ahead)

3. **Fetch NCAA Data**
   - Script: `scripts/fetch-ncaa-data.js`
   - API calls to CollegeFootballData.com
   - Authenticated with `CFBD_API_KEY` from GitHub Secrets
   - Rate limit: ~200 calls/hour with pauses

4. **Fetch NFL Data**
   - Script: `scripts/fetch-nfl-data.js`
   - ESPN API for current + next season

5. **Process & Generate Data Files**
   - Script: `scripts/generate-data-files.js`
   - Generates files for both seasons
   - Loads venue database
   - Logs warnings for missing data

6. **Build React App**
   - `npm run build`

7. **Deploy to GitHub Pages**
   - Uses `peaceiris/actions-gh-pages@v3`
   - Pushes `build/` to `gh-pages` branch

### Error Handling
- API failures → notification via GitHub Issues
- Partial data acceptable → build continues
- Previous data remains live until new build succeeds

## 6. Error Handling & Edge Cases

### Build-Time Issues

**Missing Venue Coordinates:**
- Log warning with venue name
- Skip game from map data
- Build continues successfully

**Missing Logos:**
- Generate placeholder data
- Frontend renders SVG with abbreviation

**API Rate Limits:**
- 2-second pauses between requests
- Exponential backoff on rate limit
- Use cached data from previous run if needed

**Malformed Responses:**
- Skip individual malformed games
- Log warnings
- Build succeeds with partial data

### Runtime Edge Cases

**No Teams Selected:**
- Show welcome message
- Empty map centered on default view

**No Games This Week:**
- Show message: "No games for selected teams this week"
- Display bye week indicator

**Multiple Games Same Location:**
- Offset markers slightly (offsetLat/offsetLng)
- Both games visible

**Team Name Variations:**
- Fuzzy matching in search autocomplete
- Team database includes common aliases

**Browser Compatibility:**
- Works without localStorage
- Gentle warning if selections won't persist

## 7. Map Interaction & Visual Design

### Initial Map View
- Center: Sacramento, CA `[38.5816, -121.4944]`
- Zoom level: ~6.5 (Seattle to San Diego)
- Covers West Coast region by default
- Stays at this view unless user chooses "Fit to Games"

### Marker Positioning
- Two markers per game (home/away)
- Offset by ~0.5 longitude
- Home marker north, away marker south

### Marker Appearance
- Team logo as icon (40x40px)
- If no logo: SVG circle with team abbreviation
  - Colored with team's primary color
  - White text with 2-3 letter abbreviation

### Marker Interactions
- Click → Popup with game details:
  ```
  Wyoming (away)
  @ Air Force (home)
  Saturday, Sept 14, 2025
  Falcon Stadium
  Kickoff: 12:30 PM MT
  ```
- Away marker has persistent tooltip: "Sat 9/14 12:30p"
- Hover → Scale animation (1.0 → 1.1)

### Map Controls
- Default: Sacramento-centered West Coast view
- "Fit to Games" button to auto-zoom to markers
- Free pan/zoom
- Reset button to return to default view

### Visual Feedback

**Loading States:**
- Spinner overlay: "Loading games for Week 3..."

**Empty States:**
- No teams: "Search and add teams above to see their games"
- No games: "No games for selected teams in Week 3"

### Performance
- Lazy load week data when selected
- Max ~200 games on map at once
- Leaflet handles rendering efficiently

## 8. Testing & Deployment Strategy

### Build Script Testing

**Unit Tests:**
- `scripts/fetch-ncaa-data.test.js`
- `scripts/fetch-nfl-data.test.js`
- `scripts/generate-data-files.test.js`
- Mock API responses
- Validate JSON schema

**Integration Tests:**
- Test full pipeline: `npm run build:data && npm run build`
- Verify generated files exist
- Check venue matching logic

### Frontend Testing

**Component Tests:**
- TeamSelector: Search, add, remove
- WeekSelector: Navigation
- GameMap: Renders markers, handles clicks
- React Testing Library

### Manual Testing Checklist
- [ ] Search finds teams across divisions
- [ ] Week navigation works
- [ ] Division toggles filter correctly
- [ ] localStorage persists selections
- [ ] Map markers clickable
- [ ] Tooltips show correct info
- [ ] Mobile responsive

### Deployment Process

**Initial Launch:**
1. Set up GitHub Actions workflow
2. Add `CFBD_API_KEY` to GitHub Secrets
3. Create initial `venues.json` with ~50 major stadiums
4. Run workflow manually
5. Verify deployment to GitHub Pages
6. Optional: Custom domain

**Ongoing Maintenance:**
- Daily builds run automatically
- Monitor GitHub Actions for failures
- Add missing venues as warnings appear
- Update team logos as needed
- Season rollover: Verify next year's data loads

**Monitoring:**
- GitHub Actions email notifications
- Weekly site checks during season
- No analytics unless desired

## Success Criteria

The redesign is successful when:
- Any user can find and track any college/NFL team
- Game data updates daily without manual intervention
- Map shows selected teams' games clearly
- Users can plan multi-game trips by visualizing geographic proximity
- System runs reliably year-round with minimal maintenance
