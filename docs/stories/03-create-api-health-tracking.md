# Story 03: Create API Health Tracking File

## Description

Create `.github/api-health.json` to track consecutive API failures. This prevents creating GitHub Issues for transient API blips (only alert after 3+ consecutive failures).

## Target State

New file at `.github/api-health.json`:
```json
{
  "ncaa_api_consecutive_failures": 0,
  "nfl_api_consecutive_failures": 0,
  "last_updated": "2026-01-17T00:00:00Z"
}
```

## Acceptance Criteria

- [ ] File created at `.github/api-health.json`
- [ ] Contains failure counters for NCAA and NFL APIs
- [ ] Includes last_updated timestamp
- [ ] File validates as proper JSON
- [ ] Add .github/api-health.json to .gitignore? (Or commit initial version)
- [ ] Changes committed to git

## Implementation Notes

- This file will be read and updated by GitHub Actions workflows
- Initial values should be 0 (no failures)
- Timestamp should use ISO 8601 format
- Consider whether this should be committed or git-ignored (recommend commit initial version, let Actions update it)

## Dependencies

None - creates new file

## Estimated Effort

Trivial (5 minutes)
