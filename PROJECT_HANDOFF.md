# Dumpling / Arianna game — project handoff

Updated September 16, 2026. Read this before continuing in a new chat, then inspect the working tree. This document records decisions and current state; the user's next request determines the next milestone.

## Where we are

**Squishy Hunt V1, Trading V1, and the requested family-house expansion are implemented locally.** On September 16 the user explicitly asked to add Marc, enlarge the house and give Marc and Lilah their own rooms. This supersedes the earlier preference to defer more house work for this specific milestone. The later collecting roadmap remains future work. Neither the new store designs nor trading balance have been user-approved. Tests do not establish subjective fun.

- Workspace: `C:\Users\marc7\Codex Game Projects\Dumpling Game File`
- Local game: http://localhost:5173/
- GitHub: https://github.com/Marcsarno/Dumpling
- Production: https://dumpling-sandy.vercel.app/
- Local branch: `master`, tracking `origin/main`.
- Verified local HEAD: `4619e79` — `Checkpoint furnished cottage with Arianna, Lilah and daily life`.
- **Squishy Hunt V1, Trading V1 and family expansion changes are still uncommitted and have not been deployed. Preserve the modified and untracked files.** The prior cottage checkpoint was published; production should not be assumed to contain these changes.
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

Trading V1 and the Marc/family-room expansion were subsequently requested on September 16. No commit, push or deployment has been requested for these local changes.
