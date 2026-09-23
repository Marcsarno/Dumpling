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

# Latest work — quality-of-life preview

Latest follow-up: user approved all four animal shapes; requested surface/color/shading refinement. Completed without changing geometry. See ANIMAL_SCULPTS.md for finishing pipeline and checks. Current Editor checkpoint `c727d56d-4356-46b8-9c40-148608e1c29a`; runtime `7865fc9cd1454e47`. Local and Editor previews updated; production untouched.

Newest: the initially implemented eight special designs were rejected. The user approved the subsequent Dumpling Friends concept and authorized rebuilding in 3D. See ANIMAL_SCULPTS.md for the four dedicated Blender animal models, eight palettes/identities, verification, and Editor checkpoint `e5a76d3c-9d1c-42a8-a434-76a29c872541`. Final 3D art is for review; production remains unchanged.

September 21: See QUALITY_OF_LIFE.md and FRESH_CHAT.md for the completed local/Editor pass. Rarity, eight new special squishies, sequential bedroom reveals, squish variants, bedtime, chores, camera, audio and visible navigation are implemented and tested. PlayCanvas final checkpoint: `198582b7-52f8-4276-acf5-b883b714ec38`. No commit/push/production deployment was performed for this pass. The ticket competition remains deferred. Preserve current uncommitted work; deployment authorization in historical sections applies to earlier releases.

# Previous release — completed Editor game

The user authorized commit, push and deploy. Read FRESH_CHAT.md and EDITOR_RELEASE.md for the current build and save protections. Production: https://dumpling-sandy.vercel.app/; verify the exact deployed SHA at /release.json. Release title: Deploy completed Editor stores with existing save continuity.

PlayCanvas MCP is connected and verified; project1604178, scene2600724. Full migration, three distinct stores and store/house checks are complete. The house layout was retained. Production builds the committed Editor export plus current gameplay and preserves original arianna.* saves.

Older sections below are historical. Statements that MCP is unconnected, migration is unauthorized, or stores are local-only are superseded. Wait for the user's next instruction.

---

## Isolated Editor migration — newer than the notes below

Read FRESH_EDITOR_MIGRATION.md and EDITOR_MIGRATION.md first. Full-game migration is published separately; production remains fe3ae65. This checkout is the isolated migration branch.

# Dumpling / Arianna game — project handoff

## Fresh-chat checkpoint — September 20

Read **FRESH_CHAT.md** first for the compact current state, then the latest
sections below. Previous production baseline: **f72d074**.
Both the material/rarity/reveal polish and user-supplied music integration are
completed and tested. Marc subsequently requested **commit and deploy before
moving to a fresh chat**. Release title: `Polish squishy reveals and integrate scene music`.
Target: `Marcsarno/Dumpling` main → https://dumpling-sandy.vercel.app/.
Use Git HEAD and GitHub/Vercel deployment status to identify this release rather
than the older baseline. Preserve this release and the user's saves.

PlayCanvas MCP was registered globally and enabled with `codex mcp add`.
Because npx was absent from PATH, the configured executable is
`C:/pinokio/bin/miniforge/node.exe`, with arguments
`C:/pinokio/bin/miniforge/node_modules/npm/bin/npx-cli.js -y @playcanvas/editor-mcp-server`.
The server-specific PATH contains `C:\pinokio\bin\miniforge;C:\Windows\System32;C:\Windows`.
Registration was confirmed with `codex mcp get playcanvas`; actual startup,
tool discovery and Editor connection have NOT been verified. Marc reports closing
and reopening the app. This old chat still exposes no PlayCanvas tools. A new chat
should first check its available tools; do not claim connection from config alone.
This game is a local PlayCanvas Engine + TypeScript + Vite project, not a verified
linked PlayCanvas Editor project. Do not migrate it or upload it merely to use MCP.

## User-supplied scene music — September 20 (local)

Marc added six MP3s to `public/assets/audio/`. `HouseMusic` now selects the original
Home track in morning/night, Home v2 for afternoon chores, School trading in
recess, and alternates Shopping / Shopping v2 when entering a different store.
Pause/resume within a store does not advance the selection. Alternation is local
to the current session; reload starts with Shopping 1. One audio voice, gentle
fades, five-second repeat gaps, existing persistent mute, reveal ducking and
Pop/DEV/Tornado/hidden-tab pause are retained. Pop music is unchanged.

`Squishy unlock.mp3` is 9.56 seconds and deliberately NOT used or loaded. Marc is
undecided; any later use should be a shorter Epic/Legendary-only treatment, never
Common or Rare. Original files are preserved. See audio/SOURCES.md. Included in
the authorized release above; user saves remain untouched.

## Squishy material and rarity polish — September 20 (local)

Marc requested a contained texture/material and fully in-engine reveal polish
pass. See **SQUISHY_POLISH.md** for the changes, configuration, rebuild workflow,
tests and performance limits. The original models, all 26 identities and saved
receipts are preserved. New shared satin maps, matching engine-rendered portraits,
four configurable rarity treatments, bounded engine VFX, timed bells, admiration
holds and explicit NEW/DUPLICATE phone labels are implemented locally. No video
replacement, economy change, new collectibles or real-save writes were made.

Previous deployed baseline is **f72d074**. This polish pass is included in the
authorized release above. Marc asked to stop after this scope is complete; do not
start further game expansion. Physical phone/Safari and subjective sound/art
feedback are the next review, not established by desktop mobile emulation.

## Reference-led squishy art release — September 20

