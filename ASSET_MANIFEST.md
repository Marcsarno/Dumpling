# Asset manifest

The cottage combines original project geometry, user-approved Arianna, and free
imported environment/pet models. The market and soap models include their supplied
textures. No external fonts or recorded sounds were added. Imported meshes remain
unchanged; Kenney environment materials use a coordinated runtime palette.

| Asset | Source / original file | License / usage basis | Modified? |
| --- | --- | --- | --- |
| Pug, with supplied Idle/Jump clips | Quaternius, [Pug](https://poly.pizza/m/1gXKv15ik8) | CC0 1.0 | Original GLB; runtime scale/placement; Idle loop enabled |
| Dog Poop | J-Toastie, [Dog Poop](https://poly.pizza/m/NwQhRNwk62) | CC BY 3.0; source/license and attribution in the shipped Art credits page | Original GLB; runtime size, carrying and flush effects |
| Shovel used as scooper | Kenney, [Shovel](https://poly.pizza/m/Tf39YoBe7V) | CC0 1.0 | Original GLB; runtime orientation, scale and carry attachment |
| Bathroom Toilet Paper | Quaternius, [Bathroom Toilet Paper](https://poly.pizza/m/pZojeda7ye) | CC0 1.0 | Original GLB; runtime scale/placement |
| Hand Wash Bottle | MiniPoly, [Hand Wash Bottle](https://poly.pizza/m/d4b5btUs1F) | CC0 1.0 | Original GLB and embedded textures; runtime scale/placement |
| Mini Market register, basket, cart and shelf-boxes | [Kenney Mini Market](https://kenney.nl/assets/mini-market) | CC0; original License.txt included | Original GLBs/colormap; runtime scale/placement |
| Furniture Kit models | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit); exact filenames in `public/assets/environment/kenney/sources.json` | CC0; original `furniture/License.txt` included | Original GLBs; runtime scale, rotation and material palette |
| Nature Kit models | [Kenney Nature Kit](https://kenney.nl/assets/nature-kit); exact filenames in `public/assets/environment/kenney/sources.json` | CC0; original `nature/License.txt` included | Original GLBs; runtime scale, rotation and material palette |
| Arianna V3.2.0 | User-provided approved `public/assets/characters/arianna/arianna.glb`, companion manifest and handoff | User explicitly authorized integration into this game; no broader redistribution license supplied | GLB, rig, material and all eight clips unchanged; runtime playback/attachment only |
| Approved bedroom furniture, floor, walls, decor | Original project geometry, `src/game/bedroom.ts` | Original work created for this game; no third-party asset restrictions | Visual geometry retained; materials exposed for reuse and house root attached |
| Hall, living room, kitchen, laundry room, bathroom, door thresholds and low cutaway walls | Original procedural work, `src/game/house.ts` | Original work created for this game | New |
| Ten new carryable objects: shoes, mail, toy, cushion, dish, trash, dirty laundry, clean laundry, towel, toiletries | Original procedural work, `src/game/houseProps.ts` | Original work created for this game | New; same primitive meshes/material palette reused |
| Existing bedroom cleanup props, highlights and placeholder player | Original project code, `src/game/cleanupProps.ts`, `src/components/CharacterVisual.ts`, `src/ui/CleanupFeedback.ts` | Original work created for this game | Interaction availability and marker visibility extended; no final character art |
| Store architecture, sealed boxes and eight dumplings | Original project code, `src/game/store.ts`, `src/game/dumplingVisual.ts` | Original work created for this game | Store furnished with imported fixtures; existing box/dumpling designs retained |
| Box/sphere/capsule/cylinder/cone/torus primitive meshes and rendering engine | Installed PlayCanvas package, `node_modules/playcanvas`; upstream `https://github.com/playcanvas/engine` | MIT; installed package's `LICENSE` carries copyright and permission notice | Engine unmodified; generated geometry scaled/positioned by original scene code |
| UI symbols | Text characters rendered by the device's existing system fonts/emoji | No font or emoji asset redistributed | No downloaded files |
| Temporary opening chime | Original generated sine tone, `src/game/OpeningSequence.ts` | Original procedural sound; no recorded audio asset | Retained |

Architecture uses shared procedural materials; imported furniture and nature use
a shared warm palette and static batches. Floor patterns are geometric strips. Keep future downloaded assets in this manifest with their exact
source, license, original file and modifications before incorporating them.
