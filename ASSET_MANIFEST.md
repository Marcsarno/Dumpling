# Asset manifest

The cottage combines original project geometry, user-approved Arianna, and free
imported environment/pet models. The market and soap models include their supplied
textures. No external fonts were added. Squishy Pop adds the credited audio below. Imported meshes remain
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
| Squishy Pop: 26 regular sprites in four atlases; power/reward atlas | User-provided Squishy Treats, collectible lineup, Animal Friends, Magic Cosmic and minigame reference sheets; `public/assets/pop/ART_NOTES.md` and `CHARACTER_PROMPTS.json` record built-in imagegen prompts | AI-generated project art using user-supplied references, authorized for this game; no third-party stock-art license asserted | New reference-led 2D art. Existing unfinished world models explicitly excluded. Runtime atlas crops cached at 192px |
| `click_001`, `drop_001`, `drop_002`, `drop_003`, `pluck_001`, `confirmation_001` | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), downloaded September 17, 2026 | CC0 1.0; supplied license at `public/assets/pop/audio/Kenney-License.txt` | Converted OGG to mono PCM WAV for Safari compatibility; runtime pitch/volume variation |
| Happy Adventure loop | [TinyWorlds on OpenGameArt](https://opengameart.org/content/happy-adventure-loop), `happy_adveture.mp3` | CC0 1.0, verified on the author's asset page | Original MP3 retained as `happy-adventure.mp3`; low-volume playback, loop endpoints and small energy/rate variation |
| Squishy Pop melodic power, countdown, warning and celebration layers | `src/ui/PopAudio.ts` | Original procedural audio created for this game | Web Audio oscillators mixed with credited effects; no commercial music |

Architecture uses shared procedural materials; imported furniture and nature use
a shared warm palette and static batches. Floor patterns are geometric strips. Keep future downloaded assets in this manifest with their exact
source, license, original file and modifications before incorporating them.


## House polish and Lilah Tornado — September 17, 2026

CMU subject 13, clips 20 (washing windows) and 23 (sweeping), drive the new Wipe and Vacuum clips on Arianna's existing Meshy rig. Offline forward kinematics extracts 30 Hz hand trajectories; runtime two-bone IK adapts the motion envelope to the props. Floor wiping adds a deep crouch with foot IK to keep both feet planted. The original character GLB, locomotion and appearance remain unchanged. Pickup/putdown use the existing rig adapter clips.

Source: https://mocap.cs.cmu.edu/ and https://mocap.cs.cmu.edu/search.php?maincat=5&subcat=1. CMU permits all uses, including embedding in commercial games, but forbids resale of the motion data itself. This is **not CC0**. Acknowledgment: The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

Full source URLs, terms, preprocessing and the reviewed KayKit/Quaternius alternatives are in public/assets/animations/chores/asset_manifest.json. Only selected adapted trajectories ship. Original ASF/AMC downloads stay under ignored artifacts/house-polish/sources; scripts/prepare-house-motion.mjs reproduces the conversion.

Tornado sound cues reuse the previously downloaded **Kenney Interface Sounds (CC0)**, checked against https://kenney.nl/assets/interface-sounds, plus project-authored synthesized notes. Original license and sources remain in public/assets/pop/audio. No new music plays in the house. Event toys, spill, cloth and basket are project-authored; existing pug/poop models retain their earlier credits.
