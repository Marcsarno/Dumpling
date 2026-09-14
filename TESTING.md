# Cleanup and collection prototype verification

Test environment: installed Microsoft Edge (Chromium), Playwright's real touch
events with mobile emulation, and desktop mouse/keyboard input. Physical iPhone
Safari has **not** been tested. Emulation is not a phone performance benchmark.

## Approved Arianna V3.2.0 integration

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
