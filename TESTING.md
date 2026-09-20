# Cleanup and collection prototype verification

## User-supplied music — September 20

- TypeScript and production build pass. All six supplied MP3s have readable
  stereo 48kHz audio streams; originals remain unchanged.
- `scripts/house-music-browser.mjs` passes in an isolated 320px touch profile:
  actual decoding of all five music files, morning/night versus afternoon,
  school trading, three different stores alternating 1/2/1, Pop pause/resume
  without changing the selected store song, natural track-end/repeat gap,
  persistent mute/reload and DEV pause. No page errors or final media errors.
- The 9.56-second unlock effect is explicitly checked as never loaded. Pop
  audio files and reveal sound cues are untouched. Physical-phone sound balance
  still needs listening; browser decoding checks do not assess music preference.

## Squishy material / rarity polish — September 20

- 20 art/motion/contrast/progress/trading checks, TypeScript and Vite build pass.
- `squishy-polish-browser.mjs`: nine actual touch cases, NEW and duplicate across
  Common/Rare/Epic/Legendary, 320/390/430px and reduced motion. Checks counts,
  retained wallet/tickets, reload, squish, UI separation, animation holds,
  camera restoration and a one-draw-call / under-650-triangle VFX budget.
- `render-squishy-engine-portraits.mjs` checks original diffuse colors for all
  26 models and renders matching portraits from the actual runtime materials.
- Existing three-phone art regression passes, including mid-opening reload,
  second basket, collection, DEV clearance and return to the house.
- Before/after materials and burst/settled screenshots were visually inspected.
  No page/console/asset-load errors. Read SQUISHY_POLISH.md for performance
  measurements and the cold-start caveat; physical iPhone remains untested.
- Production-preview smoke passes: actual reveal/squish, exactly-once receipt
  reload, original wallet/credits, 320px portraits and classroom assets.
- Evidence: ignored `artifacts/squishy-polish/`. All saves used by tests are
  isolated fixtures. Actual user saves remain untouched.

## Reference-led squishy art — September 20

- TypeScript and Vite production build pass (existing engine chunk advisory).
- 18 checks across `squishy-art-test.mjs`, `progress-test.mjs` and
  `trading-test.mjs`: embedded textures/finite mesh positions, real hinge,
  shelf geometry budget, 26 compact portraits, continuous reveal motion,
  preserved receipts and trade protections.
- `squishy-art-browser.mjs` passes at 320/390/430px: actual touch opening,
  reload while the animation is running, no duplicate reward, existing balance,
  collection/tickets preserved, Squish without save changes, rendered portraits,
  second/Legendary reward, return to house, reduced motion and unobstructed DEV.
- `squishy-production-browser.mjs` passes against the production bundle with
  no debug globals: reveal, squish, receipt persistence, rendered portraits and
  imported classroom collectibles. Existing trading touch regression passes.
- Blender front/three-quarter/steamer renders and actual game screenshots were
  inspected. Interactive review: `scripts/squishy-viewer.html`. Ignored evidence
  and editable `.blend`: `artifacts/squishy-art/`.
- Tests use isolated browser profiles. Physical iPhone performance and the
  family's subjective art preferences are not established by automated checks.

## Remaining-fixes follow-up — September 20

- TypeScript and production Vite build pass; the existing large engine chunk
  advisory remains. 29 checks pass across progress, clock, hunts, trading, Pop
  rules, prize/shop invariants, running wrists, safe trade suggestions and bed
  path continuity.
- `scripts/life-followup-browser.mjs` exercises three imported seated classmates,
  suggestion without a save write followed by explicit successful acceptance,
  four random layouts per round mode, reachable candidates, a real randomized
  pickup/placement and crayon cleanup, crib entry and staged bed entry/next day.
  Uses an isolated 390px touch browser; images/report in `artifacts/life-followup/`.
- `scripts/house-music-browser.mjs` passes at 320px: actual media decode, quiet
  fade, ended event, 12-second gap, second track, mute/reload and developer pause.
  It seeks near the first track's end to test completion. No claim of full-track
  listening or long-session enjoyment is made.
- Existing trading browser regression passes again, including protections,
  negotiation, explicit last-copy confirmation, saved deals and next-day offers.
  Existing life-polish browser passes cooking/carrying/plating/seated eating,
  two untimed stores/reload, finite ticket redemption and staged bedtime.
- All saves are isolated fixtures; the user's profile/storage is untouched.
  Physical iPhone/Safari and child playtesting remain unverified.

Use Node 24 `--experimental-transform-types` for scripts importing TypeScript
parameter properties, for example `node --experimental-transform-types
scripts/life-followup-browser.mjs`. Vite test origin: `127.0.0.1:5178`.

## Family life and collecting — September 20

- TypeScript and production Vite build pass (existing large-engine-chunk advisory).
- Production DEV regression passes at 320/390/430px: visible launcher/tabs,
  checkpoint, pause, practice reward isolation and reload; no runtime/asset errors.
- 27 checks across progress, daily clock, hunts, trading, Pop rules, new prize/shop
  invariants and running pose pass. Old saves and failed writes remain protected;
  the wrist test now asserts identical left-hand local rotation over every run key.
- `scripts/life-polish-browser.mjs`: actual phone joystick/taps cook, carry, serve,
  sit and eat; two untimed stores plus reload; redeem a finite ticket prize; sleep
  and next day. No runtime or asset errors.
- `scripts/life-house-browser.mjs` and `scripts/life-pose-browser.mjs` cover laundry
  vacuum pickup/holds/return, dog feeding and roaming, music/mute persistence,
  Lilah reaching the crib, Dad seated with clear feet, and Arianna lying in bed.
- `scripts/life-pet-browser.mjs` passes scoop/flush/wash, exactly one saved reward,
  completed poop hidden after reload, and a touch-accessible prize shelf at 320px.
