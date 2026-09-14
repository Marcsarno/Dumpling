# Cleanup and collection prototype verification

Test environment: installed Microsoft Edge (Chromium), Playwright's real touch
events with mobile emulation, and desktop mouse/keyboard input. Physical iPhone
Safari has **not** been tested. Emulation is not a phone performance benchmark.

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

- Direct portrait boot with the placeholder, with no document overflow.
- Screen-relative up/down/left/right movement and a fixed camera position.
- Normalized diagonal speed and immediate stop after releasing keys.
- Touch drag, analog input clamping and release outside the joystick.
- Touch cancellation, second-finger behavior and focus-loss reset.
- Sustained movement into furniture and room boundaries without penetration.
- Canvas/controls resizing at 375×667, 320×568, 430×932, 844×390 and 1280×800,
  including an orientation change during active input.
- Desktop mouse capture and release outside the control.
- No browser warnings, console errors or uncaught exceptions during normal play.
- A synthetic GLB fixture passing through the real PlayCanvas container loader
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
that are stripped from the production build. The test GLB is generated in memory
and intercepted only by the test browser; it never replaces the real asset config.

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
