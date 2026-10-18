# Deployment Guide

## GitHub Secrets Setup

To enable automated builds, you need to add your CollegeFootballData API key to GitHub Secrets:

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CFBD_API_KEY`
5. Value: Your API key from `.collegefootballdata_api.key`
6. Click "Add secret"

## Manual Trigger

To manually trigger a data update:

1. Go to Actions tab on GitHub
2. Select "Daily Data Update" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Local Development

To build data locally:

```bash
# Set API key
export CFBD_API_KEY=$(cat .collegefootballdata_api.key)

# Run build process
npm run build:data

# Start dev server
npm start
```

## Deployment

The site is served by GitHub Pages at **https://cfb.luhrsenlounge.net**. The
custom domain comes from `public/CNAME`, which the build copies into `build/`;
the `actions-gh-pages` step also sets `cname:` on every publish. If that file
goes missing from the publish directory, Pages reverts to
`jluhrsen.github.io/cfb-map/` and the custom domain breaks.

Publishing is **not** triggered by pushing to `main`. `daily-update.yml` runs
only on its 06:00 ET schedule and on `workflow_dispatch`, so a push alone
changes nothing that is live. To publish:

- **Automatically** — wait for the daily run, which fetches fresh data and then
  deploys.
- **On demand** — Actions tab, "Daily Data Update", "Run workflow".
- **From a laptop** — `npm run deploy` (builds, then `gh-pages -d build`).

`ship` (the Claude skill) runs the laptop path and verifies the result;
`.ship.yaml` in the repo root holds its targets.

## Monitoring

- Check GitHub Actions tab for build status
- Build runs daily at 6:00 AM ET
- Email notifications sent on failure (configure in Settings)
