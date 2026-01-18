# Story 20: Populate Comprehensive FCS Venue Database

## Description

Research and add all ~130 FCS football stadiums to `src/data/venues.json` with name, coordinates (lat/lng), city, and state.

## Target State

venues.json contains entries for all FCS programs' home stadiums.

## Acceptance Criteria

- [ ] All FCS stadiums added to venues.json
- [ ] Each entry has: name, lat, lng, city, state
- [ ] Coordinates verified to be accurate
- [ ] State uses 2-letter abbreviations
- [ ] File validates as proper JSON
- [ ] Changes committed to git

## Implementation Notes

FCS conferences to cover:
- Big Sky (~13 teams)
- CAA (~13 teams)
- Missouri Valley (~11 teams)
- Southland (~9 teams)
- Southern (~9 teams)
- Big South-OVC (~10 teams)
- SWAC (~12 teams)
- MEAC (~8 teams)
- Patriot League (~7 teams)
- Ivy League (~8 teams)
- Northeast (~10 teams)
- Pioneer (~11 teams)
- Independents (~7 teams)

**Total: ~130 stadiums**

Data sources:
- Wikipedia: "List of NCAA Division I FCS football programs"
- School athletics websites
- Google Maps for coordinates

Can be broken into chunks by conference.

## Dependencies

- Story 01 (establishes format)
- Story 19 (same process, different division)

## Estimated Effort

Large (8-12 hours of research and data entry)

**Note:** Can be done in parallel with Story 19 and 21.
