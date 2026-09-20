# Squishy materials and in-engine reveal polish — September 20

Marc requested refinement of the existing collectibles and opening, with no video
replacement or core-system redesign. Marc authorized committing and deploying
this pass together with the replacement scene music before moving to a fresh chat.
The previous deployed baseline is `f72d074`. See PROJECT_HANDOFF.md for the
release title/target. Stop at this scope; no further milestone is implied.

## Materials and identity

- The existing GLBs, silhouettes, 26 IDs, character colors, expressions and charms
  stay intact. Runtime material instances replace the old cream-biased albedo
  with a neutral satin map: smooth coloration, softened painted blush and restrained
  grain. A shared packed normal/roughness map adds very subtle surface response.
- Dough roughness is now 0.48–0.52, with reduced specular intensity and a restrained
  clearcoat. Eyes retain their two deliberate glints; the brown rims, eyelids,
  smile and cheek marks have consistent, softer roughness settings. Charms get
  a slightly more polished finish than the dough. No metallic body recolor.
- Rarity only changes finish and surrounding presentation. All 26 diffuse colors
  were checked against their original definitions. Collection/trading portraits
  now render the actual PlayCanvas materials, replacing the earlier Blender
  approximations. All 26 transparent 320px WebPs total about 122 KiB.

## Rarity and reveal

`src/data/squishyPresentation.ts` defines text contrast, glow/spark colors, material
finish, burst size, existing rim-light response, sound notes and hold duration.
It has no influence on odds, economy or receipts.

| Tier | Presentation | Opening duration |
| --- | --- | --- |
| Common | Clean satin, quiet neutral halo, two-note greeting; no particles | 3.15s |
| Rare | Blue halo/ring, ten light sparkles, slightly richer finish | 3.35s |
| Epic | Purple stars/ring, eighteen sparkles, stronger bounce and pearl-like coating | 3.55s |
| Legendary | Gold ring, twenty-eight stars, twelve short rays, five-note fanfare | 3.80s |

The original hinge/rise/squash flow remains real 3D animation. Anticipation, lid
sound, pop at 1.58s, settling at 2.85s and a short admiration hold have separate
beats. Rare and above get a gentle 0.8–1.8% camera emphasis without shake. Effects
fade within 1.6s; idle has at most two/three/four slow glints. Common has none.

Phone UI separately shows rarity, **NEW!** or **DUPLICATE · ×count**, name and the
existing series. Color accents have dark readable text (at least 4.5:1 contrast).
Compact touch controls and the top DEV launcher leave the caption clear at
320×568. Reduced motion skips the animated sequence and bursts; it keeps the
label and a static soft halo. Reloaded receipts do not replay celebration or sound.

## Performance and verification

- VFX use one reusable unlit mesh / one extra draw call, at most 588 triangles.
  Geometry updates are capped at 30Hz. No particle entities, post-processing,
  heavy iridescence shader, extra lights, video or remote service is used.
- Two shared maps add about 91 KiB of downloads and roughly 1.7 MiB of mipmapped
  RGBA texture storage. The key shadow map drops from 2048² to 1024² (75% fewer
  texels). Per-character material copies are released when the model is destroyed.
- Twenty art, motion, contrast, progress and trading unit checks pass, as do
  TypeScript and the Vite build (existing large-engine-chunk advisory remains).
- The production-preview smoke passes reveal/squish, exactly-once reload,
  retained wallet/credits, matching portraits and classroom assets.
- Nine touch reveal cases cover NEW/duplicate across all tiers, smile/wink/sleepy,
  cream/pink/cocoa/blue/peach/purple/gold, 320/390/430px, reduced motion, saved counts,
  old wallet/tickets, squish, refresh and restored camera framing. No console errors.
- Separate prior regression covers mid-animation reload and no duplicated award,
  next basket, collection, DEV hit areas and return to the house on three phones.
- Desktop Edge mobile emulation measured animated-frame p95 about 7.0–7.1ms;
  settled p95 was 7.0ms in all nine cases. The reduced-motion cold sample showed
  a 76ms p95 during its short startup/screenshot window. These are desktop results,
  not proof of physical iPhone performance. Keep physical Safari startup and sound
  balance as the next review, along with Marc's visual preference.

Reproduce from the project root, with local Vite at `127.0.0.1:5178`:

```
node scripts/build-squishy-satin.mjs
node scripts/render-squishy-engine-portraits.mjs
node scripts/squishy-polish-browser.mjs
node scripts/squishy-art-browser.mjs
node --experimental-transform-types --test scripts/squishy-art-test.mjs scripts/progress-test.mjs scripts/trading-test.mjs
```

`scripts/squishy-material-audit.mjs` saves eight representative views; set
`AUDIT_LABEL` to name an audit folder. Ignored evidence is under
`artifacts/squishy-polish/`. Tests use isolated Edge contexts, never Marc's saves.
`scripts/squishy-production-browser.mjs` smoke-tests a production preview via
`TEST_URL`. The local sculpt review remains `scripts/squishy-viewer.html`.
