#!/bin/bash
# usage: ./ship.sh "commit message"   build -> staging verify -> commit/push -> prod deploy -> prod verify
set -e; cd /workspace/swarmnest-site; export CLOUDFLARE_ACCOUNT_ID=e48ffb81a1db5717af9ab1a0bfb937f8
before=$(curl -s -A Swarmnest/1.0 https://swarmnest.ai/api/v1/directory.json | python3 -c "import sys,json;print(json.load(sys.stdin)['count'])")
npm run build 2>&1 | grep -E "entries|redirect rules|rror" || true
now=$(python3 -c "import json;print(len(json.load(open('data/entries.json'))))")
[ "$now" -ge "$before" ] || { echo "ENTRY COUNT DECREASED $before -> $now"; exit 1; }
npx wrangler pages deploy dist --project-name swarmnest --branch staging --commit-dirty=true 2>&1 | grep -E "alias|rror"
sleep 8; node scripts/verify.mjs https://staging.swarmnest.pages.dev | tail -8
git add -A . ':!package-lock.json'; git -c user.name=Swarmnest -c user.email=hello@swarmnest.ai commit -qm "$1"; git push -q "https://x-access-token:$GITHUB_TOKEN@github.com/swarmnest/swarmnest-site.git" HEAD:main
npx wrangler pages deploy dist --project-name swarmnest --branch main 2>&1 | grep -E "complete|rror"
sleep 15; node scripts/verify.mjs https://swarmnest.ai | tail -8
echo "entries $before -> $now; commit $(git rev-parse --short HEAD)"
