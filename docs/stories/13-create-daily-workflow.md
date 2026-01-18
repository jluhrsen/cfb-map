# Story 13: Create Daily Update Workflow

## Description

Create the main GitHub Actions workflow at `.github/workflows/daily-update.yml` that orchestrates all reusable actions to fetch, validate, geocode, generate, and deploy data daily.

## Target State

New workflow that runs daily at 2am UTC and:
1. Determines active seasons (current + next year)
2. Fetches NCAA and NFL data for each season
3. Validates data quality
4. Auto-geocodes missing venues
5. Auto-discovers missing logos
6. Generates static JSON files
7. Creates/updates GitHub Issues
8. Commits changes
9. Deploys to GitHub Pages

## Acceptance Criteria

- [ ] Workflow file created at `.github/workflows/daily-update.yml`
- [ ] Runs on schedule (cron: '0 2 * * *' = 2am UTC daily)
- [ ] Has manual trigger option (workflow_dispatch)
- [ ] Calls all reusable actions in correct order
- [ ] Processes current year and next year
- [ ] Commits changes if data updated
- [ ] Deploys to GitHub Pages
- [ ] Workflow succeeds even if APIs fail (uses cached data)
- [ ] Logs clearly show which steps succeeded/failed
- [ ] Changes committed to git

## Implementation Notes

Workflow structure:
```yaml
name: Daily Data Update

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Determine active seasons
        # Calculate current and next year

      - name: Fetch NCAA data (current year)
        uses: ./.github/actions/fetch-ncaa-data
        with:
          year: ${{ env.CURRENT_YEAR }}

      - name: Fetch NFL data (current year)
        uses: ./.github/actions/fetch-nfl-data
        with:
          year: ${{ env.CURRENT_YEAR }}

      - name: Fetch NCAA data (next year)
        uses: ./.github/actions/fetch-ncaa-data
        with:
          year: ${{ env.NEXT_YEAR }}

      - name: Fetch NFL data (next year)
        uses: ./.github/actions/fetch-nfl-data
        with:
          year: ${{ env.NEXT_YEAR }}

      - name: Validate data
        uses: ./.github/actions/validate-data

      - name: Geocode missing venues
        uses: ./.github/actions/geocode-venues

      - name: Lookup missing logos
        uses: ./.github/actions/lookup-logos

      - name: Generate data files
        uses: ./.github/actions/generate-files

      - name: Create/update issues
        uses: ./.github/actions/create-issues

      - name: Commit changes
        # git add, commit, push

      - name: Deploy to GitHub Pages
        # deploy step
```

## Dependencies

- Stories 06-12 (all reusable actions must exist)

## Estimated Effort

Medium (4-5 hours)
