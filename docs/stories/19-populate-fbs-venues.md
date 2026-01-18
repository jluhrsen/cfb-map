# Story 19: Populate Comprehensive FBS Venue Database

## Description

Research and add all ~130 FBS football stadiums to `src/data/venues.json` with name, coordinates (lat/lng), city, and state.

## Target State

venues.json contains entries for all FBS programs' home stadiums.

## Acceptance Criteria

- [ ] All FBS stadiums added to venues.json
- [ ] Each entry has: name, lat, lng, city, state
- [ ] Coordinates verified to be accurate (stadium location, not campus)
- [ ] State uses 2-letter abbreviations
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

FBS conferences to cover:
- Big Ten (~18 teams)
- SEC (~16 teams)
- ACC (~17 teams)
- Big 12 (~16 teams)
- Pac-12 (~12 teams)
- American Athletic (~14 teams)
- Mountain West (~12 teams)
- Conference USA (~9 teams)
- Sun Belt (~14 teams)
- Independents (~7 teams: Notre Dame, Army, Navy, UConn, UMass, Liberty, NMSU)

**Total: ~135 stadiums**

Data sources:
- Wikipedia: "List of NCAA Division I FBS football stadiums"
- ESPN college football stadium pages
- Google Maps for coordinates
- School athletics websites

Example research process for one stadium:
1. Find stadium name on Wikipedia list
2. Look up on Google Maps
3. Right-click stadium → "What's here?" to get lat/lng
4. Verify city and state
5. Add to venues.json

## Dependencies

- Story 01 (establishes format with city/state)

## Estimated Effort

Large (8-12 hours of research and data entry)

**Note:** This is manual work but only needs to be done once. Can be broken into smaller chunks (by conference).
