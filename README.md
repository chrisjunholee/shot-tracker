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
`CACHE` constant at the top of `sw.js` so installed copies pull the new version instead of
serving the cached one. GitHub's CDN takes a couple of minutes; add `?v=N` to the URL to
confirm you're seeing the new build.

The app versions its own storage and migrates on load, so an older phone picks up schema
changes automatically without losing rounds.

**Rounds logged before the shot chain existed are marked with a `gaps` badge.** Nothing is
back-filled — shots that were never written down cannot be inferred — so those rounds keep
answering everything they can and sit out anything that needs the full sequence.

---

## The tracking model

### What gets logged, and what doesn't

Adam Young's rule is **only note errors**. A drive in the fairway and an approach that
finishes on the green need no entry — writing them down costs attention and tells you
nothing. That principle is kept here, with one deliberate exception.

| Area | What you log |
|---|---|
| **Tee shot** | Result, direction, distance and strike on every drive. Amounts only when it missed. Par 3s have no tee card — that shot is the approach. |
| **Approach, layups & recovery** | Every full swing after the tee, in order. Detail only where it costs you. |
| **Penalties** | A count per hole. They are strokes, so they belong in the arithmetic. |
| **Short game** | Only shots inside 50 yards, only when you took one — with the club and the shot type. |
| **Putting** | **Every putt, in full**, including putts played from off the green. |
| **Mental** | Only when a fault applied, tagged to the phase it happened in. |

### The hole has to add up

Every hole shows one line: **shots + penalties = score**. When it doesn't balance, it says so and
says by how much — at the hole, while you can still remember what was missed. The round summary
runs the same check across all eighteen.

This is the check that found the problem this whole model exists to fix. Before it, a par-3 tee
shot was recorded twice, a layup on a par 4 had nowhere to go at all, and penalty strokes were
never counted — three errors pointing in two opposite directions, so round totals still looked
plausible while more than a third of holes were wrong.

Putting is the exception because make rates and strokes gained are ratios — they need the
denominator. If you only log the putts you miss, the numbers are meaningless. The tee shot
is the other exception: direction and strike are logged on good drives too, because
"fairways hit" tells you nothing about *which* way you miss or *why*.

**Quick par** fills in a fairway drive, middle strike, green in regulation and a par
score, then opens the putt sheet. It never invents putts — those are always real.

### Tee shot

Four independent things get recorded, because they answer different questions.

**Result** — was the shot any use?

- **Good** — in play *and* a clear shot at the green
- **Blocked** — in play but no shot (behind a tree, wrong side, blocked out)
- **Trouble** — recovery or punch-out only
- **Penalty** — OB, lost, hazard

**Direction** — left, fairway, or right, on every drive. If it missed, how far offline
(under 10 / 10–25 / 25–50 / 50+ yards).

**Distance** — short, as expected, or long, and by how much.

**Strike** — middle, toe, heel, high, low.

Result and direction are deliberately separate. A ball twenty yards left with a clean look
at the green is a good outcome *and* a left miss — that's a strategy working, not a swing
fault, and conflating the two hides both. Fairways-hit alone can't tell you which way you
miss; result alone can't tell you whether you're getting away with it.

Par 3s have no tee-shot card. The tee shot *is* the approach and is logged there, so it
counts toward greens in regulation and not toward driving stats.

### Approach, layups and recovery

One ordered list per hole holding every full swing after the tee shot. Each one is a **layup**
(deliberately short), a **recovery** (the green was never the target), or the shot that went at
the green — **green** or **missed**. A par 5 second, a punch-out and the approach itself are all
the same kind of record and all live here, in the order they were played.

**Greens in regulation is worked out, not ticked.** The ball is on the putting surface in par
minus two, penalties counted. That is only answerable if the sequence is complete, which is the
real reason the shots have to be there.

Miss location is a 3×3 grid — long-left through short-right. Over a season this is the
most useful single chart in the app: a consistent short-right pattern is a club-selection
and aim problem, not a swing problem, and it's fixable in an afternoon.

Strike separates **ground contact** (fat, thin) from **face contact** (toe, heel). They
have different causes and different fixes; Young's Strike Plan is the ground-contact work,
the Accuracy Plan is the directional work.

### Short game

Anything inside 50 yards: distance, **club**, **shot type**, lie, strike, and whether it found
the green — with feet from the pin if it did, or yards remaining if it didn't.

Type is chip, pitch, bunker, full wedge or putt, suggested from the club, lie and distance and
changeable on the shot. It matters because **up and down counts greenside shots only**. A
105-yard gap wedge is a full swing that happens to be logged here; folding it in was inflating
the denominator and understating the scramble rate. Full wedges get their own proximity number
instead.

Pick **Putter** and the sheet stops asking whether the strike was flush, fat or thin — questions
about a wedge — and offers the putting descriptors instead. That shot then counts twice, on
purpose: as a short-game shot for up-and-down, and as a putt in the lag and make-rate numbers. A
35-foot putt from the fringe is the same skill as a 35-foot putt on the green.

