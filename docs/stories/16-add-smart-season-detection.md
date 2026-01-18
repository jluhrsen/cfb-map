# Story 16: Add Smart Season Detection to Frontend

## Description

Update `src/contexts/FilterContext.js` to automatically detect and default to the appropriate football season based on current date (off-season shows upcoming season, active season shows current).

## Current Behavior

Defaults to hardcoded 2025:
```javascript
const [selectedYear, setSelectedYear] = useState(() =>
  getStoredValue('selectedYear', 2025)
);
```

## Target Behavior

Smart default based on calendar:
- Feb-Jul (off-season): Default to upcoming season
- Aug-Jan (active season): Default to current season
- January counts as part of previous year's season

## Acceptance Criteria

- [ ] FilterContext.js has getCurrentFootballSeason() function
- [ ] Function returns correct season based on date
- [ ] Feb-Jul returns current calendar year (upcoming season)
- [ ] Aug-Dec returns current calendar year (active season)
- [ ] January returns previous calendar year (still active season)
- [ ] selectedYear defaults to getCurrentFootballSeason() if no localStorage value
- [ ] User's manual selection still persists in localStorage
- [ ] Changes committed to git

## Implementation Notes

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
  // Jan 2026 is part of 2025 season
  return month === 1 ? year - 1 : year;
}

// In FilterContext
const [selectedYear, setSelectedYear] = useState(() =>
  getStoredValue('selectedYear', getCurrentFootballSeason())
);
```

## Dependencies

None - standalone frontend change

## Estimated Effort

Small (1 hour)
