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

The app automatically deploys to GitHub Pages after successful builds.

Access at: `https://<username>.github.io/cfb-map/`

## Monitoring

- Check GitHub Actions tab for build status
- Build runs daily at 6:00 AM ET
- Email notifications sent on failure (configure in Settings)
