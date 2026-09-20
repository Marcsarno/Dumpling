# PlayCanvas Editor migration — September 20, 2026

The complete existing game now runs in the separate Editor project. The bedroom pilot remains available. No production deployment, original working-directory files, or real browser saves were changed. No paid feature or purchase was used.

## Open and run

- Editor: https://playcanvas.com/editor/scene/2600724
- Published full-game preview: https://playcanv.as/b/7fdb31ef
- Original bedroom pilot: scene 2600710, https://playcanv.as/b/88b08d39
- Project 1604178, currently named **Dumpling Bedroom MCP Pilot**; free/public.
- Editor checkpoint: **b800faac-8daa-4fab-89a8-d83a1f340199**.
- Full build 64225, app 778735, engine 2.22.2; approximately 85.2 MiB.
- Static export: [dumpling-editor-full-game.zip](migration/exports/dumpling-editor-full-game.zip), download build 64227.
- Local export: run `node scripts/pilot-server.mjs`, then open http://127.0.0.1:5186/migration/index.html. The archive is already extracted under migration/exports/game. Serve it over HTTP, not file://.

The original checkout remains clean at **fe3ae65**, branch master. Work is isolated on **codex/editor-bedroom-pilot** in this worktree. The existing Vercel game remains the production release.

## What moved

The house and family rooms, all three stores, classroom, characters, phone controls, chores and daily cycle, pet/family behavior, Tornado, shopping, collection/reveals, trading, all Pop levels and Classic, ticket prizes, music and developer tools are included.

The Editor contains **2,337 entities**, including **1,019 environment records**, **118 furniture/collision groups**, native previews for 68 model sources, authored materials, camera/sun and 13 fixture lights. These are editable scene entities; the runtime reads their saved transforms, materials, collision footprints and interaction anchors. This is more than launching the original generated layout.

Original GLBs, character proportions, running wrist correction, carry/rest adaptations, collectible identities, reveal polish and gameplay rules are reused. Raw GLBs are preserved as binary assets to avoid importer changes to animation clips. URL resolution adapts original asset paths and external GLB textures to Editor/build assets.

## Evidence

- Through MCP, moved the bedroom bookshelf to **[1.55, 0, -2.55]** and Clover's center display to **[1, 0, 0.25]**. Reopened the scene and verified saved edits.
- Actual touch movement stops at the moved shelf; the book chore uses its new standing point and places the book at **[1.94, 0.79, -2.49]**.
- Moved store collision, box position and inspection destination agree. Classroom desk group also owns classmates, offers and trading destinations.
- The published build and downloaded static export were tested independently. Export reload retains moved anchors. Disposable sentinel values in all three original save keys remain untouched.
- Final build: breakfast carry/eating, school, two-store travel/reload, ticket redemption, bedtime/day change, full trading negotiation/protections/reload, all five music tracks, and nine reveal cases across all four rarity tiers passed.
- Pop's three timed levels, unlocks, idle replay, Classic and phone layout passed on build 64222; final build changes only the classroom binding.
- 320/390/430-pixel phone controls passed. 34 existing unit checks plus original rig/running-pose checks passed. TypeScript and reproducible bundling passed.
- Evidence/screenshots: [scene/export checks](migration/evidence/scene/report.json), [daily play](migration/evidence/life/report.json), [trading](migration/evidence/trading/report.json), [reveals](migration/evidence/reveals/report.json), [Pop](migration/evidence/pop-levels/report.json). Music verification is recorded in migration/evidence/verification.json.

Game/asset errors were absent in passing browser runs. The PlayCanvas host's favicon 404 is excluded from console assertions. Codex's embedded browser intermittently reports an Electron startup error; reloading let Editor Launch connect (MCP ready=true), but MCP runtime screenshots still timed out. Runtime screenshots and gameplay evidence therefore come from independent Edge test sessions. Editor MCP scene/asset operations and publishing work. Physical iPhone/Safari remains untested.

## Source of truth and next edits

**Scene layout/materials/lights:** Editor scene 2600724 is authoritative. Move a furniture parent tagged `migration.prop` so its collision and destination children follow. Collision footprints are transforms consumed by the existing custom controller, not Ammo rigid bodies. Disable an existing record instead of deleting its stable `key:` tag.

**Gameplay code:** TypeScript in this isolated worktree is authoritative. Run `node node_modules/typescript/bin/tsc --noEmit` and `node scripts/migration-build.mjs`. Upload only migration/full-game.mjs to existing script asset **307711680**, parse it, and publish the separate scene. Do not regenerate/reimport the original layout over later Editor edits.

**Assets:** original files under public/assets are retained. Editor assets use game__ names; native layout__ assets provide Editor geometry. Replacing a preview's model does not automatically replace the original runtime model: update the corresponding source/raw asset mapping. Shader/procedural texture and character animation logic remain code. New scene entities can render normally, but new interactive props need registered gameplay/anchor metadata.

**Backups:** migration/editor-scene.json and editor-materials.json snapshot the final scene; the static ZIP is the exact runnable export. Other layout JSON and one-time import scripts document initial conversion. The two source-conversion scripts are deliberately guarded against accidental reruns. Staging uploads and large export archives remain local and Git-ignored.

Migration saves use **dumpling.editorMigration.*** keys. No production save import/reset occurred. Keep using disposable profiles for tests.

## Assessment

Yes: the workflow now provides useful visual editing and MCP control across the game while retaining working gameplay. All current game systems are carried over. A deeper conversion of dynamic NPC routes, generated effects/UI, arbitrary floor-plan changes, and interchangeable model templates is optional future work, likely several focused passes with regression testing. Ordinary prop arrangement, palette and lighting iterations can start now. The supplied store mockup redesign has not been applied as part of this migration.
