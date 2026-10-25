#!/bin/bash
# usage: ./ship.sh "commit message"   build -> staging verify -> commit/push -> prod deploy -> prod verify
set -e; cd /workspace/swarmnest-site; export CLOUDFLARE_ACCOUNT_ID=e48ffb81a1db5717af9ab1a0bfb937f8
before=$(curl -s -A Swarmnest/1.0 https://swarmnest.ai/api/v1/directory.json | python3 -c "import sys,json;print(json.load(sys.stdin)['count'])")
npm run build > /tmp/build.log 2>&1 || { grep -E "ERROR|rror" /tmp/build.log | head; echo BUILD FAILED; exit 1; }; grep -E "entries|redirect rules" /tmp/build.log
node scripts/scan-copy.mjs dist || { echo "COPY SCAN FAILED: fix the matches above (or allowlist a real product name in scripts/scan-copy.mjs)"; exit 1; }
now=$(python3 -c "import json;print(len(json.load(open('data/entries.json'))))")
[ "$now" -ge "$(( before - ${ALLOW_DECREASE:-0} ))" ] || { echo "ENTRY COUNT DECREASED $before -> $now (set ALLOW_DECREASE=N only for user-approved removals)"; exit 1; }
npx wrangler pages deploy dist --project-name swarmnest --branch staging --commit-dirty=true 2>&1 | grep -E "alias|rror"
sleep 8; curl -s -A Swarmnest/1.0 -o /dev/null -w 'staging home %{http_code}\n' https://staging.swarmnest.pages.dev/  # full crawl only on prod (static pages no longer cost Functions quota)
git add -A . ':!package-lock.json'; git -c user.name=Swarmnest -c user.email=hello@swarmnest.ai commit -qm "$1"; git push -q "https://x-access-token:$GITHUB_TOKEN@github.com/swarmnest/swarmnest-site.git" HEAD:main
npx wrangler pages deploy dist --project-name swarmnest --branch main 2>&1 | grep -E "complete|rror"
sleep 15; node scripts/verify.mjs https://swarmnest.ai | tail -8
node scripts/indexnow.mjs || echo "indexnow failed (non-fatal)"
if [ -n "$(git status --porcelain data/indexnow-state.json)" ]; then git add data/indexnow-state.json; git -c user.name=Swarmnest -c user.email=hello@swarmnest.ai commit -qm "IndexNow state" && git push -q "https://x-access-token:$GITHUB_TOKEN@github.com/swarmnest/swarmnest-site.git" HEAD:main || echo "state push failed (non-fatal)"; fi
echo "entries $before -> $now; commit $(git rev-parse --short HEAD)"
