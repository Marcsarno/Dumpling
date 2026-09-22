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
