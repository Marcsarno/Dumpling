# Arianna · A little room

A mobile-first, fully 3D cleanup and collecting prototype built with **PlayCanvas,
TypeScript, and Vite**. Stage 4 expands the approved bedroom into one connected
house, keeping the Stage 3 shopping, blind-box reveal and collection loop. The
bedroom furniture, visual palette, joystick, movement speed and cleanup rules are
retained. The camera now follows smoothly at the original angle and player scale.
All 3D art is deliberately simple engine primitives.

## Play it

On this Windows computer, dependencies are already installed. Double-click
**`Start Game.cmd`**, then open the Local URL it prints (normally
**http://localhost:5173**). Keep the terminal open while playing. Ctrl+C stops it.
The launcher uses your installed Node, or the existing Codex-bundled Node runtime.

If the development server is already running, just open its URL; you do not need
to start a second copy.

**Controls:** drag the bottom-left joystick in the direction you want Arianna to
move on screen. Release to stop. A short drag walks slowly; a full drag walks
faster. Desktop supports mouse dragging, WASD, and arrow keys. Furniture and room
edges block movement. The bottom-right **Action** button lights up near an item:
tap it to pick up, put away, or tidy. Desktop also supports **Space / E**. Carry
one item at a time and follow the glowing destination. For the vacuum, hold Action
for **1.15 seconds** beside the dirt. Both thumbs can be used at once.

Choose **House · 6**, **Bedroom · 5**, or **Explore** before moving. The game starts
in Arianna's bedroom with the six-task house mission selected. Explore makes all
15 implemented interactions available without a timer or allowance; it can be
switched back to a timed mission at any time. Selecting a mode resets the props
and returns Arianna to her bedroom. Timed missions cannot be switched mid-round.

The **60-second timer starts with your first move or interaction**. Each task
earns **$1**. Finishing the task list adds **$2** and ends early: the bedroom mission
pays up to **$7**, and the house mission pays up to **$8**.
When time runs out, keep what you earned; there is no failure penalty. The results
card lists completed tasks and allowance, credits your saved wallet, and offers
**Go Shopping** or **Play again**.

The original bedroom mission still contains:

| Task | What to do |
| --- | --- |
| Teddy | Pick up the teddy and put it on the toy chest |
| Shirt | Put the shirt in the new laundry hamper |
| Book | Return the book to the existing bookshelf |
| Crayons | Walk to the desk and tap Action; tidying takes 0.45 seconds |
| Dirt | Pick up the vacuum, approach the dirt, and hold Action |

The vacuum returns to its starting spot after cleaning and frees Arianna's hands.
Releasing a vacuum hold or leaving range cancels the unfinished work. Replay
restores every prop, the player position, empty hands, and a fresh timer. The
timer uses elapsed real time, including time in another tab; inputs reset on
focus loss. The round's earnings are added to your persistent wallet when it ends.

## Connected house

The main walking loop is **Bedroom → Hall → Living room → Kitchen → Laundry room
→ Bathroom → Hall → Bedroom**. A second doorway directly connects the living room
and laundry room. All rooms remain in one resident PlayCanvas world; walking
through a door never loads a scene, fades the screen, or teleports the player.

```text
               Bathroom ───── Laundry
                   │           │   │
Bedroom ──────── Hall ─────── Living ── Kitchen
```

| Space | Approximate floor size in game units | Working interactions |
| --- | --- | --- |
| Bedroom | 6.6 × 7.2, existing furniture retained | Original five chores |
| Hall | 2 × 7.9, with storage at both ends | Shoes → shoe bench; mail → mail tray |
| Living room | 6 × 5.6 | Toy → toy basket; cushion → sofa |
| Kitchen | 5 × 5.6 | Dish → sink; trash → bin |
| Laundry room | 4.5 × 3.4 | Dirty clothes → washer; clean clothes → folding counter |
| Bathroom | 4 × 3.4 | Towel → towel rack; toiletries → vanity |

The hall's bedroom, living and bathroom door centers are only 3.5 units apart from
end to end; its remaining space holds the two working storage interactions.
Door gaps are 1.6–1.8 units wide, compared with the player's 0.48-unit collision
diameter. Low jambs and thresholds mark the openings. Low cutaway walls still block
movement. Only the existing bedroom backdrop and the house's northern exterior
retain full-height walls; there are no foreground walls hiding whole rooms.

The **House · 6** mission selects the bedroom book, living-room toy, kitchen dish,
kitchen trash, dirty laundry and bathroom towel. Other interactions are available
in Explore. All pickup/place tasks reuse the existing single Action button, carry
socket, target filtering, destination highlights and rewards. Trash and laundry
disappear into their containers; the placed towel hangs vertically from its rail.

`src/data/house.ts` defines room rectangles, seven doorways and mission task lists.
`src/game/house.ts` creates the connected floors, walls, furniture and collision
footprints using the bedroom's material instances. `src/game/houseProps.ts` defines
the new carryable/drop-zone pairs. No new interaction minigame or physics engine
was added. Future chores can be added as task data and additional interaction pairs.

The camera follows the player's horizontal displacement using exponential smoothing
(`1 - exp(-6 × dt)`). Its rotation and responsive orthographic scale stay unchanged
while walking; room boundaries do not trigger camera cuts or zoom changes. Only
replay, store transitions and the existing home reveal reset its position. Movement
still uses the same flattened camera-right/forward axes. Collision tests use the
union of connected floor rectangles, so crossing a floor seam never creates an
invisible barrier or permits walking off the house's irregular footprint.

See **[ASSET_MANIFEST.md](ASSET_MANIFEST.md)** for provenance. Stage 4 adds only
original procedural assets, uses the bedroom's shared palette, and introduces no
new texture/model downloads. The PlayCanvas MIT notice is included in
`public/PLAYCANVAS-LICENSE.txt` and in the production output.

## Store → surprise → collection

Go Shopping enters **Little Surprises**. Walk close to the central box display
and tap the same Action button to buy a **$4 sealed box**. You may buy **three per
trip**, subject to your wallet balance. The welcome mat is the **Go Home** interaction.
You can leave even when you cannot afford a box.

At home, tap **Open box**. The box shakes, its lid lifts, and after a brief pause
your dumpling appears with a temporary chime and rarity effect. The sequence takes
**2.6 seconds**. Only this presentation temporarily zooms the camera; returning to
cleanup restores the original framing. Tap **Collection** to see eight prototype
friends, locked silhouettes, names, rarities and duplicate counts. **Open next box**
handles additional purchases. **Back to cleanup** starts another fresh mission.
The footer's Collection button is also available between missions; unopened boxes
remain reachable there if you choose to clean again first.

The prototype saves to `localStorage` under **`arianna.progress.v1`**. It stores
wallet balance, collection counts, sealed boxes, shopping-trip count and the most
recent reveal receipt. Box contents are selected and saved when bought. A reveal
commits the collection entry before its animation, so a refresh cannot lose that
box or award it again. Completed mission IDs prevent duplicate wallet credits.
Save failures preserve the previous state and show a retry message. Saves belong
to this browser and origin (including port); clearing site data removes them.
There is no account or cloud sync. Concurrent tabs are not an atomic shared wallet.

**On an iPhone:** connect to the same Wi-Fi as this computer. Open the Network URL
printed by Vite in Safari, hold the phone upright, and drag the joystick. The
current machine's address during development was `http://10.0.0.128:5173`; use the
newly printed address if it changes. Windows Firewall may need to allow Node on
your private network. There is no account or install step on the phone.

## Standard development commands

Use Node.js 22.12+ (or a supported newer version). From this project directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

`pnpm-lock.yaml` pins dependencies. The equivalent commands with npm are
`npm install`, `npm run dev`, `npm run build`, and `npm run preview`; npm will create
its own lockfile. Use one package manager consistently. `build` runs TypeScript
checking before producing the static `dist/` directory. `preview` serves that
production build at http://localhost:4173.

To run or build using the already-installed dependencies without a package manager:

```sh
node node_modules/vite/bin/vite.js --host 0.0.0.0
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

## Where things live

| File | Responsibility |
| --- | --- |
| `src/main.ts` | PlayCanvas application, sunlight, viewport resize, update loop, lifecycle cleanup |
| `src/game/bedroom.ts` | Modular primitive bedroom, static batching, furniture footprints |
| `src/game/primitives.ts` | Shared material and engine-entity construction helpers |
| `src/game/IsometricCamera.ts` | Smoothed position following, fixed angle and responsive framing |
| `src/data/house.ts` | House floor rectangles, doorways and mission task definitions |
| `src/game/house.ts` / `houseProps.ts` | Continuous house geometry, shared materials and new carryable/drop-zone pairs |
| `src/ui/HouseNavigation.ts` | Current-room headings and projected doorway labels |
| `src/components/PlayerController.ts` | Camera-relative movement, keyboard input, room/furniture blocking |
| `src/components/CharacterVisual.ts` | Capsule visual and optional GLB loading, scale and alignment |
| `src/components/CharacterAnimator.ts` | Visual facing, placeholder action poses and optional GLB animation crossfades |
| `src/components/CarrySystem.ts` | One carried item on a visual socket independent of the character rig |
| `src/game/cleanupProps.ts` | Five tasks, vacuum, hamper, destination anchors, placeholder props and reset |
| `src/game/CleanupGame.ts` | Pickup/place/use rules, cleanup durations, cancellation, rewards and replay |
| `src/systems/InteractionSystem.ts` | Valid-target filtering, nearest focus and forgiving proximity ranges |
| `src/systems/MissionSystem.ts` | Configurable task lists, real-time deadline, practice mode, rewards and results |
| `src/data/collection.ts` | All eight dumpling definitions, rarity weights/colors/effects, box price and trip limit |
| `src/systems/ProgressStore.ts` | Versioned save repository, wallet transactions, sealed receipts and duplicate counts |
| `src/game/GameLoop.ts` | Cleanup rewards, scene transitions, store proximity/Action and collection UI |
| `src/game/store.ts` | Small primitive store and collision footprints |
| `src/game/OpeningSequence.ts` | Presentation-only shake, lid, reveal, rarity effects and temporary sound hook |
| `src/game/dumplingVisual.ts` | Replaceable box/dumpling geometry factories and local SVG collection portraits |
| `src/ui/ActionButton.ts` | Captured touch/keyboard taps and holds, including two-thumb cancellation |
| `src/ui/CleanupHUD.ts` / `CleanupFeedback.ts` | Task checks, context labels, results, destination rings and coin bursts |
| `src/ui/cleanup.css` | Stage 2 overlays, separate from the approved layout styles |
| `src/ui/VirtualJoystick.ts` | Analog joystick, pointer capture, cancellation and focus handling |
| `src/ui/styles.css` / `index.html` | Full-screen canvas, safe-area-aware touch controls and minimal room labels |
| `public/assets/characters/arianna/character.json` | Enables the incoming Arianna model |
| `scripts/browser-test.mjs` | Automated real-browser movement, touch, resize and GLB tests |
| `scripts/cleanup-browser-test.mjs` | Full touch-driven cleanup rounds, real 60-second expiry and replay |
| `scripts/mission-test.mjs` | Deadline, duplicate reward, bonus and reset checks using Node's test runner |
| `scripts/collection-browser-test.mjs` | Two complete real-touch loops, purchases, opening, persistence and portrait layout |
| `scripts/collection-edge-test.mjs` | Saved-state fixtures for all four rarity effects, trip cap and retained boxes |
| `scripts/progress-test.mjs` | Exact rarity intervals, economy boundaries, duplicates, refresh and save failures |
| `scripts/house-browser-test.mjs` | Touch-driven tour, every new interaction, every doorway and full six-task mission |
| `scripts/house-edge-test.mjs` | Walls, furniture, small screens and real whole-house timeout while carrying |
| `scripts/house-performance.mjs` | Same-viewport draw-call comparison against an archived Stage 3 server |

`public/assets/rooms`, `props`, and `dumplings` reserve asset locations.

Change **`src/data/collection.ts`** to tune the prototype: `STORE_INVENTORY` holds
the $4 price and three-box trip limit; `RARITIES` holds the 60/25/12/3 weights and
presentation cues; `DUMPLINGS` holds IDs, names, tiers, colors, faces and accessories.
Selection first rolls a rarity, then uniformly selects a dumpling within that tier.
Keep saved IDs stable when substituting final artwork. `SaveRepository` can be
replaced for a future account backend; a remote asynchronous implementation would
also need pending-state UI and server-authoritative transactions.

## Dropping in arianna.glb

1. Put the file in `public/assets/characters/arianna/arianna.glb`.
2. Set `url` to `"arianna.glb"` in the neighboring `character.json`.
3. Reload. The engine loads the GLB, scales it to 1.2 world units tall, centers it,
   and puts its feet at the player root. Set `yaw` to 180 if it faces backward.

Use exact `Idle` and `Walk` clip names, in-place animation, and embedded textures.
See `public/assets/characters/arianna/README.md` for the asset contract. Missing or
invalid models keep the capsule playable. Missing animation clips keep the loaded
model usable, with whichever supported animation is present. The controller never
depends on the rig. Optional `CarryIdle`, `CarryWalk`, `PickUp`, `PutDown`, and
`Celebrate` clips are now supported, with Idle/Walk fallbacks. The held prop's
socket is a sibling of the mesh, so loading a different rig leaves carrying intact.

## Deliberate implementation choices

- The engine's Entity/Render/Camera/Light/Anim components and asset registry do the
  engine work. Small TypeScript classes coordinate them; no second ECS or UI
  framework is added.
- Pointer Events unify touch, pen and mouse on the DOM joystick and provide
  pointer capture. PlayCanvas Keyboard handles physical keys.
- This flat room uses PlayCanvas BoundingBox math with player-radius-expanded
  footprints and small axis-separated steps. This supports wall sliding without
  Ammo/WASM. It is intentionally limited to a flat floor and axis-aligned furniture;
  introduce the engine's collision/rigid-body system if future levels require
  stairs, jumping, dynamic props or arbitrary collision geometry.
- One directional shadow-casting light, a 1024px shadow map, shared simple
  materials, static batches, no post-processing, and a 1.75 pixel-ratio cap keep
  the starting scene modest. The complete JavaScript bundle is approximately 533 KB gzipped;
  actual phone GPU performance still needs device testing.
- Portrait is the primary layout. The canvas fills the browser viewport; resizing
  and landscape remain playable. No forced orientation API, letterboxed phone
  frame, menu screen, external fonts, or image downloads are needed.

Engine APIs were checked against the official [standalone guide](https://developer.playcanvas.com/user-manual/engine/standalone/),
[Camera](https://api.playcanvas.com/engine/classes/CameraComponent.html),
[Keyboard](https://api.playcanvas.com/engine/classes/Keyboard.html),
[TouchDevice](https://api.playcanvas.com/engine/classes/TouchDevice.html),
[BoundingBox](https://api.playcanvas.com/engine/classes/BoundingBox.html),
[Collision](https://api.playcanvas.com/engine/classes/CollisionComponent.html),
[ContainerResource](https://api.playcanvas.com/engine/classes/ContainerResource.html),
and [Anim](https://api.playcanvas.com/engine/classes/AnimComponent.html) references.
The reveal's temporary Web Audio sine chime is isolated behind `OpeningSequence.cue`;
it can be replaced with a PlayCanvas Sound asset bank without changing game rules.

## Scope and checkpoints

Included: the approved five-task bedroom mission, a connected six-space house,
ten new carry/place interactions, a six-task house mission and untimed exploration,
plus the existing store, reveals, collection and local saves.

**Stopped after Stage 4.** No final Arianna model, named family characters, second
floor, additional bedrooms, driving, town, stores or NPC AI were added. There are
no new dependencies.

The approved Stage 3 build was checkpointed **before edits** at `ee9c620` (the
approved implementation is `795245c`). The earlier Stage 2 checkpoint is `06fbe10`.

Local Git checkpoints preserve the initial implementation and the verified
milestone. No GitHub remote has been added and nothing has been published.
The project produces a static Vite build suitable for a later GitHub/Vercel setup;
Vercel's output directory should be `dist` and the build command is `pnpm build`.

## Verification

See `TESTING.md` for the completed checks, reproducible test command and physical
iPhone checklist. Browser screenshots and machine-readable results are saved in
`artifacts/` locally and intentionally excluded from Git.