Marc requested better 3D dumplings and a hinged bamboo reward container based on
two supplied images. Custom Blender assets now replace the primitive dumpling and
gift box, with 26 matching portrait renders. Read **SQUISHY_ART.md** and the asset
SOURCES.md for design, rebuild steps and tests. Reward presentation now has its
own close-up lighting/camera, a hinge/rise/settle animation, a Squish button and
short-phone layout. IDs, collection, wallet, sealed receipts, trade protections
and Pop gameplay remain unchanged. Existing real saves were not touched.
Marc explicitly requested **commit and deploy** for this art pass. Release target:
`Marcsarno/Dumpling` main, connected to https://dumpling-sandy.vercel.app/.
The release commit is titled `Replace squishies and rewards with sculpted bao and bamboo steamers`.
Check GitHub deployment status for its published state. The previous deployed
baseline was **50fe15a** (family-life/classroom/collecting polish). All 18 art,
progress and trading checks, touch reward/reload tests, TypeScript and the
production build passed before release.

## September 20 release

Marc explicitly requested **commit and deploy** for the completed family-life
polish and follow-up below. Release target: `Marcsarno/Dumpling` main, connected
to Vercel at https://dumpling-sandy.vercel.app/. The release commit is titled
`Complete family life, classroom trading and collecting polish`. Check GitHub
deployment status for its published state. The 29 automated checks, touch
playthroughs, TypeScript and production build passed before release. Publishing
does not reset or migrate away existing version-one player saves.

## Follow-up completion — September 20

Marc asked to continue all the remaining fixes this pass. Classroom placeholders
are replaced with three seated CC0 Kenney Mini Characters, desk name/wish signs,
greetings and a safe, reviewable spare-only trade suggestion. Existing negotiation,
protections and explicit acceptance remain. House ·6 now draws from eleven chores;
both House ·6 and Bedroom ·5 vary reachable pickup/mess locations each replay.
Vacuum stays in laundry; vacuum dirt stays in living/kitchen. Daily save rules stay
unchanged. Bedtime now has a 3.2-second authored reach/tuck/sit/recline sequence
before the existing lying pose, with continuous bed/crib placement. Sleep completes
after 6.5 seconds. This is authored adaptation, not sourced bed-entry mocap.

House music now alternates quiet CC0 ukulele and piano by day, piano at night,
with fades and a 12-second gap between tracks. Mute persists independently.
See LIFE_POLISH.md and TESTING.md for follow-up verification and asset provenance.
These changes are included in the authorized release above; real saves are untouched.

## Family life and collecting polish — September 20

Marc explicitly requested this milestone: stable left running wrist, varied nearby
messes and laundry-room vacuum, clearer standing circles, carried/plated breakfast
and seated eating, room-to-room Tornado, stronger 5+/8+/rainbow Pop rewards, house
music, two untimed store visits, redeemable tickets, classroom trading and distinct
venue finishes, a roaming puppy with feeding/poop chores, bed/crib rest, and removal
of Dad's chair footrest. This request supersedes older pauses for these changes only.

Implemented in the current working tree. Read **LIFE_POLISH.md** for behavior,
asset provenance and tests. Existing version-one saves, collections, wallet, sealed
boxes, Pop levels and credits are preserved; tests use isolated browser profiles.
Legacy current-day chores stay finishable; varied task lists begin on the next day.
Tickets now buy a limited daily shelf at 1/3/5/8 tickets, replacing automatic coupons.
Every finished normal Pop round still awards at least one ticket. Stores pause the
clock and allow two distinct visits per day, including direct store-to-store travel.

The running fix now tests constant LEFT wrist rotation relative to the forearm,
because the previous palm-direction limit could miss visible wrist roll. Original
character GLBs and Dad's seated animation are unchanged. CMU 140_08 supplies resting
joint flex; placement/breathing are adapted, not a captured climb-into-bed animation.
School uses existing CC0 Kenney furniture plus attributed CC-BY boards; quiet CC0
house music has a persistent mute button. DEV remains available in production.

The prior release was 0334f84 (puppy). This milestone and its follow-up are included
in the authorized September 20 release above. No further game expansion or extra
Pop levels are part of this request.

## Sunny Pup replacement — September 18

- Marc requested replacing the dog with his new Meshy GLB, keeping the existing size, rigging it and sourcing an open quadruped walk. Original source is preserved in `public/assets/pets/`; runtime asset is `sunny-pup.glb`, with 49-joint skin and Idle/Walk retargeted from Mesh2Motion's CC0 quadruped animations. See `SUNNY_PUP.md` there for provenance and rebuild instructions.
- `PetCleanup` uses the same 0.48-unit bind height and original location. `DogAnimator` selects Idle/Walk from actual motion and manually advances only with the world. Developer/Pop pause also pauses the dog. Tornado travel uses a 0.30-unit/second walk in place of the old translation/bounce; return placement, cleanup reward and saves are unchanged.
- Rig/source checks, Blender and PlayCanvas phase renders, measured height/pause checks and a full touch-driven dog Tornado round pass. Tests use isolated browser profiles. No player saves or character GLBs were replaced. The old pug remains as a backup.

## Developer studio restored on the live site and phones — September 18

