## Latest: character and interactive fishing upgrade

See NPC_FISHING_UPGRADE.md. Actual Quaternius Worker guard; slimmer fitted classmates/cook; hold/release/countersteer fishing battle and visual pass. Tested locally, synced to PlayCanvas checkpoint 8c8b45c9-3521-4ba6-85fe-4edabd243ec1. No new Git commit or public deployment. Preserve all uncommitted work.

## Latest: outdoor route and fishing preview

See OUTDOOR_FISHING.md. Implemented and tested using the existing house/controller/rig/camera/school/collection. Local review: http://127.0.0.1:5191/dist/index.html?preview=outdoors . PlayCanvas checkpoint 866dbecf-16a4-4257-8c7f-a56289d85c36. Not committed or publicly deployed; production remains 8c00fe8. Preserve all current changes. Physical-phone thermal testing remains unverified.

## Approved school and opening release
User authorized commit, push and deployment of the approved classroom/cafeteria and bedroom-backed squishy reveal. PlayCanvas checkpoint 53c1a828-db27-4f44-a792-3c358d615449. Verify deployed SHA via /release.json. Preview-only notes below are historical.

## Latest opening presentation pass (September 22)
User approved school art, then supplied bedroom backdrop for openings. Copied actual artwork, added basket wind-up/quick release/reward arc/landing, rarity launch light and delayed caption. Separate four-rarity review: http://127.0.0.1:5191/scripts/opening-review.html . See OPENING_PRESENTATION.md. Public deploy/commit not requested for this pass. House SFX and Dad dining chair remain queued.

# Current work: reference-led classroom and cafeteria

See SCHOOL_UPGRADE.md. Complete in isolated local preview and PlayCanvas; not yet committed or deployed. Public release remains e25bcb6. User prioritized this school pass; revised reward sounds and Dad’s dining chair remain queued. Squishy opening now hides Ariana and the bedroom pending new background art. Review links and validation are in SCHOOL_UPGRADE.md. Preserve all current changes.

---

> September 22: user explicitly authorized commit, push, and public deployment of this audio, furniture, performance, bedtime, and family-routine release. Verify the resulting SHA at https://dumpling-sandy.vercel.app/release.json. Preview-only statements below are historical.

# Latest follow-up: bedtime, quiet audio, and family routines

Implemented in the local production preview at http://127.0.0.1:5191/dist/index.html and PlayCanvas. Not committed or deployed to Vercel. Preserve the existing uncommitted audio/furniture/texture work as well as this pass.

- Footsteps removed from playback/loading. Five action recordings remain. Music mix reduced another 10%; new saves default to 50%, existing explicit slider choices retained.
- Battery saver removed (UI, frame cap, lower shadow map and resolution). Texture reductions remain. Occluded/hidden scenes still stop rendering.
- Sleep at night requires finished chores, not store visits. Stores close at 7 PM, including an afternoon held at 7 by incomplete chores. Early afternoon bedtime still requires chores and shopping.
- Duplicate bookshelf was a stale PlayCanvas batch, not two intended shelves. LayoutBridge now regenerates explicit numeric batch IDs; cold load/reload checks count one shelf batch.
- Dad fetches a CC0 Kenney dinner once/day after school, carries it to the table, sits briefly, and resumes his routine. Pizza/taco/roast turkey vary by day; saved dinner survives reload without another serving. Food assets total ~193 kB. Dog occasionally visits visible food; food disappears and remains empty until refill/new day. Eating does not complete the player's pet chore.
- Opening redesign remains deferred.

See FAMILY_POLISH.md for validation, current checkpoint, and asset IDs.

---

# Latest follow-up: audio, house details, mobile performance

See AUDIO_MOBILE_POLISH.md. User authorized implementation. Local production preview (port 5191/dist/index.html) and PlayCanvas updated. Opening redesign remains deferred. Texture memory measured 439 → 88 MiB; battery saver was subsequently removed at the user’s request (see FAMILY_POLISH.md). New music/effects sliders, recorded foley, mirror/soap/chair/shelf fixes. This follow-up is not yet committed or deployed to Vercel; prior release below is historical. Preserve current changes.

