# House Gameplay Polish + Lilah Tornado V1

This milestone stays inside the existing house. Layout, character GLBs, controls, daily tasks and saved daily progress remain intact.

## Playing

Choose **Lilah Tornado** in the house mission picker during morning or afternoon, with empty hands. The introduction starts a 55-second round. Move with the existing joystick/WASD and tap Action beside a mess. Cleanup then plays automatically. Daily time pauses for the event and resumes after its results.

Lilah carries her block between reachable spots, shows an anticipation icon, then drops a visible mess during her PutDown animation. The trail contains blocks, crayons, clothing, juice and toys. She avoids repeating her last three stops, and pauses production when three messes are unfinished. All drop sites are filtered through the player's inflated collision footprint and the house route planner. Crowding her triggers a sidestep and reroute.

Cleanups score 10 points. Another cleanup within eight seconds raises the streak, capped at ×3; each extra streak level adds two points. A basket dump or dog surprise adds 10 bonus points. Only one special is selected per round: 20% dog, 20% basket, 60% ordinary round. No harsh failure: 0–29 points earns one star/$1, 30–69 earns two/$2, 70+ earns three/$3 and House Hero. The existing idempotent allowance receipt system saves the result; a failed save offers Retry before leaving.

Event-only messes are cleared when the round ends. Existing daily mess records are neither erased nor marked completed. Lilah no longer creates spontaneous new daily messes outside the event. Her following, play and bedtime behavior remain.

## Presentation

- CMU washing/sweeping captures drive Wipe and Vacuum on the existing Meshy rig through sampled hand trajectories and two-bone IK. Floor wiping adds a deep crouch with fixed foot anchors. Existing object pickup/putdown motions are retained.
- Hold chores first approach the actual prop. Releasing before arrival cancels the approach; movement is locked during the working animation.
- EXPLORE keeps its normal view. CHORE eases toward Arianna and the prop, zooms in and raises the viewing angle, then returns. Resizing preserves the exploration zoom. REVIEW, BOX_OPENING and TRADE presets are reserved without implementing those modes.
- The wiping cloth follows Arianna's hands; mess pieces disappear as they are tidied. Interaction labels hide while working so the hands remain visible. The event includes a meter, timer, escalating streak feedback, sparkles and licensed Kenney sound cues.
- The original pug supplies the dog cameo; its asset has Idle/Jump but no walk cycle. Its short travel is staged with positional movement and a small bounce. No replacement character was introduced.

Full animation/audio source terms: `public/assets/animations/chores/asset_manifest.json`. Raw motion downloads remain ignored under `artifacts/house-polish/sources`; `scripts/prepare-house-motion.mjs` reproduces the shipped curves. No paid assets were purchased.

## Developer/testing entry

F2 → Jump in → **Lilah Tornado lab** has a normal random round plus deterministic quiet, basket and dog rounds. They run the same 55-second rules and normal allowance flow. As with other developer actions, the panel keeps a pre-change save checkpoint.

Tests use isolated Edge profiles and the 127.0.0.1 origin, never Marc's localhost save. The browser tests accept/read the local test server on port 5174. Start ordinary Vite there or use the ignored no-HMR test config to avoid interrupting rounds while editing documentation.

- `scripts/tornado-rules-test.mjs`: streak timeout/cap, bonus scoring, minimum reward and special selection.
- `scripts/tornado-browser-test.mjs`: three full rounds with actual joystick/tap input, reachable drops, all special types, saved rewards and clean return to exploration.
- `scripts/tornado-edge-browser-test.mjs`: full zero-cleanup round, three phone viewport sizes, developer pause/resume, bounded messes, minimum reward, paused daily clock, reload and no spontaneous daily messes.
- `scripts/house-chore-browser-test.mjs`: real paper pickup, floor wiping, vacuum pickup/cleanup and tool put-away; clip states, camera states, task completion and screenshots.

Artifacts and numerical results are in ignored `artifacts/house-polish/`. Edge mobile emulation is a layout/control check, not a physical-phone performance measurement. The existing house itself has roughly 400 draw calls; the event caps unfinished messes at three, reuses materials and audio buffers, and removes temporary entities after every round. Physical iPhone/Safari remains untested.

Stop here. Do not begin Harper's house, a squishy review mode or another world expansion without a new request.