- `scripts/life-pop-browser.mjs` passes real drag chains of 5 and 8, rainbow
  activation, greater audio feedback, no super-banner loss to Frenzy, banner expiry,
  320px layout, mute and reduced-motion behavior.
- Existing trading browser regression passes: all desks reachable, negotiation,
  refusal, cancellation, explicit last-copy confirmation, successful saved deal,
  reload and next-day offers. Existing dog Tornado test passes a full 55-second
  round: seven cleanups, dog interruption, three-star reward, and return. Lilah
  traveled across nursery, bedroom/landing, living, kitchen and laundry areas.
- Evidence: ignored `artifacts/life-polish/`, `artifacts/trading/` and
  `artifacts/dog-rig/`. Browsers are isolated Edge mobile emulations, not physical
  iPhone/Safari or child playtests. Source music licensing/playback were verified;
  whether the loop stays enjoyable over long play needs the family's judgment.

Run the new scripts with Node 24 while Vite serves 127.0.0.1:5178. GAME_URL selects
another game origin; POP_URL selects the standalone Pop harness origin.

## Sunny Pup rig — September 18

- `scripts/dog-rig-test.mjs`: source SHA unchanged; 13,756 vertices with UVs; normalized four-influence skin; valid joints; finite unit quaternion keys; Idle/Walk exact loop endpoints and meaningful animated joint motion.
- Blender phase renders verify side/three-quarter poses. Baked grounding at four phases per clip is within 0.000013 native units of the floor. PlayCanvas viewer (`scripts/dog-viewer.html`) renders both clips at four phases without errors. Evidence: ignored `artifacts/dog-rig/`.
- `scripts/dog-pause-browser.mjs`: measured bind height 0.48; developer and arcade pauses freeze the actual animation time; resuming advances it.
- `scripts/dog-browser-test.mjs`: a full real-time dog Tornado round through joystick/touch completed 10 cleanups, the dog interruption and the expected reward. Walk was active during travel; afterward Idle and the exact home position were restored. No browser/runtime/asset errors; normal daily clock preservation remains checked by the report.
- TypeScript and production build pass. Mobile tests use Edge emulation, not physical iPhone Safari. Tests never clear the user's live save.

## Live developer panel — September 18

`node scripts/developer-production-browser.mjs` passes against the production build, with no debug globals. Uses an isolated Edge touch context: DEV launcher and all four tabs at 320×568, 390×844 and 430×932; no overlap with the Pop shortcut; world pause; resource/phase/skip/Pop commands; checkpoint before the first change; frozen practice timer and no practice rewards; reload retains the launcher and checkpoint. No console/runtime/asset errors. `TEST_URL` selects local preview or production. Evidence: ignored `artifacts/developer-production/`. TypeScript, production build and developer checkpoint/rollback tests pass. Physical iPhone Safari remains untested.

Test environment: installed Microsoft Edge (Chromium), Playwright's real touch
events with mobile emulation, and desktop mouse/keyboard input. Physical iPhone
Safari has **not** been tested. Emulation is not a phone performance benchmark.

## Squishy Pop progression — September 17–18

- `pop-levels-test.mjs` passes: 300 level boards, readable pools, opening chains, objective accounting, finale exclusion from player power-use goals, distinct Frenzy sessions, locked-level rejection, atomic failure/retry, idempotency, old-save preservation and best-record retention.
- `pop-levels-browser.mjs` played all three full 60-second levels sequentially through CDP touch in a fresh isolated Edge context. No board injection, developer practice or accelerated timers. Reloads verified each unlock and saved record. Scores were 5,090 / 4,960 / 4,465; goals were reached in about 6 / 3 / 8 seconds by the automated chain finder, which is not child pacing. An additional full idle replay preserved prior completion/stars/bests. Classic and non-Pop save fields remained intact. No browser console/runtime/asset errors.
- Screenshots at 320×568, 390×844 and 430×932 cover trail, briefings, live goals and results. A small-phone result overflow was corrected with a two-column action area. `pop-levels-layout.mjs` then verified all result buttons visible with 44px targets, including Next-level navigation, using presentation fixtures.
- Existing `pop-core-test.mjs`, `pop-rules-test.mjs`, `pop-milestone-test.mjs`, `pop-powers-browser.mjs` and `pop-accessibility-browser.mjs` pass. Covers 15,000 boards, all powers, Frenzy, touch cancellation, 12 replays, reduced motion, mute and rapid reopening. Classic browser harnesses now select Classic from the new trail; they accept `POP_URL` for a separate test server.
- TypeScript, production build and progress/hunt/daily-clock regressions pass. Vite retains its existing large-engine-chunk advisory. Browser test origin was `127.0.0.1:5175`; Marc's browser profile and saves were untouched. Reports/images: ignored `artifacts/pop-levels/`.
- Gameplay assessment: goals progress from any matching to longer paths to targeted friend/power decisions. No faster timer or smaller targets. Physical iPhone/Safari and seven-year-old comprehension/enjoyment are not established by automated tests.

Run a separate Vite server, then use `POP_URL` for browser scripts. See `SQUISHY_POP_PROGRESSION.md` for exact rules and extension guidance.

## Squishy Pop readability / round polish — September 17

Run `node --experimental-transform-types scripts/pop-milestone-test.mjs` for 1,500 visual lineups, eligibility of all 26 discoveries, target previews, chain thresholds/backtracking and bounded finale scoring. `pop-core-test.mjs` still verifies 15,000 refills; `pop-rules-test.mjs` covers all original powers, save/coupon rules and failure handling.