- Marc explicitly requested restoring the DEV control panel on the deployed game, including his phone. This supersedes earlier local-only notes. Keep the visible DEV launcher and dialog launchers available in production; no keyboard, special URL or opt-in flag is required.
- Removed build-only guards from panel loading, pause handling and developer command entry points. The `window.__roomTest` diagnostic API remains development-only. Phone launcher/panel account for safe-area insets.
- Existing checkpoint, reset/restore confirmations and Pop practice reward isolation remain intact. Opening the panel does not clear or replace saves. See `DEVELOPER_MODE.md` and `scripts/developer-production-browser.mjs`.

## Squishy Pop level progression (September 17–18, 2026)

- User explicitly authorized research, reusable level architecture and three playable levels while preserving the existing game, then authorized committing and deploying on September 18. Baseline deployed commit: `55f5248`. Release target: `Marcsarno/Dumpling` main → Vercel `marcsarno/dumpling`. Check Git/Vercel for the resulting release commit and status. Further levels are not authorized.
- Read `SQUISHY_POP_PROGRESSION.md` for research sources, exact goals, architecture and verification. `src/data/popLevels.ts` owns definitions and event-based objective tracking; original board/input/power rules remain intact.
- Trail: Level 1 earns 300 points with four types; Level 2 makes two chains of 5+ with four types; Level 3 pops 12 pictured friends and activates two powers with five types and a starting Bomb/Rainbow. All last 60 seconds. Classic remains available. One completion star unlocks the next level; optional two/three-star score thresholds support replay.
- Optional `pop.levels` in the existing progress save stores completion, stars, best score, best chain and attempts. Ticket receipts and level results commit atomically. No new reward currency, no changed coupon rules, no save reset. Developer practice does not award progression.
- Tests use isolated Edge contexts and a separate origin. Never clear Marc's real browser saves. No character, house, store or new art changes. Stop after these three levels.

## Running correction + live Squishy Pop shortcut (September 17, 2026)

- User authorized fixing Arianna's left arm while running and adding a live-game shortcut. `RunningPose.ts` bakes a runtime copy of Run: balanced hip/spine motion and the clean right-arm swing reflected half a stride later onto the left chain. Original GLB, joint lengths, walking/carrying and chore clips stay unchanged.
- Follow-up: visible palms have different alignment within their bind frames. Run now compensates using hand-weighted mesh directions and limits wrist flex to 12 degrees on both sides; tests verify visible left/right wrist flex matches half a stride apart, including the downward swing. Raw bone-axis mirroring alone was insufficient.
- Footer **✿ Squishy Pop** opens the arcade directly from the current scene. **Back to game** returns there. World updates and the daily clock pause during Pop. Active timed rounds, Tornado and unfinished actions must finish before using the shortcut; chores are never automatically completed. Existing store entry and reward receipts remain in use.
- Local DEV button moved up to avoid covering the shortcut on phones. `scripts/running-pose-test.mjs` checks asset/pose preservation, loop continuity, unit quaternions and bone lengths. Rig viewer inspections cover front/side/back phases; shortcut opening/return checked with an isolated save and phone layout. Check latest Git/Vercel status for deployment.

## Latest milestone — House Gameplay Polish + Lilah Tornado V1 (September 17, 2026)

The latest explicit user request resumed house work for this contained milestone, superseding older notes to pause house/pathing. Read HOUSE_POLISH_REPORT.md and the new animation asset manifest before changing it. STOP here; no Harper's house, review mode or world expansion is authorized.

- Optional **Lilah Tornado** house button: 55 seconds, physical NPC travel/drop animation, anticipation icons, five mess types, three unfinished messes maximum, ×1/×2/×3 timed streak, visible meter, positive stars and $1–$3 paid through existing allowance receipts. Day clock pauses; real daily tasks and old saved mess records remain untouched. New random daily mess creation is disabled outside the event.
- Rare interruptions: a dog surprise and a toy-basket dump. At most one per round; most rounds have none. Cleanup grants +10 bonus points. Temporary entities clean up on exit; the dog returns to its original placement.
- CMU washing/sweeping hand trajectories retargeted with IK to the existing Meshy Arianna skeleton. Floor wiping uses a crouch with planted-foot IK; vacuum handle motion follows the source capture. Existing pickup/putdown and all original GLBs stay intact. Manifest: public/assets/animations/chores/asset_manifest.json. CMU's license is permissive but is not CC0 and does not permit selling the motion data itself.
- EXPLORE/CHORE camera states: smooth focus/zoom/elevation transitions and return, with resize-safe base zoom. REVIEW/BOX_OPENING/TRADE are future presets only. Held chores now approach the prop before working and cancel cleanly on release.
- Existing Kenney CC0 audio reused for cleanup, streak, comic and reward cues. Bounded temporary geometry and audio voices. The original pug lacks a walk cycle; its brief travel uses translation and a gentle bounce rather than changing the character asset.
- F2 → Jump in → Lilah Tornado lab provides normal, quiet, dog and basket rounds. Developer pause freezes the event. Normal event entry needs empty hands and a morning/afternoon daily session.
- Tests: tornado-rules-test.mjs, tornado-browser-test.mjs, tornado-edge-browser-test.mjs, house-chore-browser-test.mjs. Several complete real-time rounds were played with actual joystick/tap input in isolated Edge profiles; normal/special rewards, zero-cleanup minimum reward, day-clock preservation, reload, three phone viewport sizes and chore return were exercised. See TESTING.md and ignored artifacts/house-polish.
- Marc authorized committing and publishing the complete current game on September 17. This release includes the preserved family/trading checkpoint, Squishy Pop and house polish. Target: Marcsarno/Dumpling, main → Vercel marcsarno/dumpling. Check Git/Vercel status for the current deployment; older milestone notes below describe their pre-release state. Never clear Marc's localhost save for testing.


