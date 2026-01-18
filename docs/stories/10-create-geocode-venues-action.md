# Story 10: Create Geocode Venues Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/geocode-venues/` that auto-discovers missing venue coordinates using OpenStreetMap Nominatim API with confidence validation.

## Target State

New reusable action that:
- Takes list of missing venues from validate-data
- Queries Nominatim for each venue
- Auto-adds high-confidence matches to venues.json
- Returns list of venues that need manual review

## Inputs

- `missing-venues`: JSON array of venue names needing coordinates
- `city-state-hints`: Optional JSON mapping venue names to city/state

## Outputs

- `venues-added`: Count of venues auto-added
- `venues-needing-review`: JSON array of low-confidence matches

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/geocode-venues/`
- [ ] action.yml defines inputs and outputs
- [ ] Queries Nominatim API for missing venues
- [ ] Respects 1 request/second rate limit
- [ ] High-confidence criteria: stadium type tag AND city/state match
- [ ] Auto-adds high-confidence venues to venues.json
- [ ] Returns low-confidence venues for manual review
- [ ] Logs geocoding attempts and results
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

High-confidence check:
```javascript
function isHighConfidence(result, expectedCity, expectedState) {
  const hasStadiumType = ['stadium', 'sports_centre', 'arena'].includes(result.type);
  const cityMatch = result.address.city === expectedCity;
  const stateMatch = result.address.state === expectedState;
  return hasStadiumType && cityMatch && stateMatch;
}
```

Rate limiting:
```javascript
async function geocodeWithDelay(venues) {
  for (const venue of venues) {
    await geocode(venue);
    await sleep(1000); // 1 second delay
  }
}
```

## Dependencies

- Story 01 (needs venues.json with city/state)
- Story 08 (needs validate-data to identify missing venues)

## Estimated Effort

Large (6-8 hours)