With Vite on 5173, `node --experimental-transform-types scripts/pop-milestone-browser.mjs` uses an isolated Edge mobile profile and real CDP touch: guided lesson with stopped timer/no retained score; full unaccelerated normal round; finger release after zero; finale, record and ticket save once; all three power previews/activations; Frenzy; practice reward isolation; reload persistence; visible 44px result buttons on 320/390/430 widths. Result: 2,190 points, 5 tickets, frame p95 ~8.1ms on this desktop; this is not physical-phone performance or a child pacing benchmark.

`node scripts/pop-accessibility-browser.mjs` checks reduced motion (no moving particles/CSS cue animation, immediate result count), mute, small-phone results and rapid reopen without duplicate timer loops. Existing `developer-edge-browser.mjs` and `pop-powers-browser.mjs` pass, including twelve replays and zero lingering voices on pause. Older Pop/developer browser scripts now share `pop-learn-helper.mjs` to complete the interactive lesson. New screenshots/reports are under ignored `artifacts/pop-milestone/`.

## Developer studio — September 17 (details)

- `scripts/developer-saves-test.mjs`: automatic checkpoint, preservation across cheats, restore rollback after a storage failure, fresh save retaining checkpoint, unrelated-key protection and corrupt-checkpoint handling.
- `scripts/developer-browser-test.mjs`: actual panel UI; morning completion without money; completed afternoon; resources, collection, sealed boxes, restock and clock freeze; all store jumps; Pop timer hold; 5/7/10 mouse chains and created powers; injected powers, no-move recovery; practice reward isolation; a real normal 60-second round after practice; save export/restore/fresh save; mobile widths.
- `scripts/developer-edge-browser.mjs`: timed house pause/resume and completion/results; morning/afternoon/night and next day; chore restart; preserved favorites/locks and collection UI refresh; recess/recovery; final footer overlap, scroll area and 44px control checks at 320×568, 390×844 and 430×932; visible practice label; previous Pop pause preserved; time/shuffle controls.
- `scripts/mission-test.mjs` adds a deadline preservation regression. Existing progress/hunt/daily/trading tests and Pop rule tests remain green. TypeScript and production build pass; development panel text/CSS absent from production assets.

Developer browser scripts use isolated Edge contexts at `127.0.0.1:5173`, not the user's live profile/save. Reports and screenshots are under `artifacts/developer/`. These tests establish behavior, not whether a seven-year-old finds Pop fun; physical phone and child playtesting remain necessary. See `SQUISHY_POP_NEXT_MILESTONE.md` for the proposed quality bar.

## Marc and family-house expansion — September 16 (details)

The subsequent layout revision has a dedicated `family-layout-browser-test.mjs`:
asserts nursery/bathroom north alignment and Dad/utility south alignment, walks
through the connected rooms and approaches the crib, bed (both sides), storage,
reading corner and desk. Captures wide 980×824 and portrait 320/390/430 layouts,
then verifies Lilah reaches the moved crib area at night and all **13** interior
lights work. Images/reports are in `artifacts/family-layout/`. Furniture and
trees were visually reviewed for overlap. Family touch helpers now approach
waypoints precisely rather than skipping corners with a 12 cm tolerance.

Completed in isolated Edge profiles with real simulated joystick and Action
touch input; the user's localhost save was not cleared or modified by tests.

- `family-browser-test.mjs`: original ten Marc clips loaded, configured height
  exactly 1.3 × Arianna, walks to reading chair, SitDown/SitIdle/StandUp and
  cleanup states observed. All three actual Lilah incidents are autonomously
  cleaned and saved with `cleanedBy: 'marc'`; allowance stays zero. Both new
  rooms are reachable through real doors. Saves survive refresh. Portrait
  320×568, 390×844 and 430×932 layouts have no document overflow.
- `family-boundaries-browser-test.mjs`: an existing saved toy mess stays
  available while Arianna is nearby, then real Action cleans it for $1 once.
  Night fixture verifies interior lights, nursery arrival, bedroom
  lighting, normal night chores and next-day reset. Final wallet contains
  only Arianna's four earned rewards. Screenshots inspected for furniture,
  chair alignment and day/night appearance.
- The first sustained run exposed Marc cutting a furniture corner. Fixed
  waypoint arrival and the path planner's initial grid connection; the full
  autonomous run then completed all three messes with no browser errors.
- Full `hunt-browser-test.mjs` and `trading-browser-test.mjs` regressions pass:
  morning, school/recess, five chores, store choices/purchases, refresh, reveal,
  collection, another store, night/sleep/new stock; all trader interactions,
  protection, last-copy confirmation and persisted exchanges.
- TypeScript check, production build and 29 mission/clock/progress/hunt/trading
  rule tests pass. Build retains the existing large-bundle advisory. Original
  Marc GLB source/copy SHA-256 match; his appearance/rig file is unchanged.

```powershell
node scripts/family-browser-test.mjs
node scripts/family-boundaries-browser-test.mjs
node --experimental-transform-types --test scripts/mission-test.mjs scripts/daily-clock-test.mjs scripts/progress-test.mjs scripts/hunt-test.mjs scripts/trading-test.mjs
```

Artifacts: `artifacts/family/`, `artifacts/family-boundaries/`,
`artifacts/squishy-hunt/`, `artifacts/trading/`. Night fixtures seed saved time
before boot instead of waiting through the whole evening. The autonomous test
waits for Lilah's normal three incidents; it does not inject cleanup events.
Physical iPhone/Safari remains untested. Sitting is aligned to the living-room
reading chair only; cleanup uses a runtime pose/tool effect. Lilah reaches the
nursery but does not yet climb into or lie down in the crib.

## Portrait cottage revision

### Trading V1 — September 16, 2026

`scripts/trading-test.mjs` covers stable daily offers, different preferences,
common-duplicate-for-new-Rare trades, adding/refusing/swapping, bounded asks,
stale/repeated acceptance, protection changes from another instance, repeated
IDs, last copies, failed writes, old saves and malformed saves. It runs with
the existing progress, hunt and daily-clock suites (22 passing tests total).