Updated September 17, 2026. Read this before continuing in a new chat, then inspect the working tree. This document records decisions and current state; the user's next request determines the next milestone.

## Latest milestone: Squishy Pop readability and round polish

Marc authorized the next Pop milestone and specifically reported that pieces were too similar. Implemented locally; house/pathing remain paused. The existing high-quality reference-led raster art is preserved—no placeholder world models, recolored shortcuts or new art replacements.

- **Five visually distinct types per round.** `src/data/popIdentity.ts` describes each sprite's actual silhouette and dominant palette. `boardPool` excludes pairs sharing either, maximizes discovered friends, and fills with an expanded starter set. All 26 remain eligible; near-identical bunny/star/pudding/dumpling variants never share a board. Each startup selects a new compatible lineup. Tests cover 1,500 varied inventories and every individual discovery.
- Matching friends remain bright during a drag; nonmatching ones dim. A finger-offset count previews Bomb/Rainbow/Mega at 5/7/10 and updates on backtracking. Activation area previews and effects use the same pure target calculation as score/clear resolution.
- Distinct Bomb puff ring, Rainbow ribbons, Mega double wave; subtle Frenzy border and remaining-seconds label. Pop squash is staggered; only falling pieces bounce; settled cells accept input during other pieces' refill. Reduced motion disables shake, falls, squash, moving particles and CSS effects, and shows results immediately.
- First play now asks for an actual guided three-piece touch chain with no clock. Its points/pieces reset before the normal countdown. Existing learned saves skip it; Pop lab can replay it.
- At zero, finish the active gesture, let its animation settle, then resolve remaining specials in one bounded finale. Each cleared cell scores base points plus its ordinary copy bonus, once; no chain/Frenzy multiplier, no new power and no fake best-chain record. Rainbow in the finale includes its matching kind. Results then count up, compare previous best and animate tickets toward the reward line. Normal save receipts and ticket/coupon caps are unchanged; developer practice still cannot award.
- Updated regression harnesses for the interactive lesson. New scripts: `pop-milestone-test.mjs`, `pop-milestone-browser.mjs`, `pop-accessibility-browser.mjs`. Full natural touch minute scored 2,190/5 tickets in this run, p95 ~8.1ms desktop emulation; not a child pacing or real iPhone measurement. Phone result controls, previous dev controls, twelve replay cycles, reduced motion, mute, and rapid reopening verified; TypeScript and production build pass.
- Art/readability screenshots and reports: ignored `artifacts/pop-milestone/`. See `SQUISHY_POP_REPORT.md`. Buddy skills, stamp goals and wishlist rewards remain later work after Arianna tests the feel/readability. Nothing pushed or deployed; current work is still local/uncommitted.

## Previous milestone: Developer studio and Squishy Pop assessment

Marc requested a god/developer panel to skip chores, teleport to Pop, and speed up testing. He also said Pop feels undercooked and left competitor selection to our judgment. Implemented **Developer studio**, available through **DEV · F2**, backtick, or DEV inside dialogs in local Vite builds. See `DEVELOPER_MODE.md` for controls and save semantics.

- Four tabs: Jump in, World, Pop lab, Save & tools. Direct Pop launch; all three stores; home/collection/recess; complete current cleaning without allowance; skip to completed afternoon; day presets/next day/clock freeze; resources/duplicates/sealed boxes/restock; recovery; diagnostics.
- Main update and Pop timer pause while the panel is open. Timed cleaning deadlines are shifted so browsing tools does not consume the round. Existing Pop pause is retained on return.
- Automatic checkpoint of the three game save keys before the first change; explicit capture/restore/download/fresh-save controls. Replacing a checkpoint, restoring, or clearing progress asks inside the panel. Checkpoint survives reload and fresh-save reset. Tests never clear Marc's live localhost save.
- Pop lab changes mark the round as practice, visibly in the footer/results. No ticket or best-score awards; practice replay remains practice. New normal round resets practice/freeze. Deterministic chains, special injection, Frenzy, timer presets and deadlock recovery use existing rules.
- Panel and CSS are dynamically imported only for DEV; production build verified to exclude them. Local changes remain uncommitted/unpublished alongside Pop V1.
- `SQUISHY_POP_NEXT_MILESTONE.md` contains the researched assessment and proposed priorities. **Those gameplay improvements have not been implemented in this milestone.** Prioritize chain-count/power previews, distinct power effects and better final/results payoff; then guided play, buddy choice and persistent goals. Keep supplied reference art and the drag-chain mechanic. Official Tsum Tsum manual and LINE POP 2 launch design inform the comparison; no hands-on competitor playtest is claimed.
- Verification: developer checkpoint/rollback tests, real browser controls and a normal 60-second reward round after practice; supplemental timed-cleaning/day/collection/layout tests; existing save/hunt/trading/Pop rules and TypeScript/build checks. See `TESTING.md` and ignored `artifacts/developer/` reports.

## Previous milestone: Squishy Pop V1

**House/layout/pathing work is explicitly paused.** The user redirected work to `SQUISHY_POP_SPEC.md`, then clarified that the in-game squishy models are unfinished placeholders and must NOT be used in the minigame. That clarification supersedes the spec's earlier preference for renders of existing models.

