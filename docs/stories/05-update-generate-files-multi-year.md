# Story 05: Update Generate Files Script for Multi-Year

## Description

Modify `scripts/generate-data-files.js` to:
1. Process multiple years of data (not just hardcoded 2025)
2. Only include games with date + opponent + venue (exclude incomplete)
3. Update `public/data/index.json` with available years

## Current Behavior

- Reads from `scripts/data/2025.json`
- Generates files in `public/data/2025/`
- Hardcoded to process 2025 only

## Target Behavior

- Read years dynamically from `scripts/data/` directory (2025.json, 2026.json, etc.)
- For each year, generate files in `public/data/{year}/`
- Filter out games missing: date, opponent, or venue
- Update `public/data/index.json` with list of years processed

## Acceptance Criteria

- [ ] Script processes all .json files in scripts/data/ (not just 2025)
- [ ] Games without date are excluded
- [ ] Games without venue (or venue not in venues.json) are excluded
- [ ] public/data/index.json updated with availableYears array
- [ ] Existing 2025 data generation still works correctly
- [ ] Script logs how many games included vs excluded per year
- [ ] Changes committed to git

## Implementation Notes

```javascript
// Pseudo-code
const dataFiles = fs.readdirSync('scripts/data/').filter(f => f.endsWith('.json'));
const years = dataFiles.map(f => f.replace('.json', ''));

for (const year of years) {
  const rawData = JSON.parse(fs.readFileSync(`scripts/data/${year}.json`));
  const completeGames = rawData.filter(game =>
    game.startDate &&
    game.homeTeam &&
    game.awayTeam &&
    venues[game.venue?.name]
  );
  // ... generate files for this year
}

// Update index.json
fs.writeFileSync('public/data/index.json', JSON.stringify({
  availableYears: years.map(Number).sort(),
  lastUpdated: new Date().toISOString(),
  // ... other metadata
}));
```

## Dependencies

- Story 04 (needs index.json to exist)
- Story 01 (needs venues with city/state for validation)

## Estimated Effort

Medium (2-3 hours)
