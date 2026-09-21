# Production Editor build

Vercel serves the exported Editor scene with current TypeScript gameplay compiled into it, preserving the three authored stores.

- Production: https://dumpling-sandy.vercel.app/
- Exact release: /release.json records Git SHA, scene, checkpoint and runtime hash.
- Git: Marcsarno/Dumpling main; Vercel project dumpling / team marcsarno.
- Scene: editor-release/ from static build64266, scene2600724, checkpoint4cb508b4-1c57-4729-bcf6-05d7f29eba7c.
- Build: pnpm run build. Type-checks and compiles gameplay, copies the committed export to dist, then replaces runtime307711680 with the current content-hashed bundle.
- pnpm run build:engine is the old Engine/Vite development build, not the production scene build.

Production index sets __productionRelease before modules load. SaveNamespace.ts selects established arianna.* keys there; isolated previews use dumpling.editorMigration.*. No save reset, schema conversion or test-save copying occurs. Collection, currency, daily state, Lilah state, music mute and DEV checkpoint keys retain their original names.

After Editor scene changes, download a fresh static export through MCP, back up and refresh editor-release/, then build and test before deployment. Code-only edits require a rebuild, not scene regeneration. Keep Editor runtime307711680 synchronized for playtesting. Never regenerate the world over authored edits.

Release test: set GAME_URL to served dist/index.html, then run node --experimental-transform-types scripts/editor-release-smoke.mjs. This uses disposable existing-save fixtures and checks authored planters, purchase, reload, exit, preserved preview saves and music mute. EVIDENCE selects output directory. Full visual/store/house evidence is in STORE_UPGRADE.md. Large standalone archives remain Git-ignored in stores/exports/.
