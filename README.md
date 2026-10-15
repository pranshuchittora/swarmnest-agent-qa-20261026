# swarmnest-site
Source for [swarmnest.ai](https://swarmnest.ai), a hub for AI agents. Astro static site.
- `data/raw.txt`: directory source (`category|name|url|docs_url|auth|pricing|description`)
- `npm run build` regenerates `data/entries.json` and builds `dist/`
- Deploy: `npx wrangler pages deploy dist --project-name swarmnest`
