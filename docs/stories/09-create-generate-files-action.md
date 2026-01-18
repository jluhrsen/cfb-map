# Story 09: Create Generate Files Reusable Action

## Description

Create a reusable GitHub Action at `.github/actions/generate-files/` that wraps the existing generate-data-files.js script for use in workflows.

## Target State

New reusable action that:
- Calls scripts/generate-data-files.js
- Processes all years in scripts/data/
- Generates public/data/{year}/ files
- Updates public/data/index.json

## Inputs

None (script discovers years automatically)

## Outputs

- `success`: Boolean indicating if generation succeeded
- `years-processed`: Array of years that were generated

## Acceptance Criteria

- [ ] Action directory created at `.github/actions/generate-files/`
- [ ] action.yml defines inputs and outputs
- [ ] Calls scripts/generate-data-files.js
- [ ] Outputs success status
- [ ] Outputs list of years processed
- [ ] Logs generation progress clearly
- [ ] Works when called from another workflow
- [ ] Changes committed to git

## Implementation Notes

- This is a thin wrapper around existing script
- Script should already handle multi-year (Story 05)
- Ensure script errors propagate to action failure

## Dependencies

- Story 05 (needs updated generate-data-files.js)

## Estimated Effort

Small (1 hour)
