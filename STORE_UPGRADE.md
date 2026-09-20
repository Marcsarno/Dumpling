# Three-store visual upgrade

All three stores now have distinct, reference-led layouts in the separate Editor project. The local export passes the store gameplay checks. The original production checkout remains clean at **fe3ae65**; Vercel and real saves were not changed.

## Review and play

- [Before/after comparison](stores/comparison.html), with all three running-scene screenshots and phone views.
- Best runnable version: http://127.0.0.1:5186/stores/exports/game/index.html — run `node scripts/pilot-server.mjs` from this worktree if needed.
- Editor: https://playcanvas.com/editor/scene/2600724 (project 1604178).
- Published art preview: https://playcanv.as/b/51f208ce — build **64260**. It includes all visual changes and phone/exit refinements, but **not the final saved-visit spawn correction** described below.
- Untouched Editor download: `stores/exports/pastel-stores-editor.zip`, build **64261**.
- Corrected runnable download: `stores/exports/pastel-stores-local-fixed.zip`. Serve its extracted directory over HTTP.

## Storage limit and exact stopping point

After the visual passes, the Editor displayed: **“You are over your disk allowance limit.”** Further uploads stopped. No plan was purchased and no storage was deleted. The full scene was reopened and read back through MCP: **4,361 entities**, including all three refinement groups and final prop/anchor edits. A new checkpoint request returned no ID; version-control status still points to the pre-art checkpoint **bcf0ec9c-a2a5-4bf0-ada7-f12b0965454a**. Do not assume the art changes have a new checkpoint.

The final reload-and-walk test exposed a startup ordering issue: resuming a saved store visit initially used the old code-generated entrance before the authored layout loaded. `src/main.ts` now places Arianna at the saved Editor entrance after layout binding. This correction is built and tested in the **local export only**. The Editor runtime asset 307711680 still needs this final bundle update once storage is resolved. The cloud preview can be recovered with the existing DEV “Unstick” command if a resumed visit starts outside the room.

The next step is a storage audit of unused imported assets/versions, with backups before any cleanup. Whether that frees enough space has not been established. A paid plan has not been selected or assumed necessary.

## Design and reuse

| Reference | Store | Main composition | Screenshot-driven refinement |
|---|---|---|---|
| 1 | Clover Corner | Boutique arrangement, offset shelves, mint back-left checkout, flower-rug feature table | Side merchandise crate, checkout pendant and plant accents |
| 2 | Peachy Playroom | Two aisles, giant squishy lounge, gift table and Squishy Section sign | Hanging charm rack, window/sign separation, entry clearance |
| 3 | Moonbeam Finds | Longer parallel aisles, broad back-wall showcase, round tiered display | Pink arch, flower endcaps and showcase plants |

The original dumpling/squishy geometry, collectible identities, face/accessory choices, bamboo containers, Arianna and animation corrections are retained. Display-only mesh reductions lower the squishy from 45,392 to 5,887 triangles and the closed container from 17,768 to 3,020. Original close-up/reveal assets are unchanged.

Existing Kenney bookcases, carts, registers, plants, doors, windows and trees are reused. A missing arched shelf and signs were made in Blender; native primitive helpers provide counters, tables, bins, gift boxes, rugs and stands. Shared pastel materials and static batching support reuse. Sources and rebuild instructions: [store-kit/SOURCES.md](public/assets/store-kit/SOURCES.md).

## Verified

- Actual touch-joystick routes reach and inspect **all 18 stock sites** in the corrected local export.
- A purchase in each store updates the original economy; all purchases and discoveries survive reload.
- Every welcome mat returns home after reload. Original production save-key sentinels remain untouched in disposable test contexts.
- Pushing into Clover's feature table stops at its authored collision edge.
- Product details no longer overlap the large Pop button while browsing; the footer shortcut remains available.
- Controls remain within 320-, 390- and 430-pixel phone viewports. Arianna loads, moves and returns to Idle; original running-pose/rig checks pass.
- Six existing hunt/economy tests, TypeScript and bundling pass. Passing browser runs report no game/asset errors.
- Scene edits survive Editor reopening and appear in the separately downloaded build.

Evidence: `stores/evidence/phone/report.json`, `collision.json`, `stores/evidence/final/report.json`; before/first/refined screenshots are retained. Phone checks use emulated Edge viewports, not physical iPhone/Safari. Cold screenshot FPS samples are not a device performance benchmark.

## Editing and source of truth

**Editor scene 2600724:** layout, native art, materials, lighting, collision footprints and interaction destinations. Move the existing `prop:<store name>:<index>` parent, keeping its collider, stand/marker, merchandise and `stock:<store name>:<site>:<n>` sockets together. The custom controller reads these footprints at scene initialization; relaunch after edits. Decoration groups are separately editable. New art renders natively; it is not regenerated by the old world builder.

**This Git worktree:** TypeScript gameplay and Blender/source scripts. `LayoutBridge.ts` binds authored stock sockets and batches store art. `GameLoop.ts` hides the oversized Pop button during product focus. `src/main.ts` contains the pending cloud upload correction. Rebuild with `node scripts/migration-build.mjs`, then update only Editor script asset **307711680** once storage permits. No layout reimport is needed.

`stores/after-scene.json` is the read-back snapshot. `stores/plans/*.json` and `scripts/plan-store-upgrade.mjs` document construction; do **not** blindly reapply them to the current scene or they will duplicate art. The downloaded export includes the referenced assets. `scripts/patch-store-export.mjs` applies the local-only runtime overlay to the exported game.

## Assessment

The Editor conversion is useful for continued visual iteration: the three stores now have editable, distinct furniture arrangements that keep gameplay attachments together. The reusable kit and original merchandise make subsequent rooms easier to upgrade. The result captures the pastel palette and compositions, while greenery, shelf density and lighting remain simpler than the mockups. The original dumpling silhouettes intentionally remain. Storage capacity and final cloud synchronization are the remaining workflow issues; production promotion is not part of this change.
