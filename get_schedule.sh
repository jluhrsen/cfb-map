#!/bin/bash

YEAR="$1"
TEAM="$2"

if [[ -z "$YEAR" || -z "$TEAM" ]]; then
  echo "Usage: ./get_schedule.sh <year> <team name>"
  exit 1
fi

API_KEY=$(<.collegefootballdata_api.key)


# Fetch schedule data from CollegeFootballData API
RESPONSE=$(curl -s -G \
  --data-urlencode "year=$YEAR" \
  --data-urlencode "team=$TEAM" \
  -H "Authorization: Bearer $API_KEY" \
  https://api.collegefootballdata.com/games)

# Begin JS file
echo "export const ${TEAM// /_}_GAMES = ["

# Parse JSON and format each game
echo "$RESPONSE" | jq -r --arg TEAM "$TEAM" '
  .[] | {
    week, start_date, home_team, away_team, venue,
    kickoff: (.start_date | if . then (. | split("T")[1] | split(":")[0] | tonumber) else null end),
    logos: {
      home: .home_team_logo,
      away: .away_team_logo
    }
  } | 
  "  {\n    week: \(.week),\n    date: \"\(.start_date | split("T")[0])\",\n    day: \"\",\n    kickoff: \"\(.kickoff)h\",\n    home: \"\(.home_team)\",\n    away: \"\(.away_team)\",\n    homeLogo: \"\(.logos.home)\",\n    awayLogo: \"\(.logos.away)\",\n    location: { lat: 0.0, lng: 0.0, venue: \"\(.venue)\" }\n  },"
'

# End JS array
echo "];"

