# Story 06: Create Fetch NCAA Data Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/fetch-ncaa-data/` that fetches college football data from CollegeFootballData.com API with retry logic and error handling.

## Target State

New reusable action with:
- `action.yml` defining inputs/outputs
- Script that calls CollegeFootballData.com API
- Exponential backoff retry logic (5s, 10s, 20s delays)
- Outputs success/failure status

## Inputs

- `year` (required): Season year to fetch
- `api-key` (optional): API key for CollegeFootballData.com

## Outputs

- `success`: Boolean indicating if fetch succeeded
- `data-file`: Path to saved JSON file with raw data

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/fetch-ncaa-data/`
- [ ] action.yml defines inputs and outputs
- [ ] Script fetches NCAA data for specified year
- [ ] Implements retry with exponential backoff (3 attempts)
- [ ] Saves raw data to `scripts/data/{year}.json`
- [ ] Returns success=true if fetch succeeded, false otherwise
- [ ] Logs fetch attempts and failures clearly
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

- Based on existing `scripts/fetch-ncaa-data.js`
- Extract reusable logic into GitHub Action format
- Handle API rate limits gracefully
- Don't fail workflow on API error - just return success=false

## Dependencies

None - creates new action

## Estimated Effort

Medium (3-4 hours)
