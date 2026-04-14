# musashi-research-frontline-104th

This project is a static website (HTML/CSS/JS) for Musashi Research Frontline.

## Goal

- Publish with GitHub Pages
- Update the public page quickly when JSON is changed

## Files used for schedule data

- data/researches.json
- script.js (loads JSON)

## Quick setup (first time)

1. Create a new GitHub repository.
2. Push this project to the `main` branch.
3. Open repository Settings -> Pages.
4. In Build and deployment, choose Source = `GitHub Actions`.
5. Push once (or run Actions manually) to deploy.

After the first successful run, your site URL will be:

- https://<your-user-name>.github.io/<repository-name>/

## Daily update flow (JSON only)

1. Edit `data/researches.json`.
2. Commit and push to `main`.
3. Wait for the `Deploy static site to GitHub Pages` workflow to finish.
4. Open your site URL and verify updates.

## Why updates are reflected quickly

- `script.js` fetches `data/researches.json` with a timestamp query parameter.
- This avoids stale browser/CDN cache and helps new JSON appear quickly.

## Manual redeploy

If you need to redeploy without code changes:

1. Open GitHub -> Actions.
2. Select `Deploy static site to GitHub Pages`.
3. Click `Run workflow`.

## Notes for beginners

- Never edit files directly in the deployed site URL.
- Always edit files in this repository and push.
- If update is not visible immediately, hard refresh once.