`scripts/trading-browser-test.mjs` uses isolated saved inventory and one sealed
duplicate box. Real touch controls open the box, mark a favorite and lock, visit
all three classmates with joystick movement, negotiate and complete a trade.
The scripted example exchanges a common Rosie duplicate for a new Rare Blueberry
and a Comet with the Cute Collector. It verifies X leaves inventory untouched,
last-copy confirmation can be canceled, protection stays active when singles
are enabled, and refresh preserves collection/negotiations/completed trades.
An isolated saved school fixture checks recess entry, paused time, afternoon
return and next-day refreshed offers. No real save or runtime positions are edited.

Portrait layouts: **320×568, 390×844, 430×932**. X / + / ✓ stay visible with touch
targets above 44px; the bag scrolls independently. Screenshots are reviewed in
`artifacts/trading/`. Completed trading browser runs have no runtime/asset errors.
The touch test caught and fixed release-tap fallthrough when Action opened a
dialog. Type checking and the Vite production build pass; the pre-existing
engine bundle size advisory remains. Physical Safari and subjective fun still
require user playtesting.

The updated `hunt-browser-test.mjs` also passes the full touch-driven morning →
recess exit → five chores → nearby hunt → reload/reveal → second store → night
routine → sleep/new-day stock loop. Its evening save fixture now runs before
page boot, preventing the previous scene's autosave from racing the test setup.

```powershell
node --experimental-transform-types --test scripts/trading-test.mjs scripts/progress-test.mjs scripts/hunt-test.mjs scripts/daily-clock-test.mjs
node --experimental-transform-types scripts/trading-browser-test.mjs
```

### Squishy Hunt V1 — September 15, 2026

Current shopping verification uses `hunt-test.mjs`, `hunt-browser-test.mjs`,
`hunt-boundaries-browser-test.mjs`, and `hunt-layout-browser-test.mjs`.
Older single-display shopping scripts below describe previous checkpoints.

Passed:

- Morning dressing, teeth, breakfast and school, then all five afternoon chores using
  the existing touch joystick and Action button. Lilah and the house remain active.
- Front-door chooser, three rumors/price ranges/travel costs, and the visible
  afternoon budget. Nearby plus toy-store trips fit; the distant third trip does not.
- All six stock locations in every store are reachable with collision-aware touch
  navigation. Inspecting reveals series/price/owned count; buying charges the wallet
  and removes stock in one persisted transaction.
- Specialty-store travel consumes most of the afternoon. A paced six-location
  specialty search measured **28.2 seconds** (includes brief visual/reading pauses).
  An automated direct route through the smaller shop takes about 14 seconds; human
  decision time and unfamiliarity will vary. This is pacing evidence, not a claim
  that subjective fun has been established on a physical phone.
- Refresh preserves stock depletion, discoveries, balance and sealed contents.
  Home opening and the grouped four-series collection work with the existing reveal.
- Night teeth, book, clothes and sleep produce a new day with new stock/rumors;
  wallet, collection and unopened purchases remain saved.
- A one-box day sells out correctly. At 7 PM Arianna returns home with her paid box,
  and returning to the house exposes the normal night activities.
- Screenshots inspected for imported models, stock placement, sparkle markers and
  cards. Layout checks cover **320×568, 390×844 and 430×932**; the find card, feedback
  and Action button remain separate, and the route chooser scrolls on short screens.
- No browser runtime errors or asset-load errors in the completed runs. Type checking,
  production build, and the progress/clock/hunt unit suites pass.

Fixtures use an isolated browser profile and saved allowance from prior days. The full
routine is played with touches, without teleporting or changing runtime positions.
Only the saved clock is advanced to evening between the afternoon and night segments,
to avoid waiting through idle time; night chores and sleep are then performed normally.
Additional isolated fixtures cover sold-out stock and the closing-time boundary.
The real user's save is not modified by tests.

Reproduce with the local development server running on port 5173:

```powershell
node --experimental-transform-types --test scripts/progress-test.mjs scripts/hunt-test.mjs scripts/daily-clock-test.mjs
node --experimental-transform-types scripts/hunt-browser-test.mjs
node --experimental-transform-types scripts/hunt-boundaries-browser-test.mjs
node --experimental-transform-types scripts/hunt-layout-browser-test.mjs
```

Browser scripts accept `PLAYWRIGHT_MODULE` and otherwise use this workstation's
bundled Playwright with installed Edge. Screenshots and reports are stored in
`artifacts/squishy-hunt/` (ignored by Git). Physical iPhone/Safari remains untested.

### Puppy cleanup and squishy-store iteration

`scripts/pet-browser-test.mjs` passes the complete touch-driven scoop → carry →
flush → handwash sequence. Poop becomes a child of the carried shovel, flush
empties the tool, and only the completed wash awards $1 plus the $2 timed bonus.
Replay restores the shovel, mess, stages and empty hands. Screenshots of the pug,
loaded tool, corrected toilet, washing pose and results are in `artifacts/pets-store/`.

`scripts/pet-edge-test.mjs` also passes: bare-hand and empty-tool gating; real
60-second expiry after flushing with zero task credit; mandatory handwashing
before other Explore chores; normal carrying restored afterward; no money in
Explore; and Puppy selector/control framing at 320×568, 360×640, 430×932 and
844×390. Its read-only route planner never teleports or overrides mission time.

`scripts/collection-browser-test.mjs` passes both complete earned-money purchase,
reveal, collection and reload loops with the imported store fixtures.
`scripts/store-art-browser-test.mjs` separately checks the final counter placement,
touch purchase and control framing at 320×568, 430×932 and 844×390. It uses an
isolated saved-wallet fixture for shop checks. No asset requests or browser errors
occurred. The store screenshots were visually inspected.

