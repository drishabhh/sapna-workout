# Sapna Workout

Personal static workout page for Sapna — stretches, cardio, and strength with form demos.

**Live:** https://drishabhh.github.io/sapna-workout/

## Local

Open `index.html` in a browser, or:

```bash
npx --yes serve .
```

## Admin (post today’s plan)

The public page loads `data/today.json`. If missing/invalid, it falls back to the built-in default workout.

1. Open the live site → tap the **Admin** button (top-right). Footer also has an Admin link.
2. Enter the Admin password (ask the site owner if you don’t have it).
3. **One-time setup:** create a GitHub Personal Access Token with **`repo`** scope (classic PAT is fine), paste it under “Publish setup”, click **Save token**. It stays only in that browser’s `localStorage`.
4. Edit headline / rest note / exercises (order, stretch vs main, sets·reps·weight, GIF URL or file upload).
5. Click **Post / Publish**. That commits `data/today.json` (and any uploaded GIFs under `media/`) to this repo’s `main` branch via the GitHub Contents API.
6. Wait ~30–60 seconds for GitHub Pages, then Sapna refreshes on any device to see the new plan.

**Preview on page** applies changes locally only (does not publish).

## Media credits

- **Strength / cardio GIFs:** [ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB) via jsDelivr CDN (self-hosted copies in `media/`).
- **Stretch demos (arm circles, torso rotations, bodyweight squats):** frame pairs from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense), assembled into looping GIFs.
- **Leg swings:** original CSS/SVG looping demo on the page (optional in admin).

## License note

Exercise media remains under each upstream project's terms. This page is a personal, non-commercial workout helper.


## GIF library (Admin picker)

Hierarchical browse: **Choose GIF → Stretching | Exercises → body part → GIFs** (search + aliases inside).

## GIF library (Admin picker)

`data/gif-library.json` lists ~880 named GIFs for the Admin picker (search + category filters):

- **Local** bundled files under `media/`
- **[ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB)** via jsDelivr CDN (`@v1.1.0`) — all stretching + cardio/plyo + common strength movements (presses, rows, curls, squats, etc.). Hotlinked per that project’s static API docs; not scraped from commercial sites.



## Admin security note

Admin unlock is a **strengthened client-side gate** (PBKDF2-SHA256 hash + browser rate limiting). It is meant to stop casual View Source bypasses, **not** bank-grade auth — a determined attacker with the shipped hash can still offline-brute. There is no server. Keep the GitHub PAT only for Post online, and treat the unlock password as a shared secret among trusted editors.
