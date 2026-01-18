# Story 11: Create Lookup Logos Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/lookup-logos/` that auto-discovers team logos using ESPN API and CDN URL patterns.

## Target State

New reusable action that:
- Takes list of teams without logos from validate-data
- Looks up ESPN IDs via API (if not in team-espn-ids.json)
- Tests ESPN CDN URLs for logos
- Auto-adds working logos to team-logos.json
- Returns list of teams needing manual logo work

## Inputs

- `missing-logos`: JSON array of team names needing logos
- `missing-espn-ids`: JSON array of teams without ESPN ID mapping

## Outputs

- `logos-added`: Count of logos auto-added
- `espn-ids-added`: Count of ESPN ID mappings added
- `teams-needing-review`: JSON array of teams logo/ID not found

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/lookup-logos/`
- [ ] action.yml defines inputs and outputs
- [ ] Queries ESPN API to find team IDs
- [ ] Tests logo URLs (HTTP HEAD request to verify 200 OK)
- [ ] Auto-adds working logos to team-logos.json
- [ ] Auto-adds ESPN IDs to team-espn-ids.json
- [ ] Returns teams where logo/ID not found
- [ ] Logs lookup attempts and results
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

ESPN logo URL pattern:
```
https://a.espncdn.com/i/teamlogos/ncaa/500/{ESPN_ID}.png
```

Logo validation:
```javascript
async function testLogoUrl(url) {
  const response = await fetch(url, { method: 'HEAD' });
  return response.status === 200;
}
```

ESPN API search (pseudo-code):
```javascript
async function findEspnId(teamName) {
  const results = await espnApi.searchTeams(teamName);
  if (results.length === 1) return results[0].id;
  // Handle multiple matches or no matches
  return null;
}
```

## Dependencies

- Story 02 (needs team-espn-ids.json)
- Story 08 (needs validate-data to identify missing logos)

## Estimated Effort

Large (6-8 hours)
