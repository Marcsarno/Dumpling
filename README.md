# Arianna · Maple cottage

A mobile-first 3D cleanup and collecting game built with **PlayCanvas, TypeScript
and Vite**. The house now has a deep cottage plan, closer phone framing, imported
furniture and a landscaped setting. Arianna's approved model and cleanup/shop/save
systems remain in place. The new textured Arianna is displayed 15% larger. Normal
movement and small items use running; vacuum and scooper use slower carry walking.
She faces actual movement, including reversals and collision slides.

House furniture now has restrained woven upholstery, wood grain and rug textures
from three shared 256px repeating maps. Original GLB files and their colors stay
intact. Floating character names, room titles and doorway labels are hidden;
Lilah's short occasional remarks fade after 2.6 seconds without a name prefix.

Interaction glows and icon-only markers guide the next step. One destination
gets the stronger aura and an edge arrow when offscreen. Carried tools prioritize
unfinished messes, then storage after the last available cleaning step. If a mess
and storage overlap, Action selects cleaning first. Early tool return is still
possible away from a usable mess. The phone touch test is
`scripts/house-detail-browser-test.mjs`.

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

The game starts in **Daily life**. Its saved clock begins at 7 AM, advancing one
game minute per two real seconds while the game is visible. Morning tasks are
brushing teeth, choosing clothes from the bedroom drawer and getting dressed by
the bed, then making eggs in the kitchen. Cracking an egg has a 50% chance to drop
it: fetch the paper towel and hold Action to wipe before cooking can continue.
After finishing the routine (or at 8:30), use the living-room front door to go to
school. A short transition brings Arianna home at 3 PM.

After school, three randomly located dirt piles, a kitchen spill and laundry earn
$1 each. Carry the vacuum between piles; hold Action to clean and return the tool
to free your hands. Paper-towel wiping also uses a brief hold. Shopping is available
through the front door until 7 PM, when the day changes to nighttime. Brush teeth,
put clothes back inside the drawer, read by the bed, then sleep to begin a new day.
Sleep is also available at 9 PM. Daily progress and the egg outcome survive reloads;
daily time pauses while hidden. School gameplay remains future work.

Lilah is now a roaming two-year-old with her own preserved Meshy model and eight
animation clips. Her display height is 62.5% of Arianna's (25% larger than the
initial half-height version). She follows Arianna, explores, proudly makes toy
trails, spills juice, and drops cracker crumbs. These are real $1 chores using
the existing Action button, paper towel and vacuum. Up to three incidents occur
per day, with at most two untidied at once. Playing with Lilah delays her next
incident for 75 seconds; at night she settles down. Messes and rewards survive
reloads. Her behavior, navigation, animation and mess persistence are separate.

At 7 PM the garden becomes cool and dark while nine real bedside, floor-lamp and
wall-sconce lights fade on inside, with a soft warm interior fill for readable
faces. Lamp shades glow. Interior light masks exclude the garden and driveway,
including imported and batched geometry. Lights fade off for daytime and the
store; local lamps have no shadow maps to keep their phone rendering cost modest.

Pickup and put-down retain the full original clips at 3x playback (about 0.8 seconds).
Action first walks Arianna to a collision-safe point beside the actual prop.
Steering cancels that approach; a committed brief gesture locks movement.
Cooking geometry remains temporary pending approval of the Kenney Food Kit download.

You can also choose **House · 6**, **Bedroom · 5**, **Puppy · 1**, or **Explore** before moving. Explore makes all
16 implemented chores available without a timer or allowance; it can be
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

## Connected cottage

The **Puppy** challenge is a single ordered chore: pick up the small shovel on the
landing, scoop the living-room poop, carry it to the bathroom toilet, flush, then
wash hands at the bathroom sink. The same Action button handles each step. A loaded
scooper visibly carries the poop; flushing swirls it away. The brief handwash uses
the hands-forward pose, bubbles and a progress ring. Only the final wash earns $1;
the complete timed challenge also earns the existing $2 bonus. Explore includes
the same sequence without money and requires clean hands before another chore.

A small imported Quaternius pug plays its supplied Idle clip in the living room.
The bathroom has imported soap and toilet paper, and the toilet's cistern faces
the east wall with its seat projecting into the room. Pet and bathroom props are
in `public/assets/pets/`; source URLs, licenses and runtime changes are recorded
there. The game's **Art credits** link includes the required J-Toastie attribution.

The squishy store now uses Kenney bookcases, a cash register, shopping cart,
shopping basket and packaged-stock display, with visible squishy samples, plants,
an awning and bunting. Its existing price, bag limit, purchase/reveal loop and saves
are retained. This is an initial furnished store, not a new economy system.

The footprint is **9.8 units wide by 19.9 deep**. A bedroom and bathroom sit at the
back, connected by a compact landing. The central living room leads to the kitchen
and dining area and the utility room. The kitchen and utility room also connect
directly. There is no long central corridor and no scene loading between rooms.

| Space | Floor dimensions | Working interactions |
| --- | --- | --- |
| Bedroom | 6.6 × 7.2 | Original five chores |
| Landing | 3.2 × 3.2 | Shoes → bench; mail → tray |
| Bathroom | 3.2 × 4 | Towel → rail; toiletries → vanity |
| Living room | 9.8 × 5.9 | Toy → basket; cushion → sofa |
| Kitchen & dining | 5.9 × 6.8 | Dish → sink; trash → bin |
| Utility room | 3.9 × 3.7 | Dirty clothes → washer; clean clothes → counter |

