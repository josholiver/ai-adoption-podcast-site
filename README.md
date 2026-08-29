# The AI Adoption Podcast — website

A static site for the podcast, built to be hosted free on **GitHub Pages**. Episodes
pull automatically from the show's YouTube channel — no API key, no manual updates.

## What's in here

```
index.html                        the whole site (one page)
css/style.css                     brand system: navy / paper / coral / slate
js/app.js                         loads data/episodes.json and renders the hero + grid
data/episodes.json                episode data (auto-updated by the GitHub Action)
scripts/fetch-episodes.mjs        pulls the YouTube RSS feed, rewrites episodes.json
.github/workflows/update-episodes.yml   scheduled Action that runs the script daily
```

## 1. Put this on GitHub

1. Create a new repository on GitHub (public, so Pages can serve it for free).
2. Upload all these files to it — either drag-and-drop them in the GitHub web UI
   ("Add file → Upload files"), or if you're comfortable with git:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

## 2. Turn on GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to `Deploy from a branch`.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Your site goes live at `https://YOUR-USERNAME.github.io/YOUR-REPO/` within a
   minute or two.

If you'd rather use a custom domain (e.g. `theaiadoptionpodcast.com`), add it under
the same Pages settings — GitHub gives you the DNS records to add at your domain
registrar.

## 3. Let the episodes update themselves

The workflow in `.github/workflows/update-episodes.yml` is already wired up. Once
the repo is on GitHub:

- It runs automatically **once a day** and pulls any new videos from
  `youtube.com/@aiadoption-conversations`, rewriting `data/episodes.json`.
- It only commits when something actually changed, so your history stays clean.
- You can also trigger it manually any time: go to the **Actions** tab →
  "Update episodes from YouTube" → **Run workflow**.

The very first run will replace the seed data in `data/episodes.json` with real
video IDs and thumbnails pulled straight from YouTube. After that, publishing a new
episode on YouTube is the *only* step needed — the site catches up within a day (or
instantly if you run the workflow manually).

### Adding guest names automatically-fetched episodes don't have

YouTube's RSS feed doesn't include a "guest name" field, since that's specific to
your show, not YouTube's data model. The fetch script is written to **preserve**
whatever guest name/role/duration you've already typed into `data/episodes.json`
for a given video, so:

1. After the first automated run, open `data/episodes.json`.
2. Fill in `guestName`, `guestRole`, and `duration` for each episode.
3. Commit that change.

From then on, new episodes will arrive with blank guest fields (safe to fill in
whenever), and existing ones won't be overwritten.

## 4. Local preview (optional)

No build step is required — it's plain HTML/CSS/JS. To preview locally before
pushing, run any static server from the project folder, e.g.:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Editing the design

Everything for colors, spacing, and type lives in `css/style.css` as CSS custom
properties at the top of the file (`--ink-navy`, `--paper`, `--signal-coral`,
`--slate`). Change one value there and it updates across the whole site.
