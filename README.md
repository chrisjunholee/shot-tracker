# Shot Tracker

An on-course shot tracker built on Adam Young's method, extended to cover the things his
paper card leaves out: whether the drive was actually playable, where approaches miss, and
every putt in full.

Runs entirely in the browser. No accounts, no server, no network needed once it's loaded.
All data stays in your phone.

---

## Deploying to GitHub Pages

1. Create a new repository at <https://github.com/new>. Public. Any name — `shot-tracker` works.
   Don't add a README (this folder has one).
2. On the empty repo page, click **uploading an existing file**.
3. Drag in all five files from this folder: `index.html`, `manifest.json`, `sw.js`,
   `icon-192.png`, `icon-512.png`. Commit.
4. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**
5. Wait 1–3 minutes. Your app is at `https://<your-username>.github.io/<repo-name>/`.

### Put it on your home screen

Open that URL on your phone.

- **iPhone:** Share → Add to Home Screen.
- **Android:** menu → Install app / Add to Home screen.

It then opens full-screen with no browser chrome and works with no signal — the service
worker caches everything on first load. Torrey's back nine has patchy coverage; this is
why that matters.

### Updating it later

Edit `index.html` in GitHub (pencil icon) and commit, or upload a replacement. Bump the
`CACHE` constant at the top of `sw.js` (`shot-tracker-v1` → `v2`) so installed copies pull
the new version instead of serving the cached one. GitHub's CDN takes a couple of minutes;
add `?v=2` to the URL to confirm you're seeing the new build.

---

## The tracking model

### What gets logged, and what doesn't

Adam Young's rule is **only note errors**. A drive in the fairway and an approach that
finishes on the green need no entry — writing them down costs attention and tells you
nothing. That principle is kept here, with one deliberate exception.

| Area | What you log |
|---|---|
| **Tee shot** | One tap always. Detail only when it wasn't good. |
| **Approach** | One tap always (green / missed / no shot). Detail only on a miss. |
| **Short game** | Only shots inside 50 yards, only when you took one. |
| **Putting** | **Every putt, in full.** |
| **Mental** | Only when a fault applied. |

Putting is the exception because make rates and strokes gained are ratios — they need the
denominator. If you only log the putts you miss, the numbers are meaningless.

A clean par is about five taps: score, tee result, green, two putts. Or one tap on
**Quick par**, then correct the putt distances.

### Tee shot

Four outcomes, worst to best:

- **Good** — in play *and* a clear shot at the green
- **Blocked** — in play but no shot (behind a tree, wrong side, blocked out)
- **Trouble** — recovery or punch-out only
- **Penalty** — OB, lost, hazard

The good/blocked split is the important one. Fairways-hit hides it: a ball three yards
into the first cut with a clean look is a fine drive, and a ball in the fairway behind a
bunker lip is not. Only when the drive wasn't good do you add direction, how far offline
(under 10 / 10–25 / 25–50 / 50+ yards), and strike — toe, heel, high, low.

Par 3s have no tee-shot card. The tee shot *is* the approach and is logged there, so it
counts toward greens in regulation and not toward driving stats.

### Approach

Green, missed, or no shot (laid up, or playing out after a penalty). "No shot" keeps
non-attempts out of the GIR denominator.

Miss location is a 3×3 grid — long-left through short-right. Over a season this is the
most useful single chart in the app: a consistent short-right pattern is a club-selection
and aim problem, not a swing problem, and it's fixable in an afternoon.

Strike separates **ground contact** (fat, thin) from **face contact** (toe, heel). They
have different causes and different fixes; Young's Strike Plan is the ground-contact work,
the Accuracy Plan is the directional work.

### Short game

Anything inside 50 yards: distance, lie, strike, and where it finished. Proximity is the
number that decides your up-and-down rate — technique is downstream of it.

### Putting

Per putt: distance, break (left-to-right, right-to-left, straight), slope (uphill,
downhill, flat), and either holed or how much you left yourself plus why it missed.

Everything else derives from that: putt count, first-putt proximity, second-putt
proximity, make rate by distance, make rate by break direction, three-putt rate, lag
quality from 20+ feet, and strokes gained.

Make rate split by break direction is worth the extra tap on its own. A gap between
left-to-righters and right-to-lefters is an aim or read bias, it's invisible in normal
stats, and it's a one-session fix once you can see it.

### Mental and strategy

Young's eight faults — too aggressive strategy, mis-calculation, fear, club selection,
distracted, loss of cue-focus, mis-judged conditions, no commitment to decision — plus a
free-text note per hole. These are for good strikes on the intended line that still
produced a bad result.

---

## Reading the stats

**Where your shots are going** ranks your leaks by estimated strokes per round. Work
top-down; the ranking matters, not the decimals.

Putting uses real strokes gained against an approximate PGA Tour expected-putts curve.
Everything else uses flat per-error weights (a penalty tee shot is charged 1.1 shots, a
recovery 0.6, a fat or thin approach 0.45, a mental fault 0.5). Those weights are printed
under the list; they're in the `COST` object near the top of the stats section of
`index.html` if you ever want to change them.

The tour baselines are a yardstick, not a target. What matters is your own numbers moving.

---

## Your data

Everything is in this browser's local storage, on this device only. Nothing is uploaded.

That means: **export regularly.** Data → Export gives you a full JSON backup (restorable
from the same screen) and three CSVs — one row per shot, one row per round, one row per
putt — if you want to run your own analysis. Clearing browser data for the site deletes
everything, and there is no copy anywhere else.

Rounds sync to nothing, so the phone you log on is the phone that holds the history. If
that becomes a problem, this can be pointed at a Firebase project later without a rewrite.

---

## Files

| File | |
|---|---|
| `index.html` | The whole app — markup, styles, logic, charts. No dependencies. |
| `manifest.json` | Home-screen install metadata. |
| `sw.js` | Service worker; caches the app so it opens offline. |
| `icon-192.png`, `icon-512.png` | Home-screen icons. |
