# Original reference-led squishy assets

Created for this game in Blender from Marc's two supplied visual references:
`a9f654c0-9828-4855-81ad-4197a24adf1a.png` (dumpling) and
`b92eb5fe-e639-47f3-8ced-a05842336959.png` (hinged bamboo container).
All exported geometry, UVs, satin/blush and bamboo textures, and render portraits
were authored for this project. No downloaded third-party model is included.

- `bao-squishy.glb`: continuous pleated dough mesh, rounded gathered top, domed
  chocolate eyes with catchlights, smile, cheeks, optional eyelids and charms.
- `bamboo-steamer.glb`: hollow base, inset nest, rolled bindings, actual over-under
  woven lid on both sides, curved handle, clasp and `LidHinge` pivot.
- `bamboo-steamer-shelf.glb`: static closed LOD for small shop stock displays.
- `portraits/*.webp`: 26 transparent Blender renders of these same models, using
  the existing collectible colors/expressions/accessories. Total about 146 KiB.

Build: `scripts/build-squishy-assets.py` with Blender 5.2; then
`scripts/render-squishy-portraits.py` and `node scripts/encode-squishy-portraits.mjs`.
Editable `.blend` and full-size review renders are generated under
`artifacts/squishy-art/` (not served or committed). Sources and conversion scripts
are retained; original user reference files remain untouched.

Research, reviewed but **not used**:

- [Bamboo steamer by Jingbari](https://sketchfab.com/3d-models/bamboo-steamer-436b6a5e02834c92aa74a8c5426195df):
  CC Attribution, approximately 179k triangles; scanned real cookware rather
  than a hinged toy container.
- [Dough Character by Plewr](https://plewr.itch.io/plewr-character-model-v1): CC0
  toon character, different design.
- [Dumpling Buddy by Modelmonster](https://www.meshy.ai/3d-models/Dumpling-Buddy-AroundTheWorld-v2-01967726-73a6-7faa-a929-d855a723a491):
  listed CC0; custom modeling chosen for closer control over the supplied design.

The project does not assert that these references or models are an official
version of any branded toy.
