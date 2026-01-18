# Story 15: Add Consecutive API Failure Tracking

## Description

Implement consecutive failure tracking in the daily workflow (Story 13) using `.github/api-health.json` to only create "warning" issues when APIs fail 3+ days in a row.

## Current Behavior

Workflow would create issue on first API failure (too noisy).

## Target Behavior

- Day 1 API fails: Increment counter to 1, no issue
- Day 2 API fails: Increment counter to 2, no issue
- Day 3 API fails: Increment counter to 3, create "warning" issue
- Day 4 API succeeds: Reset counter to 0, auto-close warning issue if open

## Acceptance Criteria

- [ ] Workflow reads `.github/api-health.json` at start
- [ ] After each API call, updates failure counters
- [ ] Counter increments on failure, resets to 0 on success
- [ ] Only creates warning issue when counter >= 3
- [ ] Commits updated api-health.json back to repo
- [ ] Logs show current failure counts
- [ ] Changes committed to git

## Implementation Notes

Add workflow steps:
```yaml
- name: Read API health status
  run: |
    if [ -f .github/api-health.json ]; then
      cat .github/api-health.json
      # Parse counters into env vars
    fi

- name: Fetch NCAA data
  id: fetch-ncaa
  uses: ./.github/actions/fetch-ncaa-data
  continue-on-error: true

- name: Update NCAA failure counter
  run: |
    if [ "${{ steps.fetch-ncaa.outputs.success }}" == "true" ]; then
      # Reset counter to 0
      ncaa_failures=0
    else
      # Increment counter
      ncaa_failures=$((ncaa_failures + 1))
    fi
    # Update api-health.json

- name: Check if warning issue needed
  run: |
    if [ $ncaa_failures -ge 3 ]; then
      # Add to issues list for create-issues action
    fi

- name: Commit API health file
  run: |
    git add .github/api-health.json
    git commit -m "Update API health tracking"
```

## Dependencies

- Story 03 (needs api-health.json file)
- Story 12 (needs create-issues action)
- Story 13 (needs daily workflow)

## Estimated Effort

Medium (3-4 hours)