The puppy has its original supplied Idle animation. Arianna uses her existing
pickup/put-down clips and a hands-forward pose with bubbles for the brief wash;
there is no new bespoke handwashing animation. All supplied character GLBs remain
unchanged. Required asset attribution ships in `public/asset-credits.html` and is
linked from the game's footer. Physical-phone testing remains outstanding.

TypeScript and the final production build pass. Both production smoke suites
pass with the new assets, covering pickup/placement/reward, reveal/collection
persistence and return to cleanup, with no exposed debug API or browser errors.
Vite retains its existing large-engine-chunk warning (main JS: 539 KB gzipped).

### Previous cottage checks

`scripts/cottage-browser-test.mjs` (also invoked by `house-browser-test.mjs`)
checks the current house using real touch joystick input and Action taps. Its
read-only path planner routes around furniture and through doors; it never
teleports Arianna or changes mission time.

- All 42 Kenney models / 169 placements load without failed requests.
- The footprint is 9.8 units wide and 19.9 deep. At 390×844, camera half-height is
  5.73, compared with 11.15 before this revision.
- Sampled direction-reversal frames face actual velocity without yaw lag.
  Walk and CarryWalk now top out at 1.5x, with analog-speed response. This is a
  deliberate visual cadence adjustment, not strict authored-stride matching.
- All six rooms and all ten additional pickup/place tasks are reachable.
- The complete six-task house mission awards and saves $8 in **52.6 seconds**,
  including the final gesture and results. This practiced route does not predict
  a new player's discovery time.
- Replay and player/control framing pass at 320×568, 360×640, 430×932 and 844×390.
- No browser exceptions, console warnings/errors or failed asset requests.

Screenshots in `artifacts/house-v2/` were inspected for furniture orientation,
doorway clearance, player visibility, close phone framing and exterior scenery.
The report includes the sampled movement vectors, facing and animation rates.

Current regression checks also pass:

- `arianna-browser-test.mjs`: original material, skin, scale and floor contact;
  animated hand socket; full gesture timing and exactly-once attachment/release;
  relaxed looping Walk/CarryWalk and movement-facing/idle transitions.
- `cleanup-browser-test.mjs`: all 16 checks, including the complete five-task
  bedroom round in 39 seconds, two-thumb vacuuming, cancellations, replay and
  an actual 60-second expiry that blocks late rewards.
- `node --test scripts/mission-test.mjs`: all seven mission-rule checks.
- `collection-browser-test.mjs`: two full earned-money cleanup, purchase, reveal
  and saved-collection loops; reload persistence and 360×640 layout.
- Both production smoke suites: pickup/placement/reward and phone resize, plus
  reveal/rarity/collection persistence and cleanup return. No production debug API
  or browser errors. The chest approach waits for the visible Action target so it
  follows the current camera-relative controls rather than an old fixed duration.
- TypeScript checking and the production build pass. Vite reports the existing
  large engine-chunk warning; the main bundle is 536 KB gzipped.

The earlier horizontal-house route scripts (`house-edge-test.mjs` and related
Stage 4 route checks below) are historical. Use the cottage suite for the current
floor plan. Physical iPhone/Safari performance remains unverified.

## Approved Arianna V3.2.0 integration (historical baseline)

The supplied GLB SHA-256 is unchanged:
`61de9d966f16d39842756861b946527c2f7056f351912b3e173eadfe6660bcb0`.
Its manifest and handoff were read before integration and retained unchanged.

Current browser checks:

- `scripts/arianna-browser-test.mjs`: actual PlayCanvas import; all eight clip
  names/loop flags; original vertex-color material, 3,294 vertices and 25 joints;
  1.203 m authored scale; CPU-skinned soles meeting the rug/floor; facing and
  velocity-matched Walk/CarryWalk; animated hand socket; full pickup/put-down
  durations; exactly-once events at the first frame after 1.10 / 1.30 seconds;
  movement locked during gestures and restored afterward. Screenshots inspected
  at phone size for appearance and the held book. Results in `artifacts/arianna/`.
- `scripts/cleanup-browser-test.mjs`: all 16 checks pass with Arianna, including
  all five tasks, canceled and two-thumb vacuum holds, replay, five viewport sizes,
  and a genuine 60-second partial-results timeout. Full mission: **36.7 seconds**.
- `scripts/house-browser-test.mjs`: all ten additional carry/place interactions,
  complete six-room tour, both laundry doorways, full six-task timed mission,
  $8 saved reward, replay and bedroom selection pass. Full mission:
  **57.2 seconds including the final animation and results**.
- `scripts/browser-test.mjs`: all 11 movement, touch cancellation, collision,
  viewport, Idle/Walk transition and malformed-GLB fallback checks pass.
- `scripts/collection-browser-test.mjs`: two complete earned-money cleanup →
  purchase → opening → collection loops pass, including reload persistence.

TypeScript checking and the production build pass. Both production smoke suites
pass: pickup/placement/reward and phone resize, plus reveal/collection persistence
and cleanup return. The production window exposes no debug API. Vite retains its
existing large-engine-chunk warning; no new dependencies were added.

Pickup and put-down now each play 2.4 seconds at 1x. Celebration plays 1.6 seconds.
Those gestures account for the longer mission routes compared with the historical
placeholder timings below. The practiced house route leaves little spare time;
these measurements do not establish a new player's completion time.

At the user's chosen unchanged 2.25 units/s pace, Walk uses **7.5x** and CarryWalk
**12.5x** playback at full input. Skinning/contact checks pass in the running game;
that fast cadence still needs frame-pacing review on physical phones. No rig,
material, clip samples, camera angle, joystick layout or movement speed was changed.
SitCar remains available but unused; no Lilah or driving was added.

Run the new check with the same Playwright environment variable used below:

```powershell
node scripts/arianna-browser-test.mjs
```

