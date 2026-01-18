# Story 04: Create Data Index Metadata File

## Description

Create `public/data/index.json` that lists available seasons and metadata. The frontend will fetch this to populate the year selector dropdown.

## Target State

New file at `public/data/index.json`:
```json
{
  "availableYears": [2025],
  "lastUpdated": "2026-01-17T02:00:00Z",
  "currentSeason": 2025,
  "upcomingSeason": 2026
}
```

## Acceptance Criteria

- [ ] File created at `public/data/index.json`
- [ ] Contains array of available years (currently just [2025])
- [ ] Includes last updated timestamp
- [ ] Indicates current and upcoming seasons
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

- Start with 2025 only since that's the current data
- Later, generate-data-files.js will update this file to add new years
- Frontend will fetch this on app load to build year selector
- Timestamp format: ISO 8601

## Dependencies

None - creates new file

## Estimated Effort

Trivial (5 minutes)
