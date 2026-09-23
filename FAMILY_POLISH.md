> September 22: user explicitly authorized commit, push, and public deployment of this audio, furniture, performance, bedtime, and family-routine release. Verify the resulting SHA at https://dumpling-sandy.vercel.app/release.json. Preview-only statements below are historical.

# Latest follow-up: bedtime, quiet audio, and family routines

Implemented in the local production preview at http://127.0.0.1:5191/dist/index.html and PlayCanvas. Not committed or deployed to Vercel. Preserve the existing uncommitted audio/furniture/texture work as well as this pass.

- Footsteps removed from playback/loading. Five action recordings remain. Music mix reduced another 10%; new saves default to 50%, existing explicit slider choices retained.
- Battery saver removed (UI, frame cap, lower shadow map and resolution). Texture reductions remain. Occluded/hidden scenes still stop rendering.
- Sleep at night requires finished chores, not store visits. Stores close at 7 PM, including an afternoon held at 7 by incomplete chores. Early afternoon bedtime still requires chores and shopping.
- Duplicate bookshelf was a stale PlayCanvas batch, not two intended shelves. LayoutBridge now regenerates explicit numeric batch IDs; cold load/reload checks count one shelf batch.
- Dad fetches a CC0 Kenney dinner once/day after school, carries it to the table, sits briefly, and resumes his routine. Pizza/taco/roast turkey vary by day; saved dinner survives reload without another serving. Food assets total ~193 kB. Dog occasionally visits visible food; food disappears and remains empty until refill/new day. Eating does not complete the player's pet chore.
- Opening redesign remains deferred.

Validation: TypeScript/build, clock boundary rules, five QoL rules tests; six audio browser checks; full bedtime and Dad fetch/carry/place/sit/stand sequence and dog meal; incomplete chores/7 PM door/reload/meal variants; one-batch bookshelf audit. Browser evidence is under artifacts/family, artifacts/bookshelf, artifacts/audio-performance. Tests use disposable saves. PlayCanvas fresh launch has no warning/error logs.

Editor checkpoint: d647c6b8-b244-4ba4-b21e-b07e4218823e. Runtime: 85042e7863414f0a. Food asset IDs: pizza 308080075, taco 308080076, turkey 308080082. Production release remains 709af847891467066aa553f38c2be65bdc20c55b.