## Stage 4: connected house (historical placeholder timings)

`scripts/house-browser-test.mjs` runs at **390×844** using real two-dimensional
joystick gestures and Action taps. It never teleports the player or changes mission
time. It walks bedroom → hall → living → kitchen → laundry → bathroom → hall →
bedroom, tests all ten new carry/place interactions, then checks the extra
living/laundry doorway in both directions. Room checks verify that the camera
settles close to the player while preserving its original rotation and scale.

The same run starts a fresh six-task house mission, completes all chores across
five rooms, verifies **$6 + $2 bonus = $8** in the persistent wallet, replays, and
switches back to the approved bedroom mission. The final complete route took
**26.9 seconds**, including deliberate waypoint stops. This is a practiced automated
route; it does not establish a child's discovery time or whether travel is fun.

`scripts/house-edge-test.mjs` checks:

- Solid collision on low bedroom walls away from doorways.
- Full player-radius coffee-table blocking.
- Readable player framing, visible controls and no horizontal overflow at
  **320×568, 360×640, 390×844, 430×932**, plus 844×390 landscape.
- A genuine **60-second house timeout while carrying** in the living room.
- Partial allowance kept ($1), no hard failure, no end-of-round camera snap.
- Carried props cleared when shopping, the store's original camera restored,
  and return to a fresh house mission in the bedroom.
- No browser exceptions, console warnings/errors or failed asset requests.

The existing 16-check cleanup suite, two complete Stage 3 purchase/reveal loops,
movement/approved-GLB suite, and production smoke tests remain regression checks.
The cleanup/collection tests explicitly choose **Bedroom · 5**. Camera assertions
now require fixed **angle and scale**, rather than fixed position, because smooth
following is the intentional Stage 4 change. Arianna is now enabled; see the integration checks above.

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/house-browser-test.mjs
node scripts/house-edge-test.mjs
node scripts/house-ui-test.mjs
node --test scripts/mission-test.mjs
node scripts/cleanup-browser-test.mjs
node scripts/collection-browser-test.mjs
node scripts/browser-test.mjs
```

The UI test also verifies opening the collection during free exploration and
keyboard activation of focused menu buttons, in both development and production.
The seven mission unit tests include exact deadline boundaries, the configurable
six-task list, rejection of tasks outside that list, and untimed practice with
zero allowance. The five existing save/economy unit tests also pass.

### Rendering cost

A temporary local server runs an unmodified archive of approved commit `795245c`
on port 5175. `scripts/house-performance.mjs` compares it with the current game on
5173 at **390×844**, DPR capped to 1.75, rendering at **682×1477**. It samples each
starting view after warmup with a fresh save.

| Measurement | Stage 3 | Stage 4 |
| --- | --- | --- |
| Starting-view total draw calls, six samples | 145 | 184 |
| Production JavaScript gzip | 527.16 KB | 532.67 KB |
| Directional shadow lights | 1 | 1 |
| Shadow-map resolution | 1024 | 1024 |
| Additional room texture assets | — | 0 |
| Additional room material palette | — | 0; original bedroom instances reused |

The house adds **39 draw calls (~27%)** in this view and about **5.5 KB** compressed
JavaScript. A batching adjustment reduced an earlier house reading of 232 to 184
without changing geometry. The final batch grouping combines static geometry by
shared material across this compact house; it gives up some fine-grained culling
to reduce draw submission overhead. Room geometry stays resident throughout.

Warm desktop readings were near the display's 143–144 Hz refresh rate. They are
**not** a mobile GPU benchmark. Explore enables more props than the six-task mission
and therefore costs more; moving-room readings are recorded in
`artifacts/stage4/report.json`. Vite's large-chunk advisory remains expected for the
bundled engine. A physical iPhone/Safari play session is the next performance check.

### Navigation and visual review

Screenshots in `artifacts/stage4/` cover every room, the return path, short-phone
framing and both completion/timeout cards. The TV console was placed clear of the
living/laundry doorway. A playtest waypoint initially aimed inside the solid laundry
basket; approaching its open side verified pickup and the route to the folding
counter. Low internal walls and doorway jambs expose the player without needing
transparency sorting. The original bedroom bed, desk, chest, rug and shelves retain
their geometry and positions; only cutaway boundaries and a door connection were
added to its open edges.

Recommended Stage 5: observe phone playtests comparing the bedroom and house
missions, then tune task placement, route guidance and camera lag based on where
players hesitate. Do not expand the house or add characters until that comparison
shows which parts of the traveling cleanup loop players want to repeat.

## Stage 3: full collection loop

`scripts/collection-browser-test.mjs` starts with an empty local save and drives
the real joystick and Action button at **390×844**. It completes all five chores,
earns $7, walks to the store display, buys a $4 box, returns home, opens it, checks
the collection, refreshes, and completes a second full cleanup/shopping/opening
loop. The second trip buys and opens two boxes. Final balance is $2, with three
dumplings collected. Navigation uses read-only player positions; no teleportation,
timer overrides, forced rarity or wallet injection are used in this full-loop test.

It also verifies:

- Insufficient-funds Action gating and immediate allowance deduction.
- Refresh at the store retains the box, wallet and trip count.
- Refresh after reveal preserves its receipt without awarding a duplicate.
- Eight collection cards with silhouettes and visible owned counts.
- Refresh from the collection reopens it with saved wallet and discoveries.
- Back to cleanup restores all tasks, a ready 60-second timer and camera position.
- Collection and replay fit **360×640** portrait without horizontal overflow.
- No browser exceptions, console warnings/errors or failed asset requests.

`scripts/collection-edge-test.mjs` uses explicitly labeled saved-state fixtures
to exercise all four rarity reveals without repeatedly grinding random rolls.
Each tier is checked at **360×640** for its configured color and particle count
(5 / 10 / 16 / 24), visible reveal, collection entry and accessible replay button.
It also buys three boxes from a $20 fixture wallet, verifies that a fourth purchase
is blocked even after refresh, and checks that unopened boxes remain accessible
after choosing to return to cleanup.

`scripts/progress-test.mjs` covers exact 60/25/12/3 rarity intervals across 10,000
stratified draws, reachability of all eight definitions, duplicate mission credits,
three-box trip limits, insufficient funds, sealed-box persistence, duplicate
dumpling counts, interrupted reveals, failed writes and unreadable-save protection.
This tests selection boundaries; it is not a statistical test of browser crypto.

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/collection-browser-test.mjs
node scripts/collection-edge-test.mjs
node --experimental-transform-types --test scripts/progress-test.mjs
node scripts/collection-production-smoke.mjs
```

