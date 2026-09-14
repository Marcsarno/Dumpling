# Arianna · A little room

A mobile-first, fully 3D bedroom cleanup prototype built with **PlayCanvas 2.22.1,
TypeScript, and Vite**. Stage 2 adds a one-minute cleanup loop to the approved
movement prototype. The room, fixed camera, joystick, portrait framing, and
existing furniture remain unchanged. All art is deliberately simple engine primitives.

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

The **60-second timer starts with your first move or interaction**. Each task
earns **$1**. Finishing all five adds **$2**, for a maximum **$7**, and ends early.
When time runs out, keep what you earned; there is no failure penalty. The results
card lists completed tasks and allowance, with one **Play again** button.

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
focus loss. Allowance belongs only to this round and is not saved.

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
| `src/game/IsometricCamera.ts` | Fixed orthographic camera and responsive framing |
| `src/components/PlayerController.ts` | Camera-relative movement, keyboard input, room/furniture blocking |
| `src/components/CharacterVisual.ts` | Capsule visual and optional GLB loading, scale and alignment |
| `src/components/CharacterAnimator.ts` | Visual facing, placeholder action poses and optional GLB animation crossfades |
| `src/components/CarrySystem.ts` | One carried item on a visual socket independent of the character rig |
| `src/game/cleanupProps.ts` | Five tasks, vacuum, hamper, destination anchors, placeholder props and reset |
| `src/game/CleanupGame.ts` | Pickup/place/use rules, cleanup durations, cancellation, rewards and replay |
| `src/systems/InteractionSystem.ts` | Valid-target filtering, nearest focus and forgiving proximity ranges |
| `src/systems/MissionSystem.ts` | Real-time deadline, task completion, allowance, bonus and results state |
| `src/ui/ActionButton.ts` | Captured touch/keyboard taps and holds, including two-thumb cancellation |
| `src/ui/CleanupHUD.ts` / `CleanupFeedback.ts` | Task checks, context labels, results, destination rings and coin bursts |
| `src/ui/cleanup.css` | Stage 2 overlays, separate from the approved layout styles |
| `src/ui/VirtualJoystick.ts` | Analog joystick, pointer capture, cancellation and focus handling |
| `src/ui/styles.css` / `index.html` | Full-screen canvas, safe-area-aware touch controls and minimal room labels |
| `public/assets/characters/arianna/character.json` | Enables the incoming Arianna model |
| `scripts/browser-test.mjs` | Automated real-browser movement, touch, resize and GLB tests |
| `scripts/cleanup-browser-test.mjs` | Full touch-driven cleanup rounds, real 60-second expiry and replay |
| `scripts/mission-test.mjs` | Deadline, duplicate reward, bonus and reset checks using Node's test runner |

`public/assets/rooms`, `props`, and `dumplings` reserve asset locations.

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
  the starting scene modest. The complete bundle is approximately 520 KB gzipped;
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
Audio is deferred; PlayCanvas Sound is the planned engine system if needed.

## Scope and checkpoints

Included: the approved movement prototype plus all five cleanup tasks, single
Action button, one-item carrying, nearby highlights, destination guidance, brief
cleanup animations, coin bursts, allowance, timer, results and replay.

**Stopped after Stage 2.** No store, driving, dumpling collecting, trading,
permanent progression, polished character model, or new dependencies were added.
Temporary feedback is visual; sound is still deferred.

Local Git checkpoints preserve the initial implementation and the verified
milestone. No GitHub remote has been added and nothing has been published.
The project produces a static Vite build suitable for a later GitHub/Vercel setup;
Vercel's output directory should be `dist` and the build command is `pnpm build`.

## Verification

See `TESTING.md` for the completed checks, reproducible test command and physical
iPhone checklist. Browser screenshots and machine-readable results are saved in
`artifacts/` locally and intentionally excluded from Git.
