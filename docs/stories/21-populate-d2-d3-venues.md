# Story 21: Populate Comprehensive D2 and D3 Venue Database

## Description

Research and add all ~420 D2 and D3 football stadiums to `src/data/venues.json` with name, coordinates (lat/lng), city, and state.

## Target State

venues.json contains entries for all D2 and D3 programs' home stadiums.

## Acceptance Criteria

- [ ] All D2 stadiums added to venues.json (~170 stadiums)
- [ ] All D3 stadiums added to venues.json (~250 stadiums)
- [ ] Each entry has: name, lat, lng, city, state
- [ ] Coordinates verified to be accurate
- [ ] State uses 2-letter abbreviations
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

**Division II** (~170 programs across conferences):
- CIAA, GAC, GLIAC, GLVC, GMC, GNAC, Great Midwest, Gulf South, MEC, MIAA, NE10, NSIC, PSAC, PBC, RMAC, SAC, SIAC, etc.

**Division III** (~250 programs across conferences):
- CCIW, Centennial, Empire 8, Heartland, Liberty League, MASCAC, MIAC, Michigan, Middle Atlantic, NESCAC, New Jersey, North Coast, Northwest, ODAC, Old Dominion, Presidents', SCAC, Southern, UMAC, Upper Midwest, USA South, Wisconsin, etc.

**Total: ~420 stadiums**

Data sources:
- NCAA official lists of D2 and D3 programs
- School athletics websites (often have stadium addresses)
- Google Maps for coordinates

**Strategy:** This is the largest chunk. Consider breaking down by:
- Geographic region (Northeast, Southeast, Midwest, West)
- Conference groupings
- Can tackle D2 and D3 separately

## Dependencies

- Story 01 (establishes format)

## Estimated Effort

Very Large (16-24 hours of research and data entry)

**Note:** This is the most time-consuming story. Consider:
- Breaking into smaller sub-stories by conference or region
- Potentially using crowdsourcing or existing datasets if available
- Can be done in parallel with Stories 19-20
- May want to start with just the conferences whose teams appear in your current data