Node 24's transform-types flag is used only to run the source TypeScript unit tests;
the shipped game is compiled by Vite. Stage 3 screenshots and the full-loop report
are stored in `artifacts/stage3/` (ignored by Git).

Issues caught during verification: a hidden store marker initially shared the
cleanup-only destination selector; it now has its own styling target. The home
box originally overlapped its caption at a short portrait size; it was raised,
and a light vignette improves text readability. Scene transitions return a held
cleanup prop to its room root, so a timed-out carried item cannot follow the player
into the store. The engine bundle still triggers Vite's size advisory (about
527 KB gzipped). Physical phone GPU performance and child playtesting remain open.

Save IDs use `crypto.getRandomValues` instead of the HTTPS-only `randomUUID` API,
so the plain-HTTP Wi-Fi preview remains playable. The full earned-money test is
also run against the computer's LAN URL. The production smoke test uses a saved
box fixture to verify the compiled reveal, rarity, collection, refresh and return
to cleanup, with developer diagnostics absent.

Recommended next milestone: observe several short phone play sessions, then tune
interaction clarity, reveal timing and the $4 box economy using those observations.
Keep world expansion separate until this repeat loop earns a voluntary replay.

## Stage 2: cleanup mission

`scripts/cleanup-browser-test.mjs` drives the real joystick and Action button with
touch events. It reads diagnostics, but never teleports Arianna or edits gameplay
state. Its expiry test waits a genuine 60 seconds; the timer is not accelerated.

It covers:

- Ready state, disabled Action out of range, and first-input timer start.
- Full teddy → chest, shirt → hamper, book → bookshelf, crayons and vacuum route.
- Visible carry socket attachment, one-item limit and blocked wrong destinations.
- Single task rewards, $2 all-clean bonus, $7 total, early completion and results.
- Short crayon animation, tidy cup replacement and no repeat reward.
- Partial vacuum release, two-thumb movement, independent finger release,
  cancellation, out-of-range cancellation and no stuck tool input.
- Full real-time expiry with partial allowance and a hold that would finish late.
- Movement blocked after results, fresh replay state and vacuum-first task order.
- Both controls on 320×568, 375×667, 430×932, 844×390 and 1280×800 viewports.
- No browser warnings/errors, uncaught exceptions or failed asset requests.

The scripted complete route, including wrong-destination and cancellation checks,
took approximately **17 seconds** on the test machine. This is a practiced,
automated route, not a child usability result. The remainder of the minute leaves
room for discovering controls and destinations; actual seven-year-old playtesting
is still needed to judge whether the loop is fun and suitably paced.

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/cleanup-browser-test.mjs
node --test scripts/mission-test.mjs
```

The Node tests check the exact deadline boundary, duplicate rewards, a single
completion bonus, reset and delayed-frame expiry. They require Node with built-in
TypeScript stripping (the bundled Node 24 works); no test framework is installed.
Stage 2 screenshots and results are in `artifacts/stage2/`.

## Original movement and GLB regression checks

The browser suite checks:

- Direct portrait boot with approved Arianna, with no document overflow.
- Screen-relative up/down/left/right movement and a fixed camera position.
- Normalized diagonal speed and immediate stop after releasing keys.
- Touch drag, analog input clamping and release outside the joystick.
- Touch cancellation, second-finger behavior and focus-loss reset.
- Sustained movement into furniture and room boundaries without penetration.
- Canvas/controls resizing at 375×667, 320×568, 430×932, 844×390 and 1280×800,
  including an orientation change during active input.
- Desktop mouse capture and release outside the control.
- No browser warnings, console errors or uncaught exceptions during normal play.
- The approved GLB passing through the real PlayCanvas container loader
  and engine Idle/Walk animation transitions without controller changes.
- Malformed GLB fallback: logs the expected diagnostic and keeps movement usable.

Start the development server, then use an existing Playwright installation:

```sh
node scripts/browser-test.mjs
```

Playwright is intentionally not installed as a project dependency. On this Codex
Windows environment, its bundled runtime can run the tests directly:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///C:/Users/marc7/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
node scripts/browser-test.mjs
```

`BROWSER_CHANNEL` defaults to `msedge`. `TEST_URL` defaults to
`http://localhost:5173`. The automated suite uses read-only development diagnostics
that are stripped from the production build. The approved GLB is loaded from the supplied asset. Only the malformed-asset
fallback test intercepts its response; it never replaces the real file or config.

The suite saves screenshots and `artifacts/test-results.json`. Visual review is
also necessary: it caught the retained canvas-size bug and smaller-screen overlap,
which were corrected before completing the milestone.

