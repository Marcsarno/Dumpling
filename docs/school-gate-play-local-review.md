# School-gate play — local review

Local preview: http://127.0.0.1:5192/dist/index.html?preview=outdoors

This pass replaces the visible numbered outdoor activity pads with one connected situation at the existing school entrance. Poppy has a ball, a backpack against the low garden wall, and leaves under the existing tree. There is no daily-play checklist, score, completion overlay, or reward for this scene. The old activity progress remains in its separate save.

## What to try

- Follow the garden path, cross at the stripes, and turn left beside the school gate.
- Walk into the ball to nudge it, or approach and use **Kick**. Your approach sets its direction; a narrow assist helps intentional passes toward Poppy.
- Poppy retrieves the ball and kicks it back. She follows a carried ball around the school forecourt and steps aside when you approach.
- Use **Pick up ball**, walk somewhere else, and **Put down** to choose a new place to play.
- Kick toward the low wall for a rebound. Run or jump through the fallen leaves; the ball scatters them too.
- Walk into school and return through the existing classroom flow.

## Implementation

`SchoolGatePlay.ts` owns the scene, Poppy state/route/motion, contextual controls, speech, sound, leaves, and lifecycle. `SchoolBallPhysics.ts` owns substepped ball motion, drag, physical boundaries, rebounds, and directional kicks. `GameLoop`, `Outdoors`, `Neighborhood`, and `main` connect these to the existing game.

`student-poppy-play.glb` preserves the existing Poppy sculpt and adds the matching CC0 Quaternius Walk/Kick_Right animation channels. Classroom Poppy is unchanged. `scripts/build-poppy-play.mjs` rebuilds that variant from the original ignored source. Asset credit is in `public/assets/people/SOURCES.md`.

Arianna's original mesh, rig, weights, materials, 14,694 triangles, 28 joints, and both 2048×2048 maps are unchanged. The game still renders at native display pixels. Existing reviewed rig animations drive her actions; no new rig or arm adaptation was added.

## Validation

- TypeScript check and Editor-release build passed.
- 28 ball-physics, fishing, trading, and progress/save tests passed.
- Touch input at 390×844 CSS pixels / 780×1688 render pixels exercised the real home-to-school route, pickup, carrying, Poppy following, put-down, kick, return, leaves, school entry, and return outside. After fixing Poppy blocking the gate, the complete interaction/entry loop passed again from an isolated gate start.
- Front and side render review covered seven phases of each Arianna kick/pickup/put-down and Poppy walk/kick clip (70 captures). No jacket stretching or broken limbs observed. Poppy kick contact was moved later in her clip to match the forward foot motion.
- Three repeated visits ended at exactly 157,562,392 texture bytes and 2,333 assets each time; Poppy's container and scene root both returned to zero. Switching Poppy to the engine's model lifecycle fixed a 3,120-byte skin-texture leak per visit. House entry and pond fishing still open normally.
- Preview checks used disposable `dumpling.outdoorReview.*` storage and created no production `arianna.*` save keys. Wallet unchanged during the school play check.

The browser scripts are `scripts/school-gate-playtest.mjs`, `scripts/school-gate-motion-review.mjs`, and `scripts/school-gate-regression.mjs`. They expect the local server above; evidence writes to `artifacts/school-gate`. Set `GATE_SHORT=1` to skip the already-tested walk from home for an isolated interaction check.

## Review status

After reviewing the local result, the user explicitly requested push and deployment on September 26. Publish through origin/main and verify the exact live release. The implementation and validation above describe the reviewed local build; no PlayCanvas scene regeneration is required for these code-only changes.

A physical-phone performance test and your daughter's playtest are still needed. Automated checks confirm controls and consequences work; they cannot confirm whether she finds this fun. Watch whether she notices Poppy naturally, invents another kick/placement without prompting, and returns to the scene by choice. House and store interactions should use the result of that test before expanding this approach.
