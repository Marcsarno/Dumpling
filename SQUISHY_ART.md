# Reference-led dumpling and reward container

Marc requested a substantial improvement to the animated 3D squishies, using the
first attached image as the dumpling baseline and the second as the opening
container. The original primitive sphere/capsule body and square gift box have
been replaced by custom Blender assets. Marc authorized committing and deploying
this art pass on September 20. See PROJECT_HANDOFF.md for the release target and
check GitHub deployment status for its published state.

The dumpling has a continuous dough surface with nine flowing pinched valleys,
a rounded gathered crown, glossy chocolate eyes, two catchlights per eye, a U
smile, painted blush and soft cheek marks. Existing 26 collectible IDs still pick
their original colors, expression and leaf/bow/star/crown charm. Their collection
and trading portraits now render the same sculpt. Squishy Pop's approved sprite
atlases and board mechanics are unchanged.

The container has a hollow rounded body, inset nest, rolled bamboo rims, actual
interwoven strips on both lid faces, a curved handle, clasp and working back hinge.
Closed lower-detail copies replace gift boxes on store shelves. Shared glTF
meshes/textures load once; individual variants own only their tint materials.

Opening is a staged 2.85-second animation: a small anticipation wiggle, lid swing,
toy rising/stretching, then a soft settle into the basket. A quiet idle and Squish
button let the toy feel soft after reveal. Reduced motion reveals immediately
and suppresses deformation. Presentation lights and camera apply only to the
reward scene. At short phone sizes the title and controls compact to keep the
model, reward text and DEV button clear of one another.

The existing receipt is still committed before animation. No save format, prices,
rarity weights, IDs, ticket rules, paid box contents or trade rules changed.
Reload halfway through opening resumes the already-saved reward once.

## Art review and rebuild

- `scripts/squishy-viewer.html` is a local interactive studio: all variants,
  turntable/drag, squish and open/closed steamer. Serve with Vite.
- `scripts/build-squishy-assets.py` builds the geometry/materials, exports three
  self-contained GLBs, saves the editable scene and renders front/three-quarter
  model views. Run Blender 5.2 in background from the repository root.
- `scripts/render-squishy-portraits.py` reads the saved master and existing data;
  `scripts/encode-squishy-portraits.mjs` makes the small transparent WebP portraits.
- Output/source details and reviewed model links: `public/assets/squishies/SOURCES.md`.
- Ignored review evidence/editable source: `artifacts/squishy-art/`.

## Checks

`squishy-art-test.mjs` validates embedded textures, finite mesh coordinates,
optional parts, actual hinge position, shelf detail budget, all 26 portraits and
continuous opening motion. Progress/trading regressions cover existing receipts,
duplicate counts, failed writes and protected copies.

`squishy-art-browser.mjs` uses isolated touch contexts at 320/390/430px. It checks
reload during opening, exactly-once reward, old balance/collection/tickets,
matching portraits, Squish without save changes, another basket, reduced motion,
DEV/control non-overlap and return to the house. `squishy-production-browser.mjs`
checks the actual production bundle without debug globals. Classroom trading
regression also passes with the imported models. No real player browser storage
is used. Phone emulation does not establish physical iPhone performance.
