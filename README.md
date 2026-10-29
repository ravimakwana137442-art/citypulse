# CityPulse · Smart City Citizen Complaint Portal

A zero-build, single-page web app prototype for reporting and tracking civic issues.

**Features:** live stats dashboard · filterable complaint feed (category tabs, status filter, search) · report form with image preview · generated ticket IDs · toasts and notifications · detail modal with timeline, progress bar, assigned officer, comments, and status advancing · emergency helpline widget.

**Stack:** HTML5, vanilla JavaScript, Tailwind CSS (CDN), Plus Jakarta Sans.

## Run locally
Open `index.html` in a browser (needs internet for the Tailwind CDN), or run `python3 -m http.server 8000`.

## Deploy
Pushing to `main` deploys to GitHub Pages via `.github/workflows/pages.yml`
(enable it once under **Settings → Pages → Source: GitHub Actions**).

## Structure
```
index.html
assets/css/style.css
assets/js/app.js
.github/workflows/pages.yml
```
Data is in-memory seed data; it resets on refresh.
