# Story 08: Create Validate Data Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/validate-data/` that checks data quality and identifies issues (missing venues, missing logos, data completeness).

## Target State

New reusable action that:
- Reads raw game data from scripts/data/
- Checks for missing venues, missing logos, data drops
- Outputs structured list of issues found

## Inputs

- `year` (required): Season year to validate
- `data-file` (required): Path to raw data JSON

## Outputs

- `issues-found`: JSON array of issues with type and severity
- `missing-venues`: Array of venue names not in venues.json
- `missing-logos`: Array of team names without logos
- `game-count`: Total games in this year's data

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/validate-data/`
- [ ] action.yml defines inputs and outputs
- [ ] Detects missing venues (game.venue not in venues.json)
- [ ] Detects missing logos (team not in team-logos.json)
- [ ] Detects missing ESPN IDs (team not in team-espn-ids.json)
- [ ] Outputs structured JSON list of issues
- [ ] Each issue includes: type, severity, description, affected games
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

Severity classification:
- **critical**: Missing venue (blocks game from map)
- **enhancement**: Missing logo or ESPN ID
- **warning**: Game count dropped >20% vs previous fetch

Output format:
```json
[
  {
    "type": "missing-venue",
    "severity": "critical",
    "venue": "Rice-Eccles Stadium",
    "gameCount": 3
  },
  {
    "type": "missing-logo",
    "severity": "enhancement",
    "team": "Utah",
    "gameCount": 12
  }
]
```

## Dependencies

- Story 01 (needs venues.json with city/state)
- Story 02 (needs team-espn-ids.json)

## Estimated Effort

Medium (4-5 hours)