42 CC0 models from Kenney's Furniture Kit and Nature Kit supply 169 placements:
sofa, reading chair, TV console, books, plants, kitchen appliances, dining set,
bathroom fittings, trees, flowers, bushes and fence sections. Original GLB meshes
are retained with a coordinated runtime material palette. The original bedroom
furniture is enriched with small details. There are no new runtime dependencies.

Outside the cutaway is a continuous lawn, planted borders, mature trees, gravel
driveway, entry porch, terrace, mailbox and low fencing. This is scenery; the
playable boundary remains the house. Foreground walls stay low for visibility.

The closer camera follows at a fixed angle with smoothing (10/s), maintaining
about 5.73 orthographic half-height at 390×844, compared with the former 11.15.
The screen-relative joystick is unchanged. Full-stick running is 3.15 units/s;
bulky carried tools use 1.65 units/s. Small analog input allows slower walking.
The smaller header keeps the world readable on phones. Room changes never cause
camera cuts or abrupt zooms.

The **House · 6** mission still selects the book, living-room toy, kitchen dish,
trash, dirty laundry and bathroom towel, for up to $8 in 60 seconds. Explore makes
all 15 chores available without a timer. Every task uses the existing Action
button, carry socket, highlights and rewards.

Room/door data lives in `src/data/house.ts`; architecture and placements in
`src/game/house.ts`; asynchronous asset caching, normalization, palette and
batching in `src/game/HouseArt.ts`; chores in `src/game/houseProps.ts`.
See [ASSET_MANIFEST.md](ASSET_MANIFEST.md) for sources and included CC0 licenses.

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
| `src/components/CharacterVisual.ts` | Approved Arianna GLB loading, manifest validation and scale/alignment |
| `src/components/CharacterAnimator.ts` | Manifest-driven Anim graph, event clocks, facing and hand grip |
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
| `public/assets/characters/arianna/character.json` | Enables the approved Arianna model |
| `scripts/browser-test.mjs` | Automated real-browser movement, touch, resize and GLB tests |
| `scripts/cleanup-browser-test.mjs` | Full touch-driven cleanup rounds, real 60-second expiry and replay |
| `scripts/mission-test.mjs` | Deadline, duplicate reward, bonus and reset checks using Node's test runner |
| `scripts/collection-browser-test.mjs` | Two complete real-touch loops, purchases, opening, persistence and portrait layout |
| `scripts/collection-edge-test.mjs` | Saved-state fixtures for all four rarity effects, trip cap and retained boxes |
| `scripts/progress-test.mjs` | Exact rarity intervals, economy boundaries, duplicates, refresh and save failures |
| `scripts/cottage-browser-test.mjs` | Current cottage tour, ten interactions, relaxed gait/facing, six-task mission and phone viewports |
| `scripts/house-edge-test.mjs` | Historical Stage 4 layout test; superseded by the cottage suite |
| `scripts/house-performance.mjs` | Same-viewport draw-call comparison against an archived Stage 3 server |

`public/assets/rooms`, `props`, and `dumplings` reserve asset locations.

Change **`src/data/collection.ts`** to tune the prototype: `STORE_INVENTORY` holds
the $4 price and three-box trip limit; `RARITIES` holds the 60/25/12/3 weights and
presentation cues; `DUMPLINGS` holds IDs, names, tiers, colors, faces and accessories.
Selection first rolls a rarity, then uniformly selects a dumpling within that tier.
Keep saved IDs stable when substituting final artwork. `SaveRepository` can be
replaced for a future account backend; a remote asynchronous implementation would
also need pending-state UI and server-authoritative transactions.

## Approved Arianna character

The Meshy carry_v1 Arianna is enabled at 1.38345m display height, 15% larger than
the previous display. Her original textures, material, 28-joint rig and six supplied
clips are preserved byte-for-byte. Idle, CarryWalk and CarryRun use the new authored
clips. Running is the default; item metadata selects slower bulky carrying.
Playback follows actual movement, capped at 1x. Gait blends synchronize phase.

Temporary runtime pickup/put-down poses take 0.8 seconds and commit at 0.4 seconds.
These and the temporary celebration stay outside the unchanged source GLB until
authored interaction clips arrive. Props follow the animated palms; the vacuum
uses its handle as the attachment. Floors and rugs adjust only the visual height.
Timed-out interactions cannot award late money.

See [the runtime asset notes](public/assets/characters/arianna/README.md) for the
integration contract and [TESTING.md](TESTING.md) for browser verification.

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
- One directional shadow-casting light, a 1024px shadow map, unshadowed nighttime
  interior lights, shared simple
  materials, static batches, no post-processing, and a 1.75 pixel-ratio cap keep
  the starting scene modest. The complete JavaScript bundle is approximately 536 KB gzipped;
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

**Portrait cottage revision complete.** The existing gameplay runs in a deeper,
more furnished house with a closer following camera and calmer Arianna gait.
The six spaces connect through varied doorways instead of a central corridor.
Arianna and Lilah now share the house. There are no new dependencies.

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
