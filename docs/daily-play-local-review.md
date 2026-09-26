# Daily play and restored outdoors — local review, September 26, 2026

Reviewed against production baseline `eb47411`. User authorized commit, push and production deployment on September 26, 2026. Local game: http://127.0.0.1:5191/dist/index.html?preview=outdoors . The preview uses `dumpling.outdoorReview`, separate from production saves.

## What changed

The original pond, fishing shore, house and school street stay in their original coordinates. Removed the prototype cottages, second pond/turning-circle island, and added man/dog/leash/poop encounters. The street extension now joins the original west edge at x=-4, centered on z=-22.5. Both sidewalks and the street are traversable. Three existing shop interiors retain their save and stock logic; their outdoor entrances now face this street. Five small play gardens sit along its south side.

The user deferred scooter obstacle/control refinement and Dad's car ride. Existing scooter driving remains; old riding-only ball/puddle/crate encounters are not part of the new walking activities. The original house puppy and school crossing guard are preserved.

## Fifteen interactions, five per game day

| Activity | What Arianna does | Reaction |
|---|---|---|
| Backyard champion | Approach and kick a soft ball | It rolls, bounces and scores in the small goal; aim assistance applies when facing toward it |
| Wobbly bowling | Roll the striped ball | Contact topples pins, with a chain of wobbles and clacks |
| Tin-can tumble | Carry a beanbag, then toss it | Tins scatter off the display with a clatter |
| Special delivery | Take the trolley handle and push | The solid trolley resists movement; reaching the bay reveals a bouncing surprise |
| Captain Paperboat | Carry a folded boat to the water trough | It sails a little loop and comes back |
| Waddle parade | Wind the toy duck three times | Three ducklings join its waddling parade |
| Bubble trouble | Make bubbles, then walk into them | They pop individually; remaining bubbles remain interactive after completion |
| The sneezing flower | Bring the watering can and pour | The drooping head rises, shivers and sneezes |
| Whirlwind wishes | Blow on the pinwheel | It accelerates, flutters its ribbons and slows down |
| Surprise, ribbit! | Turn the music-box handle | The lid opens and a springy frog appears |
| Puddle piano | Step or hop between four puddles | Different notes and ripples make a small tune |
| Leaf-pile surprise | Jump into the pile | Leaves scatter to reveal a hidden rubber duck |
| Loop-de-loop post | Carry and throw a paper plane | It flies through three hoops and loops home |
| A very fancy flamingo | Carry a hat to the garden bird | It wears the hat and makes a polite bow |
| Teddy is hungry | Carry three treats to three plates | Teddy wiggles and nods thanks |

A seeded shuffled bag chooses five unique activities per day. All fifteen appear across each three-day cycle, and reloading never rerolls the day. Completed and partial multi-step progress are additive in `daily-play.v1`; allowance, collectibles and existing chore saves are not changed. Activities can be replayed without spending or awarding money. The journal shows today's five, hints and their order along the lane.

## Reference and asset decisions

House House describes ordinary objects, distinct sounds, repeatable reactions and object combinations as useful ingredients in the Goose Game design. This pass uses those principles in small child-friendly toy interactions, not its exact puzzles or assets. Sources: [developer Q&A](https://www.gamedeveloper.com/design/behind-the-honk-an-i-untitled-goose-game-i-q-a) and [House House IGF interview](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-house-house-s-i-untitled-goose-game-i-).

Reviewed [KayKit Character Animations](https://kaylousberg.itch.io/kaykit-character-animations), [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) and [Kenney Watercraft Kit](https://kenney.nl/assets/watercraft-kit), all CC0. Existing licensed nature assets are reused; the fifteen toys were modeled specifically in Blender because their folds, faces, handles and individual moving parts need to fit the interactions. Generator: `scripts/build-daily-play-props.py`. Exported GLBs, polygon/file-size report and sampled motions are under `public/assets/outdoors`. Original procedural audio is tied to the existing effects volume/mute setting. Attribution is updated in `public/asset-credits.html` and `public/assets/outdoors/SOURCES.md`.

## Animation correction and protected quality

The prior broad imported arm movement stretched the jacket. This pass retargets full source rotations relative to both neutral poses, preserves roll, and redirects excess sideways arm excursion into a forward swing suited to Arianna's coat and proportions. Imported timing, torso/leg motion, reaching, use, kick, throw and jump remain active. Supporting-foot grounding and explicit animation contact events align toy reactions. This replaces the earlier static-upper-body jump workaround. It does not create a rig, alter weights, change bone lengths, or edit the character mesh.

Arianna retains original GLB SHA-256 `35cfde9dba8d20d53019d654728972c04f7455ccc533040d00818f86d3f82989`, 14,694 triangles, 28 joints, and both original 2048x2048 maps. Native device-pixel rendering remains enabled. Contact sheets are smaller overview images; the individual PNGs are full-resolution captures.

## Checks and refinements

- TypeScript and Editor-release build pass; source and built character assets pass the protected-quality check.
- Twelve unit tests pass: daily selection/save/failure behavior, toy gravity/drag/bounce, and the existing eight fishing tests.
- All fifteen activities completed through the normal action button, including carrying/serving three treats and walking into bubbles/puddles. Review scripts reposition the player to isolate each activity; the separate regression script uses actual joystick movement for the doorway, street join and trolley collision/delivery.
- 112 front and side captures inspect eight imported actions at seven phases from start to finish; a separate live-input test covers stationary/moving jumps, landing, and jumping after scooter dismount. No replacement rig or frozen upper-body workaround is used.
- Fishing start/cast and its close camera, school entry/exit, shop entry from the corrected road, road traversal, reload persistence, trolley collision, repeated resource retirement/reloading, and carrying cleanup on returning home pass. Review saves never write production `arianna.*` keys.
- Visual review caught the first jacket adaptation still spreading, a low submerged-looking paper boat, cans falling into their display, an awkward launch point, weak trolley alignment, and the phone journal initially scrolling to its bottom. These were corrected and recaptured.
- New daily-play camera framing owns only its own zoom, preserving the existing fishing camera.

Evidence is under `artifacts/daily-play`: `group-*.json`, `edge-checks.json`, `jump-input-check.json`, `motion-review.json`, individual before/after images and pose images. `scripts/daily-play-review.mjs`, `daily-play-edge.mjs`, `daily-jump-playtest.mjs`, `play-motion-review.mjs` and `daily-play-performance.mjs` reproduce the reviews.

## Rendering and memory limits

New play props load only near the player and release container resources on retirement or going inside. Distant neighborhood sections retire their batches, entities, materials and shared container leases. Repeated near/far visits returned to identical far-end counts: 2 toy containers, 2,355 registered engine assets, 155,290,480 texture bytes, 30,312,824 vertex-buffer bytes and 4,764,478 index-buffer bytes in the recorded desktop run. Returning home released all toy containers and neighborhood sections. Existing home assets and the original crossing guard can remain resident; this is not a claim that the entire game unloads its house.

Phone-sized 390x844 browser emulation renders at the full 1170x2532 native 3x canvas. `performance.json` records frame-time distributions, draw calls, renderer and engine GPU allocation estimates. With other test browsers closed, near-home and far-end outdoor medians were 27.8 ms, p95 34.8/34.7 ms, at 213/100 draw calls. Indoors at night measured 34.7 ms median, 41.6 ms p95 and zero toy containers. These are desktop AMD/Edge measurements, not measurements from a physical phone. No physical phone was connected or thermally tested; phone performance remains an explicit release check. Arianna must never be reduced to address it.