## Build and production smoke check

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 0.0.0.0
```

With the preview running and `PLAYWRIGHT_MODULE` set as above, run
`node scripts/production-smoke.mjs`. This tests the actual production bundle:
disabled/active Action, pickup, destination guidance, placement, allowance,
portrait resizing and absence of the development debug API or browser errors.

Open http://localhost:4173. Verify the bedroom loads, the joystick moves Arianna,
the name tag follows her, and release stops her. Check the browser console.
Vite reports a large engine chunk (approximately 520 KB gzipped); this is the
PlayCanvas engine, not a build failure. No art packs or external asset requests
are required for this milestone.

## Physical iPhone playtest still to do

1. Open the dev server's Network URL in Safari on the same Wi-Fi.
2. Verify the joystick is reachable above the home indicator in portrait.
3. Drag in every direction, release outside the circle, then add a second finger.
4. Switch apps while moving and return: Arianna should be stopped.
5. Rotate the phone and return to portrait. The whole room and controls should fit.
6. Walk along the bed, shelf and desk and into every room edge.
7. Check frame pacing, device temperature and legibility on the actual target phone.
8. Play all five cleanup tasks using both thumbs; verify the highlighted
   destination and visibly carried object are easy to understand.
9. Stop vacuuming halfway and move away. Dirt should remain and no money be earned.
10. Let the minute expire while carrying. Confirm the result is encouraging and
    replay restores the messy room and empty hands.

## Squishy Pop V1 — September 17, 2026

See SQUISHY_POP_REPORT.md for rules, balance, art correction and limitations. Checkpoint before changes: d0accf1. User's real save was not cleared or seeded.

- `node --experimental-transform-types scripts/pop-core-test.mjs`: 15,000 generated/refilled boards, backtracking, invalid chains, stars, ticket bounds.
- `node --experimental-transform-types scripts/pop-rules-test.mjs`: all powers/cascades/Frenzy, deadlock fallback, collection, atomic/idempotent tickets, failed writes, coupon price/day cap.
- `node --experimental-transform-types scripts/pop-browser-test.mjs`: isolated prior-save store fixture, two full 60-second rounds with real CDP touch, tutorial/countdown, cancel/backtrack/pause, finish current gesture at zero, replay/results, conserved money/stock/collection/position/day/time, reload receipts, three portrait sizes, no page/asset errors.
- `node scripts/pop-powers-browser.mjs`: development-only deterministic UI fixtures for creation/activation of all powers, Frenzy, phone layouts, touch cancellation, twelve replay cycles and released audio voices.
- `node scripts/pop-art-check.mjs`: all 32 cached sprites viewed on the real lavender tray background; transparent cell corners verified. Contact sheet: artifacts/squishy-pop/art-contact.png.
- Existing progress/hunt/daily-clock/trading regression suite: 22 passing checks. TypeScript and production Vite build pass; existing bundle-size advisory remains.
- Evidence in ignored artifacts/squishy-pop/report.json, powers-report.json and PNGs. Full-round p95 frame interval ~7ms on this desktop with Edge mobile emulation; not a physical iPhone measurement. Automated optimal play does not prove subjective fun. Audio decoded and scheduled successfully; real listening/device feedback is still valuable.


## House polish + Lilah Tornado V1 — September 17, 2026

Read HOUSE_POLISH_REPORT.md for rules, controls, source terms and limits. New checks run with Node 24 and Edge in isolated mobile profiles (320×568, 390×844, 430×932). No user-origin saves were touched.

- TypeScript and production build pass; Vite reports the existing large engine-bundle warning.
- 15 tests across progress, daily clock, mission and Tornado rule scripts pass. Covers idempotent allowance receipts, failed-save preservation, daily progression, streak timeout/cap, bonus points, positive minimum reward and special-event probabilities.
- Three complete active 55-second rounds through real joystick/tap input exercise ordinary, basket and dog cases. All receive correct saved rewards, clear temporary messes and return to EXPLORE. Round reports, positions and render samples: artifacts/house-polish/rounds.json. Doorway crowding found during early runs was fixed with a clearance escape and reroute; interaction visibility uses a narrow line-of-sight test rather than the full movement radius.
- A complete no-cleanup round verifies the three-mess cap, 1-star/$1 minimum reward, unchanged daily time/phase, developer pause, mobile control layout, result exit and persisted reward after reload. See edge.json.
- Separate chore run uses real inputs to take a paper towel, wipe a spill, take/use a vacuum and put it away. Checks actual Wipe/Vacuum states, task completion, carrier release and CHORE → EXPLORE. Final hand positions during wiping are approximately 0.10–0.14 m above the floor origin; cloth is offset to the floor surface. Foot anchors remain fixed during the crouch. See chores.json and daily-wipe/daily-vacuum screenshots.
- No browser runtime, failed asset-request or audio-decode errors in passing runs. Event audio buffers are reused, there are at most three active mess roots, and particles expire promptly. Mobile emulation on this desktop is not a physical-phone performance benchmark; real iPhone/Safari is still untested.

Commands:

    node --experimental-transform-types --test scripts/progress-test.mjs scripts/daily-clock-test.mjs scripts/mission-test.mjs scripts/tornado-rules-test.mjs
    node --experimental-transform-types scripts/tornado-browser-test.mjs
    node scripts/tornado-edge-browser-test.mjs
    node --experimental-transform-types scripts/house-chore-browser-test.mjs

The browser scripts default to port 5174 to keep the user's 5173 save and live scene separate. tornado-browser-test accepts GAME_URL; the others currently use 127.0.0.1:5174. Run a local Vite server there before testing. Test source files and reports are separate from the user's localStorage; do not substitute localhost when running these fixtures in a shared browser profile.

Final route verification: ordinary / basket / dog rounds cleaned **10 / 9 / 11** messes and scored **134 / 130 / 158**, each saving $3 once. Daily clock delta was zero in all three. Lilah reached the kitchen (z≈11.3) along valid routes. Median reported frame rates were 91 / 93 / 89 FPS on this desktop in 390px Edge emulation; maximum sampled draw calls were 423 / 415 / 408. Main user-facing preview on port 5173 also passed a fresh isolated load, intro and exit with no browser or asset errors.