- Before changes, checkpoint **`d0accf1` — Checkpoint current game before Squishy Pop V1** committed the existing game, including hunt/trading/family work. Squishy Pop changes are currently local and uncommitted; nothing was pushed or deployed.
- Every existing store has an optional **PLAY SQUISHY POP** button. A modal canvas takes over, preserving the loaded scene, player position, inventory and all other game state. The daily clock and movement pause; 3D rendering pauses until return.
- 60 seconds, 6×6 tray, six eligible types, eight-way drag matching, minimum three, no repeated cells, backtrack to undo, pop/gravity/refill, bounded automatic deadlock recovery. Current gesture finishes at zero. Tutorial, countdown, pause/mute, results, saved tickets and replay are integrated.
- Bomb: 5–6 chain → radius-one square; Rainbow: 7–9 → wildcard within a matching chain; Mega: 10+ → radius-two square. Tap Bomb/Mega or include them in a matching chain. Powers cascade once each. Strong quick chains trigger seven seconds of ×2 Frenzy.
- Discovered saved IDs feed the pool, supplemented with starter friends. Copies 1/2/5 give 1/2/3 stars; the last two tiers add 2%/4% piece score. This does not consume duplicates. World models and collection counts are unchanged.
- New reference-led art covers all 26 IDs; no placeholder model renders are shipped or used. Final atlases: `public/assets/pop/garden-atlas.png`, `treats-cutout.png`, `animals-cutout.png`, `cosmic-cutout.png`, `power-atlas.png`. Built-in imagegen prompts and provenance are recorded alongside them. Reference styles come from the user's seven supplied images.
- Round tickets: 1 + floor(score/500), capped at 8. Forty tickets automatically discount one purchased box by $1, at most once per game day. No direct allowance/box awards. Coupon price is shown before purchase. Optional `pop` save field, idempotent round IDs, atomic purchase/discount updates and failed-save retry preserve existing version-one saves.
- CC0 Kenney effects, CC0 TinyWorlds music, plus original Web Audio musical layers. See manifest/credits. Audio is unlocked by player interaction, stops on pause/exit and offers mute.
- Architecture: pure rules in `src/data/squishyPop.ts`; overlay/touch/timing in `src/ui/SquishyPopUI.ts`; cached atlas sprites in `PopArt.ts`; bounded Web Audio in `PopAudio.ts`; existing GameLoop/ProgressStore integration.
- Verification: 15,000 generated/refilled boards; all power rules and coupon/save boundaries; two full unaccelerated 60-second touch rounds; separate touch fixtures for all three powers/Frenzy; 12 replay cycles; 320×568, 390×844, 430×932 layouts. Reports/screenshots in ignored `artifacts/squishy-pop/`. Measured desktop-emulated frame p95 ~7ms; this is not a physical iPhone result. Real iPhone/Safari, subjective sound mix and seven-year-old enjoyment still need user testing.
- See `SQUISHY_POP_REPORT.md` and TESTING.md. Stop at this milestone; do not start V2 or resume house/pathing without user direction.

## Where we are

**Squishy Hunt V1, Trading V1, and the requested family-house expansion are implemented locally.** On September 16 the user explicitly asked to add Marc, enlarge the house and give Marc and Lilah their own rooms. This supersedes the earlier preference to defer more house work for this specific milestone. The later collecting roadmap remains future work. Neither the new store designs nor trading balance have been user-approved. Tests do not establish subjective fun.

- Workspace: `C:\Users\marc7\Codex Game Projects\Dumpling Game File`
- Local game: http://localhost:5173/
- GitHub: https://github.com/Marcsarno/Dumpling
- Production: https://dumpling-sandy.vercel.app/
- Local branch: `master`, tracking `origin/main`.
- Historical pre-Pop checkpoint: `d0accf1` — `Checkpoint current game before Squishy Pop V1`. Use `git log -1` for the current release commit.
- **The September 17 release contains Squishy Hunt V1, Trading V1, family expansion, Squishy Pop, developer tools (local builds only), and House Polish + Lilah Tornado V1.** Preserve current files. Production is https://dumpling-sandy.vercel.app/; verify the latest commit status before assuming a deployment finished.
- The handoff itself does not authorize publishing. When publishing is requested, use **MarcSarno / Marcsarno**, never the HornerXpress account. Confirm the target repository and Vercel team before publishing.
- Vercel project `dumpling`, team `marcsarno`; Git-connected production branch `main`. `vercel.json` uses Vite, `pnpm run build`, output `dist`.

## Marc's game vision

A warm, funny, mobile-first 3D game about **squishy hunting and collecting**. Arianna is seven; always spell her name **Arianna**. The home/Sims-like routine gives purpose and allowance to the collectible hunt.

Core loop: short home activities → allowance → choose a store with incomplete information → spend limited afternoon time traveling and physically hunting → choose a blind-box series → buy a sealed surprise → return home → reveal rarity → grow the collection → sleep → fresh stock tomorrow.

Trading duplicates is now implemented as a small recess table. Marc also raised school, bullies and social situations as future ideas. **A full school or social system is not an approved detailed design or current implementation assignment.** Do not invent remembered school/bullying mechanics.

Trading V1 excludes a full school, complex driving, a giant town/open world and further stores. The later family request specifically authorizes the house expansion described below. The user's collecting roadmap is collection goals + a three-item wishlist, a three-favorite bedroom shelf, special daily events, and only then travel/driving. Discuss the next milestone before starting those.

## Established preferences to preserve

