# Superseded by the September 26 daily-play pass

Read [daily-play-local-review.md](daily-play-local-review.md) for the current state. The pond and original road are restored; added cottages, turning island, man and dog are removed. Fifteen Blender toy activities now supply five stable randomized choices per game day. The imported jump has reviewed moving arms again, with a coat-safe forward range on the unchanged rig. Scooter tuning and Dad rides remain deferred. Notes below describe the earlier prototype, not current acceptance.

# Outdoor journeys: local work in progress, September 25, 2026

Production baseline: `eb47411`. No commit, push, Editor sync, or deployment has been performed for this work. Local preview: http://127.0.0.1:5191/dist/index.html?preview=outdoors . This preview uses the separate `dumpling.outdoorReview` save namespace.

## User corrections take priority

The first jump adaptation aimed the upper arms from an unrelated animation skeleton, stretching the existing jacket into a bat-wing silhouette. Removed that upper-body motion and torso adaptation. The current jump keeps Arianna's authored standing shoulder, arm, wrist, and torso local poses while applying lower-body crouch/flight/landing motion. The original rig, skin weights, proportions, mesh and animation payload remain unchanged. This is a conservative jump; further upper-body changes require full visual review, not a rig replacement.

The user explicitly prohibits all performance-driven quality reductions to Arianna. Investigation found an older texture optimization had reduced both character maps to 1024×1024 even in baseline `eb47411`; the original 14,694-triangle mesh was never reduced. Restored the actual original GLB from the pre-optimization backup: SHA-256 `35cfde9dba8d20d53019d654728972c04f7455ccc533040d00818f86d3f82989`. Both embedded maps are now 2048×2048. Non-image buffer data has the identical SHA-256 `3527fa0897f2e81f7ced10019bd5d53dfafd47b5d1a5473645164df18b741a40` in the optimized and restored files, proving no geometry, weights, rig or animation payload changed. The texture optimizer now excludes Arianna; the build verifies source and output hashes. Removed the shared 1.75 display-pixel-ratio cap so it cannot soften her on denser screens.

Screenshot contact sheets are reduced overview images and must not be used to judge texture fidelity. Review the individual full-resolution PNGs. Phone-size desktop emulation is not physical-phone performance evidence.

Verified correction: TypeScript and Editor-release build pass. Source and built GLBs match the full-quality original hash. `scripts/arianna-quality-browser.mjs` confirms both actual GPU material maps at 2048×2048, 14,694 triangles, 28 joints, and native 1170×2532 canvas pixels for a 390×844, 3× display emulation. `scripts/jump-playtest.mjs` passes stationary/moving jumps, scooter dismount to jump, landing and isolated-save checks without browser errors. `scripts/jump-review.mjs` inspects 71 animation samples plus six phases from each of two camera angles and confirms the authored upper-body transforms stay unchanged. Exact-frame review pauses gameplay updates to avoid racing the action state machine; the separate input test runs the unmodified live game. Full-resolution evidence: `artifacts/journeys/jump-fixed-front-takeoff.png`, `jump-fixed-side-landing.png`, and the three QA JSON reports.

## Current prototype

- Original Blender lavender/mint kick scooter; existing-rig coast/push poses, two-hand grip alignment, deck contact, progressive steering, lean and forgiving lateral drift. Source Blender builder: `scripts/build-journey-scooter.py`.
- Sectioned neighborhood left of the house, three progressively distant store exteriors, parking/crossings and a pond turnaround. Original shop Blender builder: `scripts/build-journey-shops.py`. Existing shops and save logic retained.
- Nearby randomized balls, puddles, pushable crates and recolored existing dogs with leashes and occasional poop. School walking route retains its existing destination and gameplay.
- School interior is loaded on entry and released on departure. Shared outdoor container leases prevent one section from destroying another section's asset.
- Actual browser screenshot and touch-control scripts are in `scripts/*journey*`, `scripts/jump-review.mjs`, and `scripts/scooter-*.mjs`. Evidence is under ignored `artifacts/journeys`.

## Remaining work before claiming the journeys complete

- Complete and review Dad's automatic car ride; `family-car.glb` is only a prepared asset, no ride gameplay yet.
- Refine crate collision/pushing, held scooter braking, and school-sidewalk staging. Recheck scooter grips and deck contact during turns and push cycles.
- Repeat section/school entry/exit memory tests after the shared-container ownership fix; verify disposal and add new component cleanup to GameLoop destruction.
- Complete local shop journey, school, fishing and save-continuity regression playthroughs. Measure on a physical phone when one is available; no connected phone has been verified.
- Complete asset attribution updates. KayKit movement source is CC0; Kenney Car Kit is CC0. The scooter and store buildings are original Blender work. Asset research references: https://kaylousberg.itch.io/kaykit-character-animations and https://kenney.nl/assets/car-kit .

The user interrupted expansion to correct the jacket deformation and restore Arianna's full texture quality. Finish and show that correction before continuing expansion.
