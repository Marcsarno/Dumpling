# Squishy Pop — local delivery

Checkpoint before changes: `d0accf1`. Test at http://localhost:5173/ and select **PLAY SQUISHY POP** inside any of the three stores. No deployment or additional store/house/pathing work.

## Readability and round polish — September 17

The follow-up keeps all 26 original reference-led sprites and their shading/detail. Each round now uses **five types with different silhouettes and dominant palettes**. Near-identical variants are separated across rounds. A bounded search prioritizes owned friends among compatible lineups; starter fill does not grant inventory. During dragging, matching friends stay bright and other types soften. Saved collection counts, favorites and locks are unchanged.

Live chain count and Bomb/Rainbow/Mega previews appear above the finger, including backtracking. Power-area previews share the rules' cascade targets. Bomb has a circular puff, Rainbow colored links, Mega a larger double wave. Frenzy gains a distinct border and seconds remaining. Only falling pieces bounce; settled pieces can be selected while neighboring columns settle.

The first-play lesson now waits for a real three-piece drag, without consuming round time or retaining practice score. At zero, the last gesture and animation finish before a one-pass special finale. Finale clears score base points plus existing copy bonuses, without chain/Frenzy multipliers; no new specials or inflated best chain. Results count up, celebrate a new record, show the previous best and send animated tickets into the reward line. Practice rounds remain excluded from rewards. Coupon cost and once-per-day limit are unchanged.

New verification: 1,500 varied inventories with five pairwise-distinct identities; every discovered ID can appear; preview/cascade agreement and bounded final scoring; a full natural touch minute (2,190 points, 5 tickets, ~8.1ms desktop-emulated frame p95), tutorial/reset, power previews/effects, finale/save preservation, three phone widths, reduced motion, mute, rapid reopen with one timer, previous developer controls, and twelve replay cycles. Typecheck/build pass. Screenshots and JSON: `artifacts/pop-milestone/`. Physical iPhone and Arianna's readability/fun feedback are still outstanding.

## Original V1 architecture and input (historical)

Pure TypeScript board rules are separate from the canvas/touch UI, art cache, audio and existing save system. The world remains loaded behind a modal, with movement, daily time and 3D rendering paused. Returning restores normal rendering at the same position. The first round teaches dragging with three animated strawberry friends, then counts 3–2–1–POP. Pause, mute, replay and back-to-store controls stay touch-sized.

The 6×6 board draws six active types from discovered collection IDs, filling missing types from six starters. Connections use eight neighbors, require three matching pieces, reject repeats and undo on backtracking. Fast pointer movement is sampled between events to reduce skipped cells. Pointer capture, single-pointer ownership and cancellation prevent accidental releases. The current gesture can finish after the 60-second timer reaches zero.

Gravity and refill use a short squash, fall and bounce sequence. No physics engine is involved. Every refill checks playability; bounded shuffling has a guaranteed three-piece fallback. At least one valid matching chain always remains after settling.

## Powers and collection

| Chain | Created power | Activation |
|---|---|---|
| 5–6 | Pop Bomb | Tap or match; clears radius-one square, up to 9 |
| 7–9 | Rainbow | Wildcard joins any one matching type; backtracking can change the chosen type |
| 10+ | Mega Squish | Tap or match; clears radius-two square, up to 25 |

Powers can cascade, with every cell/power processed once. Large clears do not manufacture extra chain-length powers. Strong quick chains fill Frenzy; seven seconds give ×2 score, a brighter tray, gentle bounce and slightly faster music.

One owned copy unlocks a friend, two copies give two stars, five copies give three stars. Two/three stars add only 2%/4% piece score. No inventory is consumed. This leaves duplicates available for trading.

**Art correction:** the user explicitly said the existing world squishies are unfinished placeholders. All 26 minigame sprites instead use new reference-led art based on the supplied character sheets. The experimental world-model renders were removed. Existing saved IDs and names connect discovery/stars; the world models themselves were not changed.

## Reward balance and save safety

`POP_RULES` controls round length, piece score, tickets and coupon values. A round gives 1 + floor(score/500) tickets, maximum 8. Forty tickets buy an automatic $1 discount on a box, at most once per game day. Prices display the discount before purchase. There are no direct cash grants or free boxes.

An optional `pop` field extends existing version-one saves. Round receipts prevent double awards, and the completed result offers a save retry on storage failure. Tickets, coupon consumption, stock and payment share the existing atomic transaction system. LocalStorage remains local to the browser origin, not a server-authoritative economy.

## Art and sound

Five transparent sprite atlases are cached into 32 small canvases (26 friends, six effects/rewards). They were created with the built-in imagegen tool from the user's visual references. Source sheets stay in Downloads; exact prompts, generated paths and background-removal passes are recorded in `public/assets/pop/ART_NOTES.md` and `CHARACTER_PROMPTS.json`.

Six effects from Kenney Interface Sounds and TinyWorlds' Happy Adventure music are CC0, verified against their publisher pages and recorded in ASSET_MANIFEST.md / shipped credits. The effects have compatible WAV copies for Safari. Original sine/triangle layers cover squeaks, escalating combos, each power, countdown, final-ten-second ticks and celebration. Music loops at low volume with small Frenzy/late-round energy changes. Voices disconnect after use; music stops on pause/exit.

## Verification and performance

- 15,000 generated/refilled boards: playability, unique pieces, backtracking, invalid chains and score bounds.
- Deterministic rules: all power thresholds, exact clear radii, wildcard constraints, cascades, Frenzy, adversarial deadlock, star levels and discovered pool.
- Save tests: preserved legacy fields, double award, storage failure/retry, reload, coupon deduction and daily cap.
- Two real 60-second touch rounds in an isolated Edge mobile profile, with real countdown and timer; scores 13,017 and 13,442, best chains 9, 8 tickets each. Automated optimal searching is much stronger than a child's play and does not establish balance/fun.
- Separate touch fixtures create and activate Bomb/Rainbow/Mega and trigger Frenzy; invalid/backtrack/cancel/multi-touch and zero-time gesture behavior verified.
- Twelve additional replay cycles keep the sprite cache at 26 friends, effects at ≤90 particles and active audio voices at zero after pause.
- 320×568, 390×844 and 430×932 layouts, with 44.7–60.7px cells and visible result buttons. No page/asset errors in completed browser tests.
- Desktop Edge mobile emulation measured ~7ms p95 animation-frame interval during the full rounds. Pixel ratio is capped at 2; 36 pieces, one canvas, bounded particles and cached art keep work modest. **Physical iPhone/Safari performance has not been measured.** Audio decoding/playback-state checks passed; a child's subjective enjoyment and listening comfort need human feedback.
- Existing 22 clock/economy/hunt/trading regression checks, TypeScript and Vite build pass. The existing large-bundle advisory remains.

## V2 ideas, not implemented

Tune score/ticket pacing from Arianna's actual rounds; improve music variety; test Safari on a real phone; replace the future world collectible placeholders with approved final models so world and arcade art converge. Wishlist/daily events remain separate later milestones. House/pathing remains paused.
