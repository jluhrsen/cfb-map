# Story 01: Add City and State Fields to Venues

## Description

Enhance the `src/data/venues.json` file to include `city` and `state` fields for every venue. This enables geocoding validation (confirming auto-geocoded venues are in the right city/state).

## Current State

venues.json entries look like:
```json
{
  "War Memorial Stadium": {
    "lat": 41.3070,
    "lng": -105.5677
  }
}
```

## Target State

venues.json entries should include city and state:
```json
{
  "War Memorial Stadium": {
    "lat": 41.3070,
    "lng": -105.5677,
    "city": "Laramie",
    "state": "WY"
  }
}
```

## Acceptance Criteria

- [ ] All existing venues in venues.json have `city` and `state` fields added
- [ ] No venue has null/empty city or state
- [ ] State uses 2-letter abbreviations (e.g., "CA", "TX", "NY")
- [ ] International venues use country name in state field (e.g., "England", "Germany")
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

- ~60 venues currently in the file (NFL + some FBS/D3)
- Can look up city/state from the lat/lng coordinates using reverse geocoding
- Or manually verify each venue's location
- For stadiums you added recently, check the coordinates you used match the city

## Dependencies

None - this is a standalone task

## Estimated Effort

Small (1-2 hours)
