# Story 12: Create GitHub Issues Management Action

## Description

Create a reusable GitHub Action at `.github/actions/create-issues/` that creates, updates, and auto-closes GitHub Issues based on validation results with severity tagging and deduplication.

## Target State

New reusable action that:
- Takes issue list from validate-data
- Creates new issues with severity labels
- Updates existing issues with status comments
- Auto-closes resolved issues
- Never creates duplicates

## Inputs

- `issues`: JSON array of issues from validate-data
- `github-token`: GitHub token for API access

## Outputs

- `issues-created`: Count of new issues created
- `issues-updated`: Count of existing issues updated
- `issues-closed`: Count of issues auto-closed

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/create-issues/`
- [ ] action.yml defines inputs and outputs
- [ ] Creates GitHub Issues with severity labels (critical/enhancement/warning)
- [ ] Checks for existing issues by title before creating
- [ ] Updates existing open issues with status comments
- [ ] Auto-closes issues when problems are resolved
- [ ] Never creates duplicate issues
- [ ] Uses GitHub API (octokit)
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

Issue title patterns:
- `[CRITICAL] Missing venue: {venue_name}`
- `[ENHANCEMENT] Missing logo: {team_name}`
- `[WARNING] NCAA API failed 3+ consecutive days`

Auto-close logic:
```javascript
async function checkIfResolved(issue) {
  if (issue.title.includes('Missing venue:')) {
    const venueName = extractVenueName(issue.title);
    const exists = venues[venueName] !== undefined;
    if (exists) {
      await closeIssue(issue.number, 'Resolved: venue now in venues.json');
    }
  }
  // ... similar for logos, ESPN IDs, etc.
}
```

Deduplication:
```javascript
async function findExistingIssue(title) {
  const issues = await octokit.issues.listForRepo({
    owner, repo,
    state: 'all', // search both open and closed
  });
  return issues.data.find(i => i.title === title);
}
```

## Dependencies

- Story 08 (needs validate-data to generate issue list)

## Estimated Effort

Large (6-8 hours)
