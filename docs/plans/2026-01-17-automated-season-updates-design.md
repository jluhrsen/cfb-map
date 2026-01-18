# Automated Season Updates Design

**Date:** 2026-01-17
**Status:** Approved

## Overview

Transform cfb-map from requiring manual yearly setup to automatically maintaining current and future season data. The system will fetch schedules daily, validate data quality, auto-discover new venues and logos, and build a historical archive of all seasons.

## Goals

- Eliminate manual yearly coding sessions
- Automatically fetch and update current + upcoming season data
- Maintain historical archive of all past seasons
- Handle incomplete early-season data gracefully
- Track and surface data quality issues automatically
- Require minimal human intervention for routine operations

## Data Architecture

### Historical Archive Structure

Expand `public/data/` to support unlimited seasons:

```
public/data/
├── index.json (metadata: available years, last updated, etc.)
├── 2024/
│   ├── nfl/week-*.json
│   ├── fbs/week-*.json
│   ├── fcs/week-*.json
│   ├── d2/week-*.json
│   └── d3/week-*.json
├── 2025/ (current structure)
├── 2026/ (new season data as it becomes available)
└── 2027/ (one year ahead)
```

### Season Lifecycle

Each season progresses through states:

- **Future (2026+):** Actively fetched daily until Feb 1 of that year
- **Current (2025):** Actively fetched daily until Feb 1, 2026
- **Historical (2024-):** Frozen permanently, never re-fetched

**Cutoff Logic:** On Feb 1st each year, stop fetching the previous season. That season's data is frozen forever as a historical record.

### Supporting Data Files

**Existing files to enhance:**
- `src/data/venues.json` - Comprehensive venue database (200-300 stadiums)
  - Add `city` and `state` fields for geocoding validation
- `src/data/team-logos.json` - Cached logo URLs, grows as new teams appear

**New files:**
- `src/data/team-espn-ids.json` - Maps team names to ESPN numeric IDs for logo lookups
- `.github/api-health.json` - Tracks consecutive API failure counts

### Data Quality Criteria

Games must have complete data to be included:
- ✅ Date (not "TBD")
- ✅ Opponent teams (home and away)
- ✅ Venue with coordinates

Incomplete games are excluded from generated files. No noise, no unmappable games.

## GitHub Actions Architecture

### Modular Reusable Actions

Create composable modules in `.github/actions/`:

1. **fetch-ncaa-data** - Calls CollegeFootballData.com API with retry logic
2. **fetch-nfl-data** - Calls ESPN API with retry logic
3. **validate-data** - Checks data quality, identifies missing venues/logos
4. **geocode-venues** - Looks up missing venues via OpenStreetMap Nominatim
5. **lookup-logos** - Finds team logos via ESPN API
6. **create-issues** - Creates/updates/closes GitHub Issues with severity tags
7. **generate-files** - Runs existing generate-data-files.js script

### Daily Update Workflow

Single workflow (`.github/workflows/daily-update.yml`) runs daily at 2am UTC:

```yaml
name: Daily Data Update

on:
  schedule:
    - cron: '0 2 * * *'  # 2am UTC daily
  workflow_dispatch:      # Manual trigger option

jobs:
  update-data:
    steps:
      - Determine active seasons (current + next, exclude if past Feb 1)
      - For each active season:
          - fetch-ncaa-data (with retry/backoff)
          - fetch-nfl-data (with retry/backoff)
          - validate-data (identify issues)
          - geocode-venues (auto-add high-confidence matches)
          - lookup-logos (auto-add if ESPN URLs work)
          - generate-files (only complete games)
          - create-issues (severity: critical/enhancement/warning)
      - Commit changes if any data updated
      - Deploy to GitHub Pages
```

### API Failure Handling

**Retry Logic (exponential backoff):**
1. Initial request fails → wait 5s, retry
2. Second failure → wait 10s, retry
3. Third failure → wait 20s, retry
4. Still failing → use cached data, track failure

**Consecutive Failure Tracking:**

Maintain `.github/api-health.json` in the repo:

```json
{
  "ncaa_api_consecutive_failures": 2,
  "nfl_api_consecutive_failures": 0,
  "last_updated": "2026-01-17"
}
```

Each workflow run:
- Read api-health.json
- Try API calls
- Update counters (increment on failure, reset to 0 on success)
- If counter >= 3 → create "warning" issue
- Commit updated api-health.json

**Result:** Transient blips don't create issues. Only persistent problems (3+ days) trigger alerts.

## Data Validation & Issue Management

### Validation Checks

The `validate-data` action identifies:

1. **Missing venues** - Game references venue name not in venues.json
2. **Missing logos** - Team not in team-logos.json and not in team-espn-ids.json
3. **Missing ESPN IDs** - Team exists but no ID mapping for logo lookup
4. **Geocoding needed** - Venue lacks coordinates
5. **Data completeness** - Game count drops >20% unexpectedly

### Issue Severity Classification

