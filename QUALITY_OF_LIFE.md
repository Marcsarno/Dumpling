# Collection and daily-life quality of life

Art update: the initial special designs described below were rejected and replaced by the approved four-animal concept implementation. See ANIMAL_SCULPTS.md for current geometry, colors, model names, validation, and Editor checkpoint. The gameplay changes below remain in place.

September 21, 2026. Local gameplay changes, with PlayCanvas Editor runtime/portrait synchronization. Production deployment is a separate step; no real player saves were edited during testing.

- All blind-box tier rolls, including every store/series, use 65% Common, 25% Rare, 8% Epic, 2% Legendary. Roll a tier first, then an identity; adding characters does not dilute these tier odds. Previously committed sealed receipts retain their contents.
- Original 26 identities and ownership are preserved. Original Epic/Legendary designs now belong to Rare. Eight new friends supply one Epic and one Legendary per series: Dewdrop/Sunbeam Unicorn, Sugarplum/Opal Bunny, Starlight/Moonwish Panda, Nebula/Solstice Dragon. Runtime PlayCanvas geometry adds ears, horns, wings, foil flecks, shared procedural pearl/glitter maps, and iridescence. New portraits are rendered from those same models. Persistent glints and legendary light rings complement the reveal burst; reduced motion retains static light.
- Open next proceeds directly to the next sealed basket. Receipt clearing and opening both use the existing atomic save repository. The final action opens the collection. Collection actions stay at the top while scrolling; store selection and prize-shelf back actions also sit at the top.
- The reveal uses the actual bedroom with Ariana visible behind the floating basket. Its camera is lower and retains a little distance from her face. Squish randomly chooses among press, stretch, and jelly wobble, avoiding consecutive repeats and overlapping animations. Reduced motion is respected.
- Early bedtime requires completed current chores (including existing Lilah messes) and both daily store visits. The clock no longer discards incomplete afternoon chores at 7 PM. It pauses during active actions so phase transitions cannot invalidate an in-progress chore or bedtime.
- From 6:15 PM Lilah heads toward her crib. Put Lilah to bed fades briefly, applies her existing sleeping pose, and awards $1 once per day. The sleep state survives reload; a new day clears it. This is optional and does not block early bedtime.
- New days draw two household tasks from eleven possibilities, plus vacuuming, a second vacuum/spill choice, and pet care. Selection and locations persist across reload. Existing daily saves keep their task lists until the next day. Identical consecutive new task sets are avoided.
- Vacuum and scooper carrying use 2.475 units/second, up from 1.65. Other movement retains its prior speed. Action zoom changes from .76 to .608 of exploration height (25% greater magnification), with a lower camera. Floating interaction icons/rings are hidden during actions.
- Original synthesized house foley supplies munches, swishes, vacuum hum, and gentle handling sounds. Sounds stop on completion, cancellation, hidden tabs, scene changes, Pop, and developer pause. A separate Sounds control retains mute preference. No third-party audio was added.
- Pop keeps its existing levels, ticket economy, and main-collection ownership. The proposed store competition/two-ticket redesign remains deferred. Pop now retries audio unlock on its own interaction controls and its music mix is louder. Its store entry is compact and near the top. New earned friends can appear on the board.

## Build and verification

`pnpm run build` builds the authored Editor export, not the old generated-world build. The build overlays current collectible portraits and registers new ones in the exported asset registry. Layouts are not regenerated.

`node --import ./scripts/test-register.mjs --experimental-transform-types --test scripts/qol-test.mjs scripts/progress-test.mjs scripts/hunt-test.mjs scripts/pop-levels-test.mjs scripts/pop-rules-test.mjs scripts/life-polish-test.mjs scripts/daily-clock-test.mjs` checks 22 rules/save cases. All pass.

`scripts/qol-browser.mjs` uses disposable 390×844 touch saves to verify sequential reveals, all three squishes, reload ownership, sticky collection controls, Pop decoding/playback, crib fade/reward persistence, and early bedtime. `scripts/qol-house-browser.mjs` covers 320×640 chores, markers, audio cancellation, carrying speed, camera zoom, and the store entry. Evidence is under ignored `artifacts/qol/`.

Portrait regeneration: start Vite on a dedicated port and run `ART_URL=<origin> node --experimental-transform-types scripts/render-squishy-engine-portraits.mjs`. The script also encodes matching WebP images.

Physical iPhone listening/performance and the family's subjective approval of the new art/camera still need playtesting.

## PlayCanvas synchronization

Project 1604178 / scene 2600724 / main. Before-change checkpoint: `c680c0d1-7139-4ffb-a984-f25e8131367a`. Final checkpoint: `198582b7-52f8-4276-acf5-b883b714ec38`. Runtime asset 307711680 and all 34 portraits uploaded successfully; script parsing reports `fullGame` with no invalid scripts. Final runtime hash: `830cad22ba7d3411`.

The actual Editor launch was visually checked at 655×552. A legacy landscape rule hid the entire footer; Collection, Pop, and audio controls now remain visible at the top. All 22 unit checks and 12 mobile browser scenarios passed, alongside typecheck/build. The synchronized export backup is `artifacts/qol/editor-export.zip` (build 64293); it precedes only the final landscape CSS fix. Authored scene layout was not changed, so the committed baseline export remains in place with current runtime/portrait overlays at build time.
