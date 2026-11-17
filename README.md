# Panhandle Plumbing and Pools

Static website (plain HTML/CSS, no framework). Deploys to Vercel with no build step.

## Before you launch
1. Open `build.js` and set `SITE` to your real domain (canonical tags and sitemap use it).
2. Replace `YOUR_FORM_ID` in `build.js` with a free form endpoint from https://formspree.io (contact form).
3. Edit copy (About, reviews, services text) in `src/data.js`.
4. Run `node build.js` to regenerate every page, `sitemap.xml`, and `robots.txt`, then commit.

## Deploy
Push to GitHub, then in Vercel choose "Add New Project", import the repo, leave Framework Preset as "Other" and the build command empty. Add your domain under Project Settings > Domains.