### Putting

Per putt: distance, break (left-to-right, right-to-left, straight), slope (uphill,
downhill, flat), and either holed or how much you left yourself plus why it missed.

Everything else derives from that: putt count, first-putt proximity, second-putt
proximity, make rate by distance, make rate by break direction, three-putt rate, lag
quality from 20+ feet, and strokes gained.

Miss a putt and enter what you left yourself, and the next putt opens automatically with
that distance already filled in — the distance remaining *is* the next putt, so you never
type it twice. Close the sheet instead if the next one was conceded.

### The chain

Every distance you enter is the starting distance of the next shot, so the app hands it
forward instead of asking twice:

| You log | It opens |
|---|---|
| Approach on the green, 22 ft | Putt 1, pre-filled at 22 ft |
| Approach missed, 15 yds out | Short-game shot, pre-filled at 15 yds |
| Chip missed again, 6 yds left | Another short-game shot, pre-filled at 6 yds |
| Chip on the green, 20 ft | Putt 1, pre-filled at 20 ft |
| Putt missed, 3 ft left | Putt 2, pre-filled at 3 ft |

The two hand-offs from the approach are buttons rather than automatic, because the
approach card lives on the hole screen and shouldn't jump under your thumb while you're
still filling it in. Everything downstream of that chains on save. Close any sheet to stop
— a conceded putt or a picked-up ball leaves nothing phantom behind.

Editing an existing shot never chains. Only new ones do.

Make rate split by break direction is worth the extra tap on its own. A gap between
left-to-righters and right-to-lefters is an aim or read bias, it's invisible in normal
stats, and it's a one-session fix once you can see it.

### Handicap

The start-round form takes the **course rating**, **slope**, and **your current index**,
and works out your course handicap live as you type — using the World Handicap System
formula:

    Course Handicap = Index × (Slope ÷ 113) + (Course Rating − Par)

Slope alone can't do it: slope scales your index to the course's difficulty *relative to
a scratch player*, and the rating−par term accounts for courses that are hard in absolute
terms. Torrey South off the Black at 74.6/138 turns a 12.4 index into an 18 — playing to
your handicap there means 90, not 84.

Your index carries over from your last round. Rating and slope are remembered per course
and tee box and prefill automatically, but never overwrite anything you've typed.

Once a full 18 is logged, the round summary also shows:

- **Net** — gross minus course handicap, and the target score for the day.
- **Score differential** — `(113 ÷ Slope) × (Gross − Course Rating)`, the number that
  actually feeds your index. Below your index, the round helps; above it, it doesn't.
  This omits the playing-conditions calculation, which only the handicap system can apply.

### Mental and strategy

Young's eight faults — too aggressive strategy, mis-calculation, fear, club selection,
distracted, loss of cue-focus, mis-judged conditions, no commitment to decision — plus a
free-text note per hole. These are for good strikes on the intended line that still
produced a bad result.

Tags are split across three phases: **off the tee**, **approach**, and **putting**. Tap the
phase, then the faults. The stats then show not just which faults recur but where in the
hole they happen, which is usually the more actionable half.

Rounds logged before the split keep their tags under "untagged phase" — they still count
toward the totals, they just can't be attributed after the fact.

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

Every device writes to its own browser storage first, so the app works with no signal and
never waits on the network. In the background it mirrors to a private Firebase Realtime
Database, which is what keeps the phone and the laptop showing the same rounds.

**Merging is per round, newest edit wins.** Log a hole on the phone and it appears on the
laptop within a second or two; edit the same round in both places and the later edit
stands. Deleting a round deletes it everywhere. Nothing is ever merged half a round at a
time, so a round is always internally consistent.

Records travel as JSON strings rather than as trees, because Realtime Database silently
drops nulls and empty arrays — an unplayed hole's `score: null` would come back as missing
and the hole would be subtly wrong. A string round-trips exactly.

### How it's secured

There is no sign-in. The database path is a 144-bit random string and the security rules
grant read and write to that path and nothing else — the database root returns *permission
denied*. The path is therefore the credential: anyone who has the URL has the rounds. It is
in `index.html`, which is public, so treat this as private-by-obscurity rather than as
access control. If that ever stops being good enough, the fix is Firebase anonymous auth
and a rule keyed to the user id; the sync layer would not otherwise change.

Sync status lives at the bottom of the Data screen, along with a **Sync now** button.
Rounds logged offline queue there and upload when you reconnect.

**Export anyway.** Data → Export gives you a full JSON backup (restorable from the same
screen) and three CSVs — one row per shot, one row per round, one row per putt — if you
want to run your own analysis.

---

## Files

| File | |
|---|---|
| `index.html` | The whole app — markup, styles, logic, charts. No dependencies. |
| `manifest.json` | Home-screen install metadata. |
| `sw.js` | Service worker; caches the app so it opens offline. |
| `icon-192.png`, `icon-512.png` | Home-screen icons. |
