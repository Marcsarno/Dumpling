# Student, fishing and outdoor refinement — September 24, 2026

## Scope and review

Built on commit d453aba. Preserved Arianna, the guard and cook, trading identities, rewards, saves, room navigation, and existing house gameplay. The reviewed pass is prepared for a GitHub push and production deployment; release.json identifies the deployed commit.

The initial in-game inspection found miniature adult proportions, small eyes, thin hair silhouettes, identical clothing reads, collectible-like fish rotation, weak directional cues, and large flat outdoor surfaces. The user's supplied children and classroom concepts guided three benchmark students. The actual cast has three identities, so the approved benchmark direction covers all current students; the cafeteria reuses those same three assets.

## Character iterations

Original rounded mesh replacements on the existing CC0 Quaternius skeletons and Idle_Neutral / Wave / Interact tracks. Large eyes with blink morphs, cheeks, smiles, button noses, swept hair / curls / ponytail, pastel hoodies, continuous weighted trouser knees and sneakers. Blinking uses independent timing. Classroom hands fit near the desk. Cafeteria placement includes the stool height difference rather than changing the children's proportions or furniture.

Actual screenshots exposed intersecting fringe surfaces, an open hair cap lost during remeshing, overly raised hands, segmented trouser knees and cafeteria seating that was too low. These were corrected and rendered again. Standing and greeting screenshots additionally check silhouettes and skinning. Debug standing copies exist only inside the screenshot test and are not added to gameplay.

Final triangle counts: Jules 19,194; Remy 18,500; Poppy 21,258. Two material surfaces per student, no student textures. Three GLBs total approximately 3.2 MiB. Only the relevant classroom or cafeteria is shown. This increases geometry versus the previous adult bases; the budget is controlled through fused/reduced hair and shared assets, not a claim of unchanged cost.

## Fishing

A 4/3 simulation tempo shortens cast, wait, battle and release; the full 3.6-second bite reaction window is retained. Same-policy seeded benchmarks measure 23.7–24.6% faster total cast-to-catch time. Active steering cases: 15.37–16.78 seconds before, 11.62–12.68 seconds after. Simple reel/rest remains viable.

Animated chevrons are positioned directly over the corresponding control. Correct input changes the cue to a checkmark, and high tension overrides it with LET GO. Placement follows actual control bounds, including wide screens; reduced-motion preferences disable the chevron animation. Controls retain their size and touch/keyboard behavior.

Fish use distinct swim, dart, impulse and airborne clips. The airborne clip's floor-facing root roll is removed while retaining animated tail and fin bones; species-specific bursts, tilts and small bobs replace continuous collectible spinning. Landing arcs into the catch pose, then release transitions to swimming and dives toward the pond.

## Outdoors

Three small 256px original painted textures provide restrained ground/path variation and roof tile definition. Lawn UVs align with world space. Rounded path connections remove sharp overlaps. Pond center-to-shore color variation, composed meadow fringes, a few flower groups, varied foliage colors and framed school beds create intentional focal areas while preserving walk routes. Flowers and grass share one lightweight mesh. No new lights, reflections or postprocessing were added.

The first outdoor material pass was too blotchy and the grass blades too pale. The reviewed pass softens brush marks, fixes vertex-color space, and substantially reduces flower geometry.

## Validation and evidence

- TypeScript check and Editor-release build passed.
- Eight fishing unit tests passed, including failed-save safety, repeat receipt protection, bite forgiveness, input release and all four fish.
- Seeded timing benchmark: scripts/fishing-timing-benchmark.mjs; artifacts/refinement/timing-after.json.
- Actual touch and keyboard interaction, blur release and simultaneous reel/steer passed.
- Both directional cues visibly animate and align with the intended control.
- All four fish have changing skeletal transforms after landing, and switch to swimming during release; artifacts/refinement/fishing-animation-review.json.
- Full joystick playthrough: home door → garden → four fish and two saved squishies → crosswalk → school → home → reload; artifacts/outdoors/playthrough.json. No browser errors or production-save writes.
- Student captures: artifacts/npc-upgrade/*-close.png, artifacts/refinement/students-standing.png, students-greeting.png, cafeteria-*.png.
- Outdoor playable camera captures: artifacts/refinement/garden-wide.png, school-wide.png, pond-phone.png; final fishing captures show the refined pond.

## Limits and next art opportunities

The student models are a real-time interpretation of the concepts, not exact matches to their rendered softness. Hair shaping and clothing folds could receive further artistic refinement. The existing staff retain their earlier visual style. Room geometry, lighting setup and broader school activities were not redesigned. Desktop browser and phone-size interaction tests do not establish thermal behavior on a physical phone.

PlayCanvas sync was authorized on September 25. The Editor connection currently reports an empty asset registry, so that sync remains pending. The Git deployment overlays these models directly and does not depend on an Editor upload. The local preview remains available at http://127.0.0.1:5191/dist/index.html?preview=school and ?preview=outdoors.
