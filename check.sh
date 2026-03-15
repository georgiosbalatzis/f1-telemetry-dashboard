#!/bin/bash
# Run this from your project root: bash check.sh

echo "=== Checking file state ==="
echo ""

# Files that MUST exist
for f in \
  src/App.tsx \
  src/index.css \
  src/main.tsx \
  src/api/openf1.ts \
  src/hooks/useOpenF1.ts \
  src/components/F1TelemetryDashboard.tsx \
  vite.config.ts \
  index.html
do
  if [ -f "$f" ]; then
    echo "✅ $f"
  else
    echo "❌ MISSING: $f"
  fi
done

echo ""

# Files that MUST NOT exist (old/deleted)
for f in \
  src/App.css \
  src/components/f1teledash.tsx \
  src/components/f1-telemetry-dashboard.tsx \
  src/types/f1.ts \
  src/data/generators.ts
do
  if [ -f "$f" ]; then
    echo "⚠️  DELETE THIS: $f"
  else
    echo "✅ (gone) $f"
  fi
done

echo ""
echo "=== Checking imports ==="

# App.tsx should import F1TelemetryDashboard, NOT f1teledash
if grep -q "f1teledash" src/App.tsx 2>/dev/null; then
  echo "❌ App.tsx still imports old 'f1teledash' — replace App.tsx!"
elif grep -q "F1TelemetryDashboard" src/App.tsx 2>/dev/null; then
  echo "✅ App.tsx imports F1TelemetryDashboard"
else
  echo "⚠️  App.tsx has unexpected import"
fi

# App.tsx should import index.css, NOT App.css
if grep -q "App.css" src/App.tsx 2>/dev/null; then
  echo "❌ App.tsx imports App.css — replace App.tsx!"
elif grep -q "index.css" src/App.tsx 2>/dev/null; then
  echo "✅ App.tsx imports index.css"
fi

# vite.config.ts should have base path
if grep -q "base:" vite.config.ts 2>/dev/null; then
  echo "✅ vite.config.ts has base path"
else
  echo "❌ vite.config.ts missing base path — replace vite.config.ts!"
fi

echo ""
echo "=== Build test ==="
echo "Running: yarn build"
yarn build 2>&1 | tail -5
