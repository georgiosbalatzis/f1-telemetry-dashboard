#!/usr/bin/env bash
set -euo pipefail

# Dependencies check: curl and jq must be installed
command -v curl >/dev/null 2>&1 || { echo >&2 "curl is required. Aborting."; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo >&2 "jq is required. Aborting.";   exit 1; }

BASE_URL="https://api.openf1.org/v1"
YEARS=(2023 2024 2025)
ENDPOINTS=(car_data drivers intervals laps location meetings pit position race_control sessions stints team_radio)

# Create data directory
mkdir -p data

for YEAR in "${YEARS[@]}"; do
  echo "=== Processing season $YEAR ==="

  # Initialize empty JSON arrays for each endpoint
  for EP in "${ENDPOINTS[@]}"; do
    echo "[]" > "data/${EP}_${YEAR}.json"
  done

  # 1) Fetch all meeting keys for the season
  MEETINGS=$(curl -s "${BASE_URL}/meetings?year>=${YEAR}" | jq -r '.[].meeting_key')
  echo "Found meetings for $YEAR: $MEETINGS"

  # 2) Iterate meetings and endpoints
  for MK in $MEETINGS; do
    echo "-- Meeting $MK --"
    for EP in "${ENDPOINTS[@]}"; do
      URL="${BASE_URL}/${EP}?meeting_key=${MK}"
      echo "Fetching ${EP}..."
      RESP=$(curl -s "$URL")

      # Skip if empty
      if [[ -n "$RESP" && "$RESP" != "null" ]]; then
        # Merge into the year-endpoint JSON array
        jq --argjson new "$RESP" '. + $new' "data/${EP}_${YEAR}.json" \
           > "data/${EP}_${YEAR}.tmp" \
         && mv "data/${EP}_${YEAR}.tmp" "data/${EP}_${YEAR}.json"
      fi
    done
  done

  echo "Finished season $YEAR."
done

echo "All data fetched. Look in the data/ directory."