- PlayCanvas Engine + TypeScript + Vite; fully 3D, low/mid-low-poly, soft pastels, warm readable lighting, portrait iPhone-sized layout.
- Keep the working camera, joystick, single context-sensitive Action button, movement and existing gameplay unless a requested change requires an adjustment.
- The house should be vertically arranged and closely framed for a phone, with varied room connections rather than one long central hallway.
- Visible outdoor areas should feel situated: grass, trees, paving/driveway and appropriate fences rather than an empty backdrop.
- Use good **free online 3D assets aggressively** for generic furniture, stores and environments. Prefer CC0/public-domain/clear commercial-use licenses. Verify licensing and record source URL, asset names and modifications. Do not unnecessarily recreate usable generic assets.
- Keep the actual supplied character GLBs, their appearances, materials, rigs and clips. Character creation is handled in a separate workflow.
- Arianna must face the direction she actually moves. Avoid sliding and overly fast leg swings. Default to running with small items; use slower carry walking with bulky tools.
- Use restrained fabric/wood/rug detail. Avoid excessive labels: room names and permanent overhead character names were removed.
- Favor nearby glows and helpful destination cues. With a vacuum, highlight remaining dirt first; only highlight storage once there is no relevant mess left. The same priority applies to multi-step tools.
- Lilah is a funny, mischievous two-year-old who wanders/follows and contributes believable little messes. Preserve her personality and the ability to play with her.
- Keep work modular and test the actual complete loop with phone controls before declaring a milestone done. Stop at the requested scope.

## Existing house and character systems

### Marc and family rooms — September 16 follow-up

Latest layout revision: the nursery north wall now aligns exactly with the bathroom
at z=-3.6. The nursery/Dad divider is at z=3.6, aligned with the landing/living
boundary; Dad's south wall aligns with the utility room at z=13.2. Both rooms are
4.5 units wide. Nursery furniture and Lilah's bedtime destination moved north.
Dad's larger room separates bed/bedside tables at the north end, painted blue-gray
storage on the west wall, an upholstered terracotta reading chair with a glass/metal
table to the east, and an ivory desk/laptop with pull-out chair space at the south.
Slate woven carpet replaces plank flooring in his room. Painted finishes explicitly
omit wood grain; other rooms keep their existing materials. A third family lamp
lights the reading corner (13 total interior lights). See
`scripts/family-layout-browser-test.mjs` and `artifacts/family-layout/` for alignment,
furniture approach, portrait/wide layout and bedtime route checks. Trees stay clear
of the moved nursery window. Lilah now reaches exact waypoints before turning,
avoiding shortcuts through furniture corners.

- Marc uses the supplied `experiments/meshy/marc/revisions/animation_v2/marc.glb`, copied intact to `public/assets/characters/marc/`. Ten embedded clips include real SitDown, SitIdle and StandUp. Do not restore the rejected Run_Alternative animation. Integration notes and source motion license ship alongside the model.
- Height is dynamically **1.3 × Arianna = 1.798485**. He patrols the house, sits in the living-room reading chair, gets up for Lilah's messes, and uses occasional dad jokes / “sweetie” remarks. `src/game/Marc.ts` owns this behavior.
- Dad waits eight active seconds before taking an unattended Lilah mess and yields to nearby Arianna or her active interaction. He handles toys, juice and crumbs, persists `cleanedBy: 'marc'`, and never awards Arianna allowance or completes her base chores. Arianna can still clean them herself for the existing reward.
- Original walking and seated clips are retained. Cleanup is a modest **runtime torso bend plus a floor tool effect**, not an authored cleanup animation. Sitting is specifically aligned to the existing reading chair, not generalized to every chair or the couch.
- Two rooms extend the east side: **Lilah's nursery** from the landing, **Marc's bedroom** from the living room, and a connecting doorway between them. Arianna's original bedroom is unchanged; no crib was added there.
- Nursery: credited Poly by Google crib, painted changing dresser/pad and bookcase, bears, toy basket, chair and lamp. Marc's room uses the revised mixed-material arrangement above. Shared rooms gain a microwave cabinet and sofa cushion. Exterior planting/fence moves outside the enlarged footprint. Family lamps follow the existing night system.
- Lilah goes to her nursery at night; this is a sleepy standing/walking behavior, not a new crib interaction or sleep animation.
- Family phone tests: `scripts/family-browser-test.mjs` and `scripts/family-boundaries-browser-test.mjs`; screenshots/reports under `artifacts/family*`. See TESTING.md for completed verification and limits.
- Shared `HousePath` connects the real starting position to a reachable grid cell; Marc reaches waypoints before turning to avoid cutting furniture corners. Original GLBs and existing save keys remain intact.

The furnished house, pet cleanup, original timed cleanup modes, untimed exploration, daily routine, allowance, collection, clock and day/night lighting remain present.

Daily life:

- Morning: brush teeth, choose/get dressed, make breakfast; the egg can spill and require paper cleanup.
- School: a small optional recess trading courtyard; Finish school returns at 3 PM, not a full school environment.
- Afternoon: three vacuum spots, wipe a spill, put laundry in the washer. Each completed activity earns allowance.
- Night: brush teeth, put clothes away, read and sleep. Sleep starts a new day.
- Clock rate: two real seconds per game minute. Afternoon runs 3–7 PM. Warm interior fixture lighting comes on at night while the exterior stays dark.
- Existing puppy challenge: get the scooper/shovel, scoop poop, take it to the toilet, flush, then wash hands.

Characters:

