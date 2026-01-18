# Story 02: Create Team ESPN IDs Mapping File

## Description

Create a new data file `src/data/team-espn-ids.json` that maps team names to their ESPN numeric IDs. This enables automatic logo lookup from ESPN's CDN.

## Target State

New file at `src/data/team-espn-ids.json`:
```json
{
  "San José State": 23,
  "Wyoming": 2751,
  "Air Force": 2005,
  "Akron": 2006,
  "Colorado": 38,
  "Stanford": 24,
  ...
}
```

## Acceptance Criteria

- [ ] File created at `src/data/team-espn-ids.json`
- [ ] Contains mappings for all teams currently in team-logos.json
- [ ] Team names match exactly as they appear in API responses
- [ ] ESPN IDs are numeric (no quotes around numbers)
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

- Start with teams you already added logos for (19 FBS teams from SJSU/Wyoming work)
- ESPN IDs can be extracted from existing logo URLs in team-logos.json
- Example: `https://a.espncdn.com/i/teamlogos/ncaa/500/23.png` → ID is 23
- Also include the 10 D3 teams (though they may not have ESPN IDs)

## Dependencies

None - creates new file

## Estimated Effort

Small (30 minutes)