**Critical** - Prevents games from appearing on map
- Missing venue (no coordinates = can't map)
- Low-confidence geocoding (stadium type mismatch or wrong city/state)

**Enhancement** - Games appear but degraded
- Missing team logo (shows helmet placeholder)
- Missing ESPN ID (can't auto-fetch logo)

**Warning** - System health issues
- API failed 3+ consecutive days
- Unexpected data drop (>20% fewer games)

### Issue Lifecycle

**Create:**
- Check if issue with same title already exists (open or closed)
- If not, create new issue with severity label
- If exists, update with comment instead

**Update:**
- Add status comments to existing open issues
- Track when problems persist or change

**Auto-close:**
- If issue was "Missing venue: X" and X now exists in venues.json → close with "Resolved" comment
- If issue was "Missing logo: Y" and Y now has logo → close automatically

**Deduplication:**
- Never create duplicate issues
- Always update existing issues instead

## Venue & Logo Discovery

### Initial Venue Database

**One-time manual population** of `venues.json`:
- 32 NFL stadiums (✅ complete)
- ~130 FBS stadiums
- ~130 FCS stadiums
- ~170 D2 stadiums
- ~250 D3 stadiums

Each entry: `{ "name": "...", "lat": X, "lng": Y, "city": "...", "state": "..." }`

### Auto-Geocoding New Venues

When game references unknown venue:

1. Query OpenStreetMap Nominatim: `"{venue_name}, {city}, {state}"`
2. Check top result for "high confidence":
   - Result tagged as `stadium`, `sports_centre`, or `arena`
   - Result's city/state matches expected location
3. **High confidence** → auto-add to venues.json
4. **Low confidence** → create "critical" issue, exclude game
5. Respect Nominatim usage policy: max 1 request/second

**Why OpenStreetMap:** Open source, free, adequate accuracy for city-level precision.

**Accuracy goal:** City-level is sufficient (e.g., "San Jose" vs "Santa Clara" distinction). Don't need exact street addresses.

### Auto-Discovering Team Logos

When game references team without logo:

1. Check team-espn-ids.json for ESPN ID mapping
2. If no mapping → query ESPN API to search team name, extract ID
3. Construct URL: `https://a.espncdn.com/i/teamlogos/ncaa/500/{ESPN_ID}.png`
4. Test URL (HTTP HEAD request)
5. **200 OK** → add to team-logos.json and team-espn-ids.json
6. **404 or no ID** → create "enhancement" issue, use helmet placeholder

**Fallback:** Generic helmet logo ensures games always render, even without team-specific logos.

## Frontend Changes

### Smart Season Detection

Update `FilterContext.js` to auto-select appropriate season:

```javascript
function getCurrentFootballSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Feb-Jul (off-season) → show upcoming season
  if (month >= 2 && month <= 7) {
    return year;
  }

  // Aug-Jan (active season) → show current season
  // Note: Jan 2026 is part of 2025 season
  return month === 1 ? year - 1 : year;
}
```

### Year Selector UI

Enhance year selector to support multiple seasons:
- Fetch `public/data/index.json` on app load to discover available years
- Populate dropdown with all years (2024, 2025, 2026, 2027...)
- Default to `getCurrentFootballSeason()`
- Persist selection in localStorage (existing pattern)
- If selected year has no data, fall back to most recent available

### Data Loading

Update `GameDataContext.js`:
- Fetch `public/data/index.json` to get year list
- Load year-specific data: `public/data/{year}/{division}/week-{week}.json`
- Handle missing files gracefully (future weeks may not exist yet)

### User Experience

**No "TBD" indicators needed:** Only complete games (date + opponent + venue) are included in generated files. Users never see incomplete data.

**Silent updates:** Schedules update in background daily. Users see current accurate data on reload. No change logs or version history.

**Historical access:** Users can select any past season from dropdown to view historical games.

## Migration Plan

### Initial Setup

1. **Populate comprehensive venues.json** (manual, one-time)
   - Research and add ~620 stadiums across all divisions
   - Include lat, lng, city, state for each

2. **Create modular GitHub Actions**
   - Build reusable action components
   - Implement retry logic and error handling
   - Add geocoding and logo lookup logic

3. **Update fetch scripts**
   - Handle multiple years (current + next)
   - Add Feb 1st cutoff logic
   - Exclude incomplete games

4. **Add frontend multi-year support**
   - Smart season detection
   - Year selector UI
   - Multi-year data loading

### Testing Strategy

- Build new Actions in separate branch
- Test with 2025 + 2026 data
- Verify issue creation/closing works
- Confirm geocoding accuracy
- Validate logo discovery

### Rollout

- Keep current system running during development
- Cutover during off-season (Feb-Jul 2026) when lower risk
- Monitor workflow runs daily for first 2 weeks
- Watch issue dashboard for unexpected problems

## Monitoring & Maintenance

### Health Indicators

**Good health:**
- Daily workflow succeeds (even if APIs fail occasionally)
- Few or no "critical" issues open
- Commit history shows daily updates
- Spot checks confirm current week's games appear

**Needs attention:**
- Multiple "critical" issues accumulating
- "Warning" issues for 3+ day API failures
- Workflow failing repeatedly
- Game counts dropping unexpectedly

### Manual Intervention Required

**Occasional (monthly):**
- Review and close resolved issues
- Verify auto-geocoded venues are correct
- Check newly added teams/logos

**Rare (new stadiums/teams):**
- Add venues that geocoding couldn't find
- Research logos for teams ESPN doesn't cover
- Update team-espn-ids.json for name mismatches

### Long-term Maintenance

**Yearly (off-season):**
- Review comprehensive venue database for new stadiums
- Check for stadium name changes/rebranding
- Verify all teams from previous season have logos

**As needed:**
- Update API endpoints if services change
- Adjust geocoding confidence thresholds if getting bad matches
- Tune issue creation thresholds based on noise levels

## Success Criteria

✅ **Automation:** 2026 season data appears automatically without manual coding
✅ **Accuracy:** >95% of games have correct venues and appear on map
✅ **Resilience:** System handles API failures gracefully, doesn't break
✅ **Visibility:** Issues surface problems clearly with actionable severity
✅ **History:** All past seasons preserved and accessible
✅ **Low maintenance:** <1 hour/month of manual work during active season