- Active Arianna: `public/assets/characters/arianna/arianna.glb`, the user's **Meshy carry_v1 revision**, not the older three-clip `game_ready` model. Runtime configuration is `character.json` in that folder.
- Arianna height: **1.38345**, incorporating the requested 15% enlargement. Full-stick run speed **3.15**; bulky-tool walk speed **1.65**. Gait playback follows actual movement up to 1x. Facing follows actual velocity, including collision response.
- Supplied clips: `Casual_Walk`, `Walking`, `Running`, `Idle`, `CarryWalk`, `CarryRun`. Pickup, put-down, celebration and stationary carrying still have runtime pose/adaptation work because the new model did not supply all those clips. Do not misrepresent those as authored clips.
- `CharacterAnimator`, `MeshyGameplayAdapter`, `CharacterGrounding` and `CarrySystem` separate presentation from gameplay.
- Lilah: `public/assets/characters/lilah/`, supplied Meshy review model. Height **0.86465625**, or **0.625 × Arianna**: originally half height, then enlarged by 25% at Marc's request.
- Lilah explores/follows and creates toys, juice or crumbs. Up to three incidents per day, at most two outstanding. Playing together postpones mischief; no new nighttime messes. Her README documents the original model and clips.

## Squishy Hunt V1 — current implementation

After the five base afternoon chores are done and hands are free, use Action at the front door. Lilah's additional messes do not indefinitely gate shopping.

| Store | Round-trip time | Prices | Normal stock | Character |
| --- | --- | --- | --- | --- |
| Clover Corner | 55 game minutes | $4–5 | 3–5 boxes | Nearby, inexpensive, smaller assortment |
| Peachy Playroom | 90 game minutes | $5–8 | 5–8 boxes | Larger, balanced toy-store selection |
| Moonbeam Finds | 165 game minutes | $7–9 | 2–4 boxes | Specialty series and better unusual/rare odds |

- Travel is charged up front **including the ride home**. Admission must leave at least 18 game minutes to search. The clock continues during shopping. Nearby + medium can fit; all three cannot fit in a normal afternoon. Efficient chores leave more time.
- The chooser gives rumors and price ranges, not exact inventory. Assortment, quantity, locations and rumors refresh each day and persist across reloads. Sometimes only one box is available.
- Every shop has six possible sites: main shelf, endcap, checkout display, basket, lower shelf and special display. Walk around; nearby boxes get an aura/sparkle.
- Action first inspects a box (~650 ms), revealing its series, price and owned count. A second deliberate Action buys it. Walking away is allowed.
- Three purchases per trip. At 7 PM, return home automatically with paid boxes intact. Returning manually uses the welcome mat.
- Four series, **26 collectibles**: Garden Friends (8), Sweet Treats (6), Pocket Pals (6), Galaxy Dreams (6). Common/Rare/Epic/Legendary tiers. Store-specific odds and all pricing/stock rules are configurable.
- The existing home opening animation, sealed outcomes, duplicate counting and collection are reused. Collection now groups items by series.
- Shop interiors use imported Kenney CC0 market/furniture/building assets, with nature assets outside. See `ASSET_SOURCES.md`, `public/asset-credits.html` and `public/assets/environment/kenney/sources.json`.
- Building Kit GLBs require their included `Textures/colormap.png`. `HouseArt` material caching now includes the pack in its key because Building Kit and Mini Market have different atlases both named `colormap`.

## Code map

| Area | Main files |
| --- | --- |
| Scene wiring, update loop, read-only development diagnostics | `src/main.ts` |
| House, imported art, textures and lighting | `src/game/house.ts`, `HouseArt.ts`, `HouseLighting.ts`, `SurfaceTextures.ts` |
| Character movement and presentation | `src/components/PlayerController.ts`, `CharacterAnimator.ts`, `MeshyGameplayAdapter.ts`, `MovementPace.ts`, `CharacterGrounding.ts`, `CarrySystem.ts` |
| Home tasks, daily routine, Lilah | `src/game/CleanupGame.ts`, `DailyLife.ts`, `Lilah.ts`, `LilahMesses.ts`, `src/systems/DailyClock.ts` |
| Shopping rules, series and collectible definitions | `src/data/hunt.ts`, `src/data/collection.ts` |
| Stores and transitions | `src/game/store.ts`, `src/game/GameLoop.ts` |
| Store chooser and find cards | `src/ui/HuntUI.ts`, `src/ui/hunt.css` |
| Economy, stock, receipts, collection persistence | `src/systems/ProgressStore.ts` |
| Existing opening/reveal visuals | `src/game/OpeningSequence.ts`, `dumplingVisual.ts` |
| Trading rules, scene and controls | `src/data/trading.ts`, `src/game/recess.ts`, `src/ui/TradingUI.ts`, `src/ui/trading.css` |
| Multi-step interaction guidance | `src/systems/InteractionGuidance.ts`, `InteractionSystem.ts`, `src/ui/CleanupFeedback.ts` |

Saves are local to the browser origin: `arianna.progress.v1`, `arianna.daily.v1`, `arianna.lilah.v1`. **Do not clear Marc's real save for testing.** `localhost` and `127.0.0.1` have separate browser storage.

## Trading V1 — current implementation

