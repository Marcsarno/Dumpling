# Game asset sources

## Family-house expansion

Layout revision: six additional models from the same licensed Kenney Furniture
Kit archive: `cabinetBedDrawerTable`, `bookcaseClosedDoors`, `loungeDesignChair`,
`tableCoffeeGlassSquare`, `chairModernFrameCushion`, `lampRoundTable`.
Original GLBs preserved. Runtime blue-gray/ivory painted finishes omit the wood
texture; upholstery remains woven, glass/metal retains its separate materials.
The slate floor carpet and small terracotta bed throw are project-created.
No additional license or external resource dependencies were introduced.

- **Crib by Poly by Google**, [source](https://poly.pizza/m/4iV2yZ0wIf1),
  [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Downloaded September
  16, 2026 to `public/assets/environment/nursery/crib.glb`. Original GLB retained;
  runtime cream/sage/yellow palette, scale and nursery placement. Source/download
  links and attribution also ship in that folder's README and Art credits.
- Additional **Kenney Furniture Kit**, [source](https://kenney.nl/assets/furniture-kit),
  CC0: `bedDouble`, `cabinetBedDrawer`, `cabinetBed`, `desk`, `chairDesk`, `laptop`,
  `lampSquareTable`, `kitchenMicrowave`, `pillowLong`. Extracted from the previously
  downloaded and licensed local pack. Existing bookcases, books, bears, plants,
  lamps and recliners reused. Source GLBs unchanged; runtime scale, placement,
  pastel palette and existing fabric/wood detail. The changing pad rotates a pillow.
- **Marc** is the user-supplied animation_v2 GLB, preserved byte-for-byte with
  his source README, motion manifest, CC0 motion license and rejected-animation
  note. Ten embedded clips. Runtime display height 1.3 × Arianna. Walk_Basic is
  aliased as Walk; the cleanup pose is runtime adaptation, not an authored clip.
  Motion provenance: [Quaternius Universal Animation Library](https://quaternius.itch.io/universal-animation-library),
  [glTF source mirror](https://github.com/J-Ponzo/gltf-universal-animation-library).
  CC0 applies to those motions, not to the user-provided character as a whole.
- Project-created extension floors/walls/window/trim, rugs, toy basket and small
  cleaning tools supplement the imported assets. No extra animation downloads
  are required: all ten supplied clips are embedded in Marc's GLB.

## Trading V1 reuse

The recess courtyard reuses **tableCoffee**, **chairCushion**, and **benchCushion**
from the [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit), plus
**tree_oak** from the [Kenney Nature Kit](https://kenney.nl/assets/nature-kit).
These are the already included CC0-1.0 GLBs, with runtime scale, placement and
pastel material colors; no source files were changed or new downloads needed.
The three seated schoolmates are temporary project-created primitive geometry.
Courtyard ground/wall, interaction cues and collectible visuals are also
project-created. The supplied Arianna and Lilah files remain untouched.

All store fixtures below are actual imported GLB models, not recreated geometry. Kenney's source pages and the license files inside the downloaded archives confirm **CC0 1.0**, including commercial use. The original model files are retained. License copies ship alongside the assets in `public/assets/environment/kenney/`.

| Asset names | Source | License | Modifications / use |
| --- | --- | --- | --- |
| `shelf-end`, `shelf-bags` | [Kenney Mini Market](https://kenney.nl/assets/mini-market) | CC0-1.0 | Newly extracted for this milestone; scaled, rotated, used as endcaps and ordinary shop stock. Original atlas retained. |
| `cash-register`, `shopping-basket`, `shopping-cart` | [Kenney Mini Market](https://kenney.nl/assets/mini-market) | CC0-1.0 | Reused downloaded models for checkout, low basket finds and entrance props; runtime scale and placement. |
| `wall-window-wide-round`, `wall-doorway-round`, `door-rotate-round-a`, `floor` | [Kenney Building Kit](https://kenney.nl/assets/building-kit) | CC0-1.0 | Newly downloaded; arched architecture and forecourt paving. Original GLBs and `Textures/colormap.png` retained; runtime scale/rotation/placement. |
| `bookcaseOpen`, `bookcaseOpenLow`, `kitchenCabinetDrawer`, `tableCoffee`, `tableRound` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | CC0-1.0 | Reused as stock shelving, checkout counter and special displays. Warm material palette, subtle repeating wood texture; runtime scale/rotation/placement. |
| `bear`, `benchCushion`, `plantSmall1`, `plantSmall2`, `pottedPlant`, `lampRoundFloor` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | CC0-1.0 | Toy, seating, plants and lighting props. Coordinated pastel tints and subtle fabric texture where applicable. |
| `tree_oak` | [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) | CC0-1.0 | Trees beside the shop forecourts, runtime scale and placement. |

Project-created pieces: room floor slabs and simple cutaway walls/trim, rugs, grass base, nearby interaction aura, series-colored blind boxes and collectible squishies. These are small gameplay-specific pieces; generic shelving, displays, baskets, checkout fixtures, architecture and decorative props come from the free packs above.

Downloads reviewed for this milestone:

- [Mini Market ZIP](https://kenney.nl/media/pages/assets/mini-market/463f38da51-1729865423/kenney_mini-market.zip) (existing local archive inspected; two more usable fixtures extracted).
- [Building Kit ZIP](https://kenney.nl/media/pages/assets/building-kit/0de7aaa492-1743244741/kenney_building-kit.zip) (new download).

The in-game Art credits page links the sources. Existing house, pet, Arianna and Lilah asset provenance remains in the corresponding `sources.json` / character manifest files.
