# Story 14: Add February 1st Season Freeze Logic

## Description

Add logic to the daily workflow (Story 13) that stops fetching data for seasons after Feb 1st of the following year. This freezes historical seasons while continuing to update current/future seasons.

## Current Behavior

Workflow would fetch current + next year indefinitely.

## Target Behavior

- Before Feb 1, 2026: Fetch 2025 and 2026
- After Feb 1, 2026: Fetch only 2026 and 2027 (stop updating 2025)
- After Feb 1, 2027: Fetch only 2027 and 2028 (stop updating 2026)
- Etc.

## Acceptance Criteria

- [ ] Workflow checks current date
- [ ] Determines which seasons should be actively fetched
- [ ] On/after Feb 1: Stop fetching previous season
- [ ] Always fetch current season + 1 year ahead
- [ ] Frozen seasons remain in public/data/ but are never updated
- [ ] Logs clearly show which seasons are being fetched vs frozen
- [ ] Changes committed to git

## Implementation Notes

Cutoff logic:
```javascript
function getActiveSeasons() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let currentSeason, nextSeason;

  if (month >= 2 && month <= 7) {
    // Off-season (Feb-Jul): current year is the upcoming season
    currentSeason = year;
    nextSeason = year + 1;
  } else if (month >= 8 && month <= 12) {
    // Active season (Aug-Dec): current year is the active season
    currentSeason = year;
    nextSeason = year + 1;
  } else {
    // January: still part of previous year's season
    currentSeason = year - 1;
    nextSeason = year;
  }

  return [currentSeason, nextSeason];
}
```

Add to workflow:
```yaml
- name: Determine active seasons
  run: |
    # Call getActiveSeasons()
    echo "CURRENT_SEASON=2026" >> $GITHUB_ENV
    echo "NEXT_SEASON=2027" >> $GITHUB_ENV
```

## Dependencies

- Story 13 (needs daily workflow to exist)

## Estimated Effort

Small (1-2 hours)