- Enter through the normal school door, or **Collection → Visit recess trading table**. The shortcut uses the real collection but does not advance the day or skip chores. The daily clock pauses in recess. Walk to one of three classmates and use the existing Action control.
- Jules (Rarity Hunter), Remy (Series Collector), and Poppy (Cute Collector) have distinct value functions. Remy's target series rotates daily; Poppy values bows and specific pink/purple designs. Numeric scores are not shown to the player; each classmate explains their preferences and whether they agree.
- 1–3 items on each side. The NPC begins with 1–3, the player chooses from owned squishies. Large X / + / ✓ controls walk away, negotiate and execute. Plus may add, refuse or swap; it scrolls to the revised offer so the player can review it.
- Duplicates sort first; one copy stays by default. Explicitly including last copies enables those selections and requires another confirmation before a last copy is traded. Collection favorite and lock toggles protect every copy of an item.
- Each NPC has six daily pocket items, four negotiation requests and one completed trade per day. Stable daily offers, request counts and completion survive reloads; X changes no collection counts. New days refresh traders.
- `ProgressStore` re-reads ownership, protections, day and offer revision at commit. Item removal, received items and completed trade are one storage write. Repeated acceptance, stale revisions and failed writes cannot grant extra items. Like the existing economy, localStorage is not a server-authoritative cross-tab database.
- Optional `trading` and `protections` fields extend version-one saves. No existing save keys were renamed or cleared. Pending sealed boxes and wallet are untouched by trades.
- Existing Kenney CC0 tables, chairs, bench and trees furnish the courtyard. Three schoolmates use simple placeholder geometry; no new character GLBs or changes to supplied Arianna/Lilah assets.
- Scripts: `scripts/trading-test.mjs` and `scripts/trading-browser-test.mjs`. Browser test uses an explicitly seeded prior collection and sealed duplicate in an isolated Edge profile; screenshots/reports live in `artifacts/trading/`. Real user's data is untouched. Physical iPhone/Safari and subjective balance remain to be assessed.

`ProgressStore` re-reads and writes one draft per economy transaction. Stock depletion, balance and the sealed collectible are saved together. A pending reveal is a persisted receipt, preventing repeated awards or rerolls after refresh. Existing version-one saves are preserved; hunt state is an optional extension. A saved travel clock floor prevents refresh from reclaiming travel time.

## Verification and how to run

Read `TESTING.md` for the detailed current report. The completed Squishy Hunt checks include:

- Full touch-driven morning → school → afternoon chores → chooser → nearby hunt/purchases → reload → home reveal/collection → second store → night routine → sleep → refreshed day.
- Specialty-store travel, six reachable sites in all three layouts, low/sold-out stock, and safe closing-time return with purchases retained.
- Small/large portrait screens: **320×568, 390×844, 430×932**. Actual imported assets and box placement were inspected in screenshots.
- Paced specialty search measured about **28 seconds**. An automated direct route through the smaller store took about 14 seconds. Human discovery/decision time varies; subjective fun still needs Marc's feedback.
- Type checking, production build, clock/progress/hunt unit tests passed. Completed browser runs had no runtime or asset-load errors.
- **Physical iPhone/Safari has not been tested.** Tests used Edge with mobile emulation and real simulated touch events in an isolated profile. Some fixtures use previously saved allowance. The full routine test jumps the saved clock to evening between segments, then plays the real night activities and sleep.

PowerShell, from the workspace:

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --experimental-transform-types --test scripts/progress-test.mjs scripts/hunt-test.mjs scripts/daily-clock-test.mjs
node --experimental-transform-types scripts/hunt-browser-test.mjs
node --experimental-transform-types scripts/hunt-boundaries-browser-test.mjs
node --experimental-transform-types scripts/hunt-layout-browser-test.mjs
```

The first command runs the server; run tests in another terminal. Standard package scripts also work when pnpm/npm is available. Node 24 was used. Browser scripts accept `PLAYWRIGHT_MODULE`; their default points to this workstation's bundled Playwright and uses installed Edge. Screenshots/reports are under `artifacts/squishy-hunt/`, intentionally ignored by Git. Older single-shelf store browser tests document earlier checkpoints and are superseded by the hunt tests.

On this Windows setup, extracting a new asset while Vite was watching once caused an `EBUSY` watcher exit. Finish extraction and restart the local server if it stops. Do not assume an old server session is still alive.

## Publishing notes for a later authorized release

- Recheck `git status`, remote, branch and account. The current local feature work is not in HEAD yet.
- Local `master` tracks remote `main`; use the intended remote branch explicitly when needed. Do not push to an unrelated account/repository.
- Previous GitHub authentication was completed for **Marcsarno**. A local GitHub CLI exists at `artifacts/deploy-tools/gh/bin/gh.exe` (ignored). Check current authentication instead of assuming it still works; never print tokens.
- Elevated Git commands previously needed a per-command ownership override: `git -c safe.directory='C:/Users/marc7/Codex Game Projects/Dumpling Game File' ...`. Avoid changing global safety settings unnecessarily.
- Existing repository identity may be unset; the previous checkpoint used `Codex <codex@local>` per command. Inspect rather than silently assigning Marc an invented email.
- Vercel is connected to GitHub `main`; verify the resulting deployment and character/environment assets after an authorized push.

## What the next chat should do first

Read this file, `README.md`, `TESTING.md` and `ASSET_SOURCES.md`; inspect the current working tree and the relevant implementation. Preserve the completed local milestone. Ask for or follow Marc's next concrete change, rather than beginning an assumed roadmap. If Marc reports a Squishy Hunt issue, reproduce and fix it before adding another system.

Trading V1 and the Marc/family-room expansion were subsequently requested on September 16 and checkpointed before Squishy Pop at the user's request. No push or deployment has been requested.
