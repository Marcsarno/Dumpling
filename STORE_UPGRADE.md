# Three-store visual upgrade — completed

The three stores are finished in the separate PlayCanvas Editor project, with distinct reference-led layouts, reusable pastel furniture, signs, display merchandise and leafy planters. The saved-visit entrance correction is now uploaded and included in both the published preview and the untouched Editor export. Production remains separate.

## Play and review

- Published preview: https://playcanv.as/b/0bf140c9 — build **64264**.
- Before/after comparison: http://127.0.0.1:5186/stores/comparison.html
- Local export: http://127.0.0.1:5186/stores/exports/completed/index.html
- Download: stores/exports/completed-stores.zip — static build **64266**, 93,241,193 bytes. Large exports stay local and Git-ignored. Serve the extracted directory over HTTP; no runtime overlay is needed.
- Editor: https://playcanvas.com/editor/scene/2600724 — project **1604178**.
- Final checkpoint: **4cb508b4-1c57-4729-bcf6-05d7f29eba7c**.
- Read-back scene snapshot: stores/completed-scene.json — **4,430 entities**, including nine new leafy planters.

Run `node scripts/pilot-server.mjs` from this isolated worktree if the local preview is stopped.

## Design and reuse

| Reference | Store | Completed composition |
|---|---|---|
| 1 | Clover Corner | Boutique arrangement, offset shelves, mint back-left checkout, flower-rug feature table, side merchandise crate and pendant |
| 2 | Peachy Playroom | Two aisles, giant squishy lounge, gift table, Squishy Section sign and hanging charm rack |
| 3 | Moonbeam Finds | Long parallel aisles, back-wall showcase with pink arch, flower endcaps and round tiered display |

Original collectible identities, squishy faces/accessories, bamboo containers, Arianna and her animation corrections are retained. Display-only mesh reductions lower the squishy from 45,392 to 5,887 triangles and the closed container from 17,768 to 3,020; close-up/reveal assets are unchanged.

Existing bookcases, carts, registers, doors, windows, trees and plants are reused. Blender supplies the arched shelf and signs. Native scene primitives supply counters, tables, bins, gift boxes and rugs. The final nine floor planters reuse the bedroom's pot/leaf geometry. Shared materials and static batching reduce duplication. Sources: public/assets/store-kit/SOURCES.md.

The mockups guide palette and composition rather than exact replicas. The original dumpling-shaped merchandise remains, and shelf density and lighting are simpler than the reference renders.

## House review

The existing house layout was retained: no misplaced furniture or blocked room connection justified rearranging it. A snapshot comparison confirmed that all 1,822 house entities are unchanged.

- Static navigation audit found reachable approaches to **all 61 interaction targets**. This checks approach geometry, not execution of every chore.
- The final published preview passed actual touch routes through **all eight room areas**: bedroom, living room, kitchen, utility room, Marc's room, nursery, landing and bathroom.
- Bedroom book pickup, carry animation and placement at the authored bookshelf passed.
- All **13 house light fixtures** were enabled with positive intensity at night.
- Passing house run recorded no browser or asset errors.
- Evidence: stores/evidence/house-verified/report.json, room screenshots, and stores/evidence/house-before/path-audit.json.

The automated touch driver was tuned for gradual approach and realistic room-entry tolerance after jitter caused overprecise waypoint checks to stall. Gameplay movement and house geometry were not changed to accommodate the test.

## Store validation

- All **18 display sites** reached and inspected with actual touch input.
- A purchase in each store updates the original economy; purchases and discoveries survive reload.
- Every welcome mat returns home after reload.
- Phone controls fit **320, 390 and 430 pixels**; original character loads, moves and returns to Idle.
- Earlier explicit collision test confirmed Clover's feature table stops Arianna at its authored footprint, and product details remain clear of the large Pop button.
- Final scene screenshots contain the saved planter additions. Editor reopening, full scene read-back and the separate static export preserve them.
- TypeScript check passes. Existing rig/hunt checks were already passing before this scene-only finishing pass.
- Disposable browser contexts and the dumpling.editorMigration save prefix protect real arianna.* saves.

The final export validation uses the player's actual 0.24 collision radius in its test route planner; an earlier conservative margin incorrectly rejected a valid position beside a crate. No game collision shape was loosened.

Store evidence: stores/evidence/phone/report.json and stores/evidence/completed/report.json. Phone checks emulate Edge viewports; physical iPhone/Safari performance has not been tested.

## Storage

The user authorized removing 11 superseded published builds. That removed **843,959,943 reported bytes** and cleared the Editor disk warning. No textures, source assets, music or local archives were deleted, and no plan was purchased. See stores/storage-cleanup.json and stores/storage-audit.json.

The three agreed retained builds (64260, 64225, 64216) remain, with new finishing previews 64262 and 64264 added. Do not delete more builds automatically. The previous storage-blocked/local-only notes are obsolete.

## Source of truth and future edits

**Editor scene 2600724** owns layout, native art, materials, lighting, collision footprints and interaction destinations. Move the existing prop:<store name>:<index> parent so its collider, marker, merchandise and stock sockets move together. Relaunch after layout changes: custom collision bounds are read at initialization. Decorative groups remain editable.

**This Git worktree** owns TypeScript gameplay and Blender/source scripts. Rebuild code with `node scripts/migration-build.mjs`, then update runtime asset **307711680** only. Do not regenerate the layout over authored scene edits. The saved-visit fix in src/main.ts is now synchronized to Editor.

stores/after-scene.json preserves the earlier art state; stores/completed-scene.json is the latest snapshot. Construction plans document history and must not be blindly reapplied because they would duplicate entities. The older patch-store-export script is historical; the completed export needs no patch.

## Assessment

This workflow is useful for continued visual work: scene furniture, collisions and interaction locations can be inspected and edited together through MCP, while existing gameplay stays in TypeScript. The final stores are separate, playable and backed up. Production promotion was not authorized and has not occurred.
