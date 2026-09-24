# Character and fishing upgrade — September 23, 2026

User requested replacing chunky school NPCs, using the exact Quaternius Worker crossing guard, and making fishing a real interactive battle. Implemented on top of the uncommitted outdoor pass. No public deployment or Git commit requested.

## Preview
- Outdoors / pond: http://127.0.0.1:5191/dist/index.html?preview=outdoors
- Classroom: http://127.0.0.1:5191/dist/index.html?preview=school
- Cafeteria: http://127.0.0.1:5191/dist/index.html?preview=school&room=cafeteria
- These use isolated review saves. The outdoor preview starts inside the front door; walk left out the door and up the garden path to the pond landing.

## Characters
Actual CC0 Quaternius Modular Women Worker, with original safety vest and hardhat, plus original octagonal STOP paddle. Jules uses Casual_Hoodie; Remy uses Casual_2; Poppy uses Casual. They retain the original skin/skeleton, proportionally fit to 1.34–1.38 m, with slightly larger heads and pastel clothes. Both school rooms use the same three identities and adapted seated idle/greeting clips. Cook reuses Casual_2 at adult scale, with cream clothing and fitted chef cap. Arianna and school furniture remain unchanged.

Four production GLBs total approximately 1.55 MB. Blender merges redundant coincident source vertices and regenerates smooth normals; only three peaceful clips retained. Provenance and CC0 notice in public/assets/people. Original complete downloads remain under ignored artifacts/npc-upgrade/source.

## Fishing
Tap CAST → wait for bobber → tap HOOK within 3.6 seconds. Hold REEL; pull left/right against the fish; let go when tension rises. Four fish have different dart/run strengths. Fish loses energy, tires and becomes easier to land. Countersteering accelerates the catch; players can still succeed by just reeling/resting. Holding continuously eventually loses the fish after a grace period; no automatic victory or tap shortcut. Keyboard Space and arrows/A/D also work; blur/hidden/cancel clears held inputs. Typical successful test battle 12–20 seconds.

Original lightweight rod mesh bends; line follows moving bobber/fish; fish swims, wakes and splashes; Arianna leans using variants of existing retargeted fishing clips. Smooth catch rise begins at the fish's actual near-shore position. Quiet existing splash and reward feedback preserved. Rare squishy catch still uses the same master collection and atomic receipt. No new tickets, money or fishing inventory.

## Validation
- TypeScript and full Editor release build pass.
- Eight FishingRound/collection tests pass (all fish, tension recovery, control release, countersteer advantage, missed bite, no auto-catch, idempotent rewards, storage failure).
- Touch-driven house → pond → all four fish + two squishies → school → home journey passed; isolated save reload and no console/network errors.
- Focused camera, cancellation, miss/retry and failed-save recovery checks passed.
- Final keyboard + blur reset + simultaneous touch steering/reeling + catch transition check passed.
- Actual classroom/cafeteria and close-up renders inspected after smoothing; no loading errors.
- Evidence: artifacts/npc-upgrade and artifacts/outdoors. Desktop Edge at a phone viewport is not a physical-phone thermal test.

## PlayCanvas
Project 1604178, scene 2600724, branch efd09e1d-cbfb-4ad9-bc2b-4980fa9a5670.
People assets: Worker 308450142, Jules 308450143, Remy 308450144, Poppy 308450145.
People source manifest 308450514; license 308450515. Runtime 307711680 and credits 307710105 replaced; outdoor license manifest 308313680 updated.
Checkpoint: 8c8b45c9-3521-4ba6-85fe-4edabd243ec1.
Launch connects on engine 2.22.4. Local exported-runtime checks provide the visual/playability verification; live runtime entity inspection remained empty during loading, so do not claim a completed live Editor playthrough.

Source entry points: SchoolPerson.ts, Classmates.ts, CrossingGuard.ts, SchoolCook.ts, FishingRound.ts, Fishing.ts, FishingRod.ts, FishingRetarget.ts. Build overlays people assets into the Editor export. Keep all prior outdoor work and approved school/opening changes.