# September 21 release authorization

Marc explicitly approved commit, push, and production deployment of the quality-of-life work and refined animal squishies. Release: Add daily-life improvements and refined animal squishies. This supersedes the preview-only status in the historical notes below. Verify the deployed commit at https://dumpling-sandy.vercel.app/release.json. Original arianna.* saves remain in use; Squishy Pop ticket competition is still deferred.

# Fresh chat — quality-of-life preview

Latest finish: Marc approved the animal shapes, then requested a texture/shading pass. Completed with geometry preserved, baked ambient visibility, warmer pigments, softer satin highlights, and refined kitten markings. See the top of ANIMAL_SCULPTS.md. Current Editor checkpoint `c727d56d-4356-46b8-9c40-148608e1c29a`, runtime `7865fc9cd1454e47`. Review remains `/scripts/animal-review.html` on port 5180. No deployment.

Newest art pass: Marc rejected the first eight special designs, approved a new four-animal concept sheet, and authorized its 3D implementation. See ANIMAL_SCULPTS.md. Four Blender sculpts with two palettes each replace the rejected art while retaining preview ownership IDs. Updated Editor checkpoint `e5a76d3c-9d1c-42a8-a434-76a29c872541`; runtime `859a41722572aae6`. The local concept-to-model review is `/scripts/animal-review.html` on port 5180. Final model appearance awaits user review. No production deployment.

Latest work: September 21 quality-of-life pass, documented in QUALITY_OF_LIFE.md. Changes are local and synchronized to PlayCanvas scene 2600724, final checkpoint `198582b7-52f8-4276-acf5-b883b714ec38`. Typecheck/build, 22 unit checks, and 12 mobile browser scenarios passed; Editor landscape launch was visually checked. No commit, push, or production deployment was performed for this pass. The production authorization below refers to the previous release only. Preserve the current uncommitted changes. Squishy Pop competition/ticket redesign is explicitly deferred.

Preview: https://launch.playcanvas.com/2600724?debug=true&device=webgl2

## Previous production Editor release

Read PROJECT_HANDOFF.md and EDITOR_RELEASE.md, then inspect Git status and https://dumpling-sandy.vercel.app/release.json before changing anything.

Workspace: C:/Users/marc7/Codex Game Projects/Dumpling Game File.
Repository: Marcsarno/Dumpling; local master tracks origin/main.
Production: https://dumpling-sandy.vercel.app/.
Release title: Deploy completed Editor stores with existing save continuity.
The user explicitly authorized commit, push and production deployment. Verify its exact SHA via release.json and GitHub deployment status.

Completed: full game migrated into PlayCanvas Editor; three distinct pastel stores based on supplied mockups; original characters, assets and animation corrections preserved; saved-visit entrance fix; nine reused leafy planters. All18store display routes, purchases, reloads and exits passed. House review checked8room routes,61interaction approaches,bookshelf chore and13night lights. No house rearrangement was needed. See STORE_UPGRADE.md.

PlayCanvas MCP connected successfully. Project1604178; scene2600724; runtime307711680. Open https://playcanvas.com/editor/scene/2600724 and read the project/scene before edits. If disconnected, open Editor and use MCP CONNECT. Free plan sufficient; no paid plan authorized.

Editor owns layouts/materials/lights and attached collision/interaction nodes. Git TypeScript owns gameplay. editor-release/ is the committed exported scene/assets used by Vercel. Refresh it after scene edits. pnpm run build compiles current gameplay into this export. build:engine is the older code-generated-world build and must not replace production.

Production preserves arianna.* saves. Editor previews use dumpling.editorMigration.*. Never clear or rewrite real saves; test in disposable browser contexts. Preserve newer/uncommitted work. Wait for the user's next instructions; no further expansion is requested yet.

Original baseline: fe3ae65. Completed isolated art commit:26d202a.
Separate preview: https://playcanv.as/b/0bf140c9.
Isolated worktree: C:/Users/marc7/.codex/visualizations/2026/09/20/01a0bf81-a7a0-7d63-a78f-613b597b3366/dumpling-editor-pilot.
Physical iPhone/Safari performance and subjective visual approval remain unverified.
