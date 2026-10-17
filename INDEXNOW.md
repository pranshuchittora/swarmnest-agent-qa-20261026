# IndexNow
Tells Bing and other IndexNow engines about new/changed pages immediately.
- Key file: public/3205e3fa2163157dfb7582edb2f7a986.txt (served at https://swarmnest.ai/3205e3fa2163157dfb7582edb2f7a986.txt, contents = key).
- scripts/indexnow.mjs reads dist/sitemap*.xml, hashes each built page, and POSTs only new/changed URLs (batches of 10,000) to https://api.indexnow.org/indexnow. 200/202 = success. State: data/indexnow-state.json (committed). Only successful batches update state.
- ship.sh runs it after production deploy + verify (non-fatal), then commits/pushes the state file.
- Weekly routine: runs ship.sh, so this step is automatic. Manual check: `node scripts/indexnow.mjs --dry` after a build.
- Static files only; never touches Functions routes.
