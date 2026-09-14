# Milestone 1 verification

Test environment: installed Microsoft Edge (Chromium), Playwright's real touch
events with mobile emulation, and desktop mouse/keyboard input. Physical iPhone
Safari has **not** been tested. Emulation is not a phone performance benchmark.

## Automated checks

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

Open http://localhost:4173. Verify the bedroom loads, the joystick moves Arianna,
the name tag follows her, and release stops her. Check the browser console.
Vite reports a large engine chunk (approximately 514 KB gzipped); this is the
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
