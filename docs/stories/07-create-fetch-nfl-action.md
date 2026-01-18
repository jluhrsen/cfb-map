# Story 07: Create Fetch NFL Data Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/fetch-nfl-data/` that fetches NFL data from ESPN API with retry logic and error handling.

## Target State

New reusable action with:
- `action.yml` defining inputs/outputs
- Script that calls ESPN NFL API
- Exponential backoff retry logic (5s, 10s, 20s delays)
- Outputs success/failure status

## Inputs

- `year` (required): Season year to fetch

## Outputs

- `success`: Boolean indicating if fetch succeeded
- `data-file`: Path to saved JSON file with raw data

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/fetch-nfl-data/`
- [ ] action.yml defines inputs and outputs
- [ ] Script fetches NFL data for specified year
- [ ] Implements retry with exponential backoff (3 attempts)
- [ ] Merges NFL data into `scripts/data/{year}.json` (combine with NCAA)
- [ ] Returns success=true if fetch succeeded, false otherwise
- [ ] Logs fetch attempts and failures clearly
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

- Based on existing `scripts/fetch-nfl-data.js`
- NFL data should merge with NCAA data in same year file
- Handle ESPN API quirks and rate limits
- Don't fail workflow on API error - just return success=false

## Dependencies

None - creates new action (but will run after fetch-ncaa-data in workflows)

## Estimated Effort

Medium (3-4 hours)
