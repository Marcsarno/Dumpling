# Reference-led Dumpling Friends

Latest: Marc approved the four 3D shapes and requested a final texture/shading pass. That pass preserves every unique vertex position (verified against the pre-finish assets), adds baked local ambient visibility, adjusts satin roughness/specularity, warms cream/peach pigments, deepens lavender, and refines the kitten's lighter head patches versus darker outer ears. The comparison viewer's ambient/key/fill balance was also corrected; runtime material improvements apply in the bedroom as well.

Run `scripts/finish-animal-squishies.py` in Blender after the base sculpt builder. It bakes 64 hemisphere rays per vertex, exports active vertex colors for runtime ambient occlusion, and writes `artifacts/animal-squishies/dumpling-friends-finished.blend`. No directional highlight is painted onto the model. Render portraits after this finishing step. The four final GLBs total 3,766,120 bytes; triangle counts remain unchanged. All 34 portraits now total approximately 164 KiB.

Finish validation: typecheck/build, eight geometry/material/reveal tests, all 34 portrait renders, and seven disposable mobile gameplay scenarios passed. `scripts/animal-finish-test.mjs` verifies AO range/alpha and, when the local pre-finish backups exist, unchanged geometry hashes. Evidence: `artifacts/animal-squishies/finish-validation.json` and `finish-report.json`. Current Editor checkpoint: `c727d56d-4356-46b8-9c40-148608e1c29a`; runtime hash `7865fc9cd1454e47`. Four runtime binary GLBs, eight portraits, and the parsed runtime were synchronized. Imported Editor source-model copies retain the base sculpt; the final shaded editable source is the finished Blender file. Production is unchanged.

September 21, 2026. Marc approved the four-animal concept sheet and asked for a close 3D realization. The earlier pearl/unicorn/dragon designs and abstract concept sheets were rejected. This is a new implementation for visual review, not approval of the final models or authorization to publish production.

Approved reference: `public/assets/squishies/concepts/animal-friends-approved.png`.
Interactive comparison: http://127.0.0.1:5180/scripts/animal-review.html

Four dedicated Blender sculpts replace the previous primitive attachments: Lavender Panda, Matcha Frog, Peach Blossom Bunny, and Biscuit Kitty. All have broad dumpling bodies, resting paws, surface-following faces/markings, and satin materials. Bunny, frog, and cat features are joined into continuous sculpted skins. Cat ears are rounded triangular pillows with continuous color mapping across the ear roots. Panda ears are tucked into its head. No pearl ribbons, divided body colors, horizontal stripes, horns, or wings remain on these designs.

Each sculpt also has a second palette: Honey Panda, Lotus Frog, Lilac Blossom Bunny, and Lilac Kitty. They share meshes. Rarity effects remain in the existing opening VFX, separate from the body materials. The 26 original dumplings are retained.

Existing eight preview IDs are deliberately unchanged to preserve receipts and ownership. `dewdrop-unicorn`/`sunbeam-unicorn` now map to frogs; `nebula-dragon`/`solstice-dragon` now map to cats. UI names and Pop identity rules match the replacement animals. Rarity odds remain 65/25/8/2.

## Rebuild and review

- Authoring: `scripts/build-animal-squishies.py`, run with Blender 5.2 from repository root. Produces four self-contained GLBs in `public/assets/squishies/`, editable master `artifacts/animal-squishies/dumpling-friends-master.blend`, geometry report and honest Blender renders.
- Runtime materials: `src/game/AnimalSquishy.ts`; loading: `src/game/SquishyArt.ts`. The kitten cap mask is smooth front-projected color, generated once per palette and application.
- All 34 portraits are rendered from actual PlayCanvas models using `scripts/render-squishy-engine-portraits.mjs`, then encoded to WebP. Total portraits: approximately 163 KiB.
- Geometry: 22,244 / 37,768 / 40,620 / 39,328 triangles for panda/frog/bunny/cat, seven material groups per model. Four shared GLBs total approximately 3.2 MB. Physical iPhone performance remains unmeasured.
- The production build overlays these GLBs alongside current portraits into the authored Editor export; authored rooms are unchanged.

Validation: typecheck and Editor-release build pass. Twelve tests across `animal-sculpt-test.mjs`, `squishy-art-test.mjs`, and `qol-test.mjs` pass, including finite geometry, complexity bounds, stable ownership IDs, rarity, and reveal behavior. Portrait rendering validates all 34 identities. Seven disposable mobile browser scenarios in `qol-browser.mjs` pass with no page errors, including the new frog/panda/cat bedroom openings, squish variants, receipt reload, collection, Pop audio, crib and early bedtime. Actual engine screenshots are under `artifacts/qol/`; model geometry/render evidence is under `artifacts/animal-squishies/`.

## Editor synchronization

Project 1604178, scene 2600724, main. Before checkpoint `9779956a-5d8e-4daa-8b66-a2c0038ae9c7`; after checkpoint `e5a76d3c-9d1c-42a8-a434-76a29c872541`. Runtime hash `859a41722572aae6`; script 307711680 parses as `fullGame` without invalid attributes/scripts. Eight replaced portraits uploaded successfully.

Runtime binary asset IDs: panda 307752452, frog 307752453, bunny 307752454, cat 307752455. Named `game__squishies__animal-<kind>.glb.bin`. Upload `.bin` staging copies to preserve binary type; passing a `.glb` path triggers Editor model import regardless of the requested type. The imported scene/model copies are retained as editable Editor sources, named `Sculpt source - <kind>` (scene IDs 307752406, 307752415, 307752425, 307752434).

No commit, push, or production deployment was performed.
