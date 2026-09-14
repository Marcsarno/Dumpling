# Asset manifest

Stage 4 uses original procedural geometry and existing project assets. No external
3D models, texture packs, fonts or sound files were downloaded or incorporated.
The final Arianna model remains disabled in `character.json`.

| Asset | Source / original file | License / usage basis | Modified? |
| --- | --- | --- | --- |
| Approved bedroom furniture, floor, walls, decor | Original project geometry, `src/game/bedroom.ts` | Original work created for this game; no third-party asset restrictions | Visual geometry retained; materials exposed for reuse and house root attached |
| Hall, living room, kitchen, laundry room, bathroom, door thresholds and low cutaway walls | Original procedural work, `src/game/house.ts` | Original work created for this game | New |
| Ten new carryable objects: shoes, mail, toy, cushion, dish, trash, dirty laundry, clean laundry, towel, toiletries | Original procedural work, `src/game/houseProps.ts` | Original work created for this game | New; same primitive meshes/material palette reused |
| Existing bedroom cleanup props, highlights and placeholder player | Original project code, `src/game/cleanupProps.ts`, `src/components/CharacterVisual.ts`, `src/ui/CleanupFeedback.ts` | Original work created for this game | Interaction availability and marker visibility extended; no final character art |
| Existing store, sealed boxes and eight dumplings | Original project code, `src/game/store.ts`, `src/game/dumplingVisual.ts` | Original work created for this game | Stage 3 appearance retained |
| Box/sphere/capsule/cylinder/cone/torus primitive meshes and rendering engine | Installed PlayCanvas package, `node_modules/playcanvas`; upstream `https://github.com/playcanvas/engine` | MIT; installed package's `LICENSE` carries copyright and permission notice | Engine unmodified; generated geometry scaled/positioned by original scene code |
| UI symbols | Text characters rendered by the device's existing system fonts/emoji | No font or emoji asset redistributed | No downloaded files |
| Temporary opening chime | Original generated sine tone, `src/game/OpeningSequence.ts` | Original procedural sound; no recorded audio asset | Retained |

New rooms use the same material instances returned by the bedroom and the engine's
cached primitive meshes. Floor patterns are geometric strips; there are no new
texture assets. Keep future downloaded assets in this manifest with their exact
source, license, original file and modifications before incorporating them.
