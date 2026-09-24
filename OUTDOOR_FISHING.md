## Latest: character and interactive fishing upgrade

See NPC_FISHING_UPGRADE.md. Actual Quaternius Worker guard; slimmer fitted classmates/cook; hold/release/countersteer fishing battle and visual pass. Tested locally, synced to PlayCanvas checkpoint 8c8b45c9-3521-4ba6-85fe-4edabd243ec1. No new Git commit or public deployment. Preserve all uncommitted work.

# Outdoor pond, fishing, and school walk

Completed September 23, 2026. Local and PlayCanvas preview; not committed or deployed to Vercel.

Review: http://127.0.0.1:5191/dist/index.html?preview=outdoors
This uses dumpling.outdoorReview.* saves and starts inside the front door. Walk left through the doorway, then up the garden path. FISH appears by the pond landing. Continue up/right along the sidewalk, cross at the stripes, and use Enter school at the gate. The existing classroom/cafeteria are unchanged.

## World and preserved systems
- Existing PlayerController, joystick, character rig, camera, daily routines, interaction button and master collection retained.
- The original front doorway is opened after Editor layout binding. Crossing it keeps held touch movement and camera follow; no loading or character replacement.
- Compact garden with selected Quaternius trees, shrubs, flowering hedges and rocks; layered low-cost pond, lilies, reeds, landing and bench. Obsolete decorative trees/fence across the new route are hidden at binding time.
- Exterior cottage shell, windows and pitched roof appear when sufficiently outside and hide indoors. Continuous return restores indoor controls/chores.
- Quiet road, sidewalk and crosswalk lead to a fenced school approach. Ms Maple reuses a Kenney character with idle animation, greeting gesture, safety accessories and stop paddle. No cars. Collisions cover the pond, trunks, bench, guard, school planting beds, fence and gate pillars.
- The gate enters the current school implementation. If morning tasks are complete (or school is due), it advances the school day; leaving school returns to the gate in the afternoon. Early visits use existing trading without advancing the day.
- Outdoor/fishing time pauses the accelerated household clock, as shopping already does, to avoid forced scene changes mid-walk or catch. Shop travel remains available at the porch during eligible afternoon hours.

## Fishing and animation
- Cast, short variable wait, subtle false bobble, a clear bite with a 3.6-second reaction window, then five steady taps. Rapid tap spam is gated at 0.22 seconds. Missed bites can restart; Leave pond cancels and restores controls/camera.
- Four Quaternius animated fish: goldfish, puffer, betta, armored catfish. Their original out-of-water animations play during the catch. Fish are released; they have no inventory.
- KayKit Character Animations 1.1 (CC0): Fishing_Cast, Fishing_Idle, Fishing_Bite, Fishing_Reeling, Fishing_Catch. Source world rotations and joint positions sampled at 30 fps. Runtime retarget matches torso rotation deltas and arm directions to Arianna's original bones, with a supporting-hand IK fit for her proportions. Legs retain her stable idle stance. Existing armature, skinning, GLB and locomotion clips remain unchanged.
- Imported Quaternius rod follows the right hand; line and bobber animate independently. Quiet CC0 Peludo splash, bite cue and existing rarity celebration respect effects volume.
- 12% chance of a squishy catch. ProgressStore.catchFishingSquishy uses the existing weighted roll (65/25/8/2), writes the master collection atomically, and returns NEW/duplicate/count. Persisted round receipts prevent repeated credit. A failed write keeps the reveal available for Retry saving. No new currency, tickets or separate collection. Keeping a squishy ends the round; it is not released back into the pond.

## Assets and performance
Full source links, creators and licenses: public/assets/outdoors/SOURCES.md; matching credits are in-game. Only 4 fish, 1 rod, 7 nature models, a small sampled animation JSON and one short splash are packaged (about 4.5 MB). Full downloaded packs stay in ignored artifacts/outdoors/source.
- Fish: 1,456–2,142 triangles each. Rod: 308 triangles. Nature: 120–6,265 triangles per selected model.
- Shared containers/materials and spatial static batches. Nature texture maps limited to 512px. No new lights, reflection render pass or large water shader.
- Final desktop Edge test at a 390×844 mobile viewport: 256 draw calls near crossing, 367 while reeling; sampled 94–120 fps. Whole loaded game texture allocation about 121 MiB, vertex buffers 49 MiB. These are desktop observations, not physical-phone performance claims.

## Validation
- TypeScript and Editor production build pass.
- Four fishing unit tests: complete round; missed bite and spam gating; duplicate/idempotent master collection; failed atomic write.
- Existing ProgressStore tests (5), DailyClock checks and life-followup tests (2) pass.
- Full touch-driven house → pond → all 4 fish → 2 squishies → crosswalk → existing classroom → school gate → house completed repeatedly. Final run finishes morning chores first and verifies school/afternoon transition, reload persistence, zero console/network errors and untouched real save namespace.
- Focused mobile/landscape checks: rod/cast/reel visual captures, repeated squishy model cleanup, cancellation, smooth camera restoration, missed-bite retry, failed browser storage write followed by successful retry.
- Evidence: artifacts/outdoors/playthrough.json, polish.json and screenshots. Diagnostic source, conversion scripts and tests are in scripts/.
- The older daily-boundary browser script targets a retired localhost:5173 server and did not run; the current production preview was covered by the journey and focused tests above.

## PlayCanvas and release status
Project 1604178, scene 2600724, branch efd09e1d-cbfb-4ad9-bc2b-4980fa9a5670. Runtime 307711680 and credits 307710105 replaced. Outdoor assets 308313524–308313545 (selected IDs in this range), license manifest 308313680. Checkpoint 866dbecf-16a4-4257-8c7f-a56289d85c36. Live launch connects on engine 2.22.3 and reports no application errors; MCP screenshot capture timed out, while local exported-runtime visual tests passed.

Known limits: physical iPhone/Safari heat, battery and sustained frame pacing are unverified. Guard uses the established Kenney school-character style, which differs from Arianna's supplied model. No public deployment or Git commit was requested for this feature. Older queued Dad-chair and household-sound work is outside this pass.
