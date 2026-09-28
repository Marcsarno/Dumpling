# Deeper performance recheck — September 27, 2026

This independently rechecks the first audit against the same source commit `1d2466ccfbd1b86beaca025fcb0d774a9b5fc618` and exported runtime `6b9e8530e5c62df4`. The exported engine is PlayCanvas **2.22.2**; the package dependency is 2.22.1. Runtime observations and rendering inspection here use the exported engine.

No gameplay source, character asset, resolution setting, save format or deployed build was changed. Only audit scripts and documentation were added/edited. Diagnostic changes lived in disposable browser pages.

## Correction to the first audit

The earlier outdoor teleport samples were not representative of normal play. The character began beside an interactive toy. Teleporting directly out of that interaction left the camera in `CHORE`, aimed at the old toy; Arianna moved but the view did not follow her. This affected both what rendered and which scenery sections remained loaded. The first audit's far-lane screenshot exposed this mistake on closer visual inspection.

This pass used real joystick movement through the doorway, verified `EXPLORE` camera state, then checked that camera offsets followed the requested outdoor coordinates. Normal doorway travel worked. The corrected full-resolution far-lane capture shows Arianna and the intended street.

| Sample | Earlier exploratory count | Correctly framed count |
| --- | ---: | ---: |
| Near lane | 538 draw calls/frame | 141 |
| Far lane | 250 draw calls/frame | 80 |

Do not use the earlier outdoor drawing or memory figures as normal-play benchmarks. Corrected far-lane texture allocation is 166.6 MiB, versus the earlier 171.7 MiB. The house CPU-search finding did not depend on this camera mistake.

## Camera-search waste confirmed without the mutation observer

The new timing samples do not install a MutationObserver or CPU sampler. Lightweight wrappers measure the actual camera searches and two UI update methods; identical wrappers run in both conditions. Sampling does not traverse the full scene to generate a snapshot during the timed interval.

At the native desktop cadence, the original game made exactly **710 hierarchy searches in 142 updates**: five per update. Measured update time was 15.60 ms/frame, consistent with the first audit despite removing its mutation observer.

For a fairer work-per-second comparison, a diagnostic scheduler requested 30 updates/second. This is solely a test control; it is not a proposed phone mode or a game change. An initial timer implementation drifted, so it was corrected before the final ABBA comparison. The final samples achieved 29.88–30.31 updates/second.

| Condition | Update CPU time/frame | Drawing/frame | Main-thread busy fraction |
| --- | ---: | ---: | ---: |
| Original, first sample | 10.74 ms | 488 calls | 39.0% |
| Cached, first sample | 4.18 ms | 488 calls | 19.8% |
| Cached, repeat | 4.21 ms | 488 calls | 19.9% |
| Original, restored | 10.55 ms | 488 calls | 38.5% |

Across the paired samples: **61% less update CPU time per frame**, and approximately **49% less main-thread busy time at matched cadence**. The five calls still occur in the diagnostic, but return the same cached camera instead of walking the hierarchy. Resolution remains 1170×2532 and drawing is unchanged. This is stronger evidence of avoidable work than the first test's uncapped FPS increase.

Sources: `Neighborhood.ts:24` performs four searches; `Outdoors.ts:81` performs one. Both do it even when their outdoor systems are inactive. Passing the already-existing camera reference is the best-supported first implementation change.

## UI and menus: separate confirmed costs

The controlled samples measured cleanup feedback at roughly 1.6–1.7 ms/update and hidden doorway-label updates at roughly 0.7 ms/update. A separate toy-batching sample found **62 cleanup labels, zero visible**, while the feedback method still ran. Its 3D rings and guidance selection also have responsibilities, so the whole method should not simply be disabled.

The code interleaves label writes with viewport/layout reads and updates hidden labels. Reuse measured dimensions, skip hidden-label positioning, and update attributes/text only on change. Preserve visible rings, guidance and accessibility state. High mutation counts from the first audit are not equivalent to visible repaints or evidence of a large label-memory footprint.

Ordinary menu: zero 3D renders, yet original updates averaged 11.31 ms; camera caching reduced this to 4.19 ms. Remaining UI presentation continues despite the covered scene. Timekeeping must retain the existing rule that day/round timers can continue while browsing.

Squishy Pop menu: the 3D world also drew zero frames, but its update callback still ran before the early return. Original world updates averaged **9.79 ms**, versus **0.74 ms** with the camera cache. Pop has its own animation loop, which was left running in both conditions. The world-loop waste therefore affects a different mode too, not just the house.

## Shadow and toy submission findings confirmed directly

This pass intercepted the exported engine's actual shadow-caster submissions for one frame, preserving the original submission method. In the house sample it counted **376 shadow submissions**, independently confirming the earlier shadow-freeze result.

Of those, **160** came from `Home free play` toy parts. Arianna, Lilah and Marc each contributed one shadow submission; this is a draw-submission comparison, not a claim that every mesh costs the same GPU time. Small toy eyes, limbs, wheels and other primitive pieces are separate render components. Their materials and primitive meshes are already shared, so the obvious issue here is submission count rather than duplicated large textures.

A reversible experiment dynamically batched only toy-item render components:

| Same house view | Forward submissions | Shadow submissions | Total draw calls |
| --- | ---: | ---: | ---: |
| Original | 112 | 376 | 488 |
| Toy batch experiment | 98 | 276 | 374 |
| Restored | — | — | 488 |

That removed 114 calls (23%). Full-resolution before/after captures were visually inspected. Character geometry/materials/textures and screen resolution were unchanged. However, main-thread task time did **not** clearly improve in this short trial (approximately 0.55 seconds original, 0.57 batched, 0.49 restored per 2.5-second sample). Dynamic batching adds its own work. Treat this as a GPU/mobile profiling candidate, not a proven thermal fix or a ready-to-ship implementation. Carrying, rebuilding, changing and animating toys would require validation.

Correctly framed outdoors showed 104 shadow submissions near the house and 55 at the far lane. Trees accounted for 42 and 28 respectively. This suggests scenery-shadow work is worth investigating after the CPU fixes, with the actual camera and shadow frustum respected.

There are 295 disabled authored preview roots still present in the scene hierarchy. The captured submissions did not show those previews or inactive shops being rendered wholesale. Retaining a node, loading an asset, drawing an object and drawing its shadow are distinct costs. Do not assume all 4,524 registered render components are drawn, or that any off-camera shadow caster is unnecessary.

## Four repeated school/outdoor resource cycles

The final memory run used the verified joystick doorway path and correctly followed camera. Forced JavaScript garbage collection preceded each snapshot. After the first warm-up cycle, every return-home checkpoint after an outdoor visit had exactly:

- 159,525,368 texture bytes (152.14 MiB), across 75 textures.
- 20,711,244 vertex-buffer bytes and 3,839,428 index-buffer bytes.
- 7,460 scene nodes, 2,143 registered assets, 12 batch groups and 174 batches.

The four outdoor samples also returned to identical resource counts. School loaded/unloaded its additional resources repeatedly. This gives no evidence of an accumulating GPU-allocation or scene-node leak on the tested route.

JavaScript heap after return-home garbage collection increased from **86.88 to 87.94 MiB** between cycles one and four, with smaller later increments. Caches, browser instrumentation or retained objects could contribute; this is not a proof of a leak-free game. It is a much smaller unresolved issue than the demonstrated per-frame CPU waste. Long sessions, toy rebuilding, food interactions and interrupted loads are not covered by these four cycles.

All three shop interiors and reveal assets still remain eagerly loaded. That is a real residency/startup opportunity, but the audit has not established an exact releasable memory budget because shared assets must stay alive for their other owners.

## Evidence, reproducibility and remaining limits

Runner: `scripts/thermal-deep-audit.mjs`; modes: `AUDIT_MODE=cpu`, `render`, `memory`, `batch`. Start the existing static Editor preview server on port 5193 first. The runner intercepts only the local runtime response to expose diagnostic references; it does not edit the runtime file. Each mode closes its own isolated browser.

Evidence is under `artifacts/thermal-deep-audit/`: `cpu.json`, `render.json`, `memory.json`, `batch.json`, `lane-far.png`, `toys-original.png`, and `toys-batched.png`. All final modes completed with zero page exceptions and zero HTTP errors. Both character-protection checks and JavaScript syntax checks passed again.

These are headless desktop Edge/AMD measurements, not physical-phone power, temperature, thermal throttling or GPU timing. Headless scheduling and Playwright's browser flags differ from a normal phone browser. The 30 Hz diagnostic controls workload; no low-resolution mode, phone mode or frame cap was added to the game. No new thermal benefit is claimed without an actual-device test.

Recommended order remains: eliminate repeated camera searches; skip unnecessary hidden-label/menu presentation work; then compare scenery/toy submission strategies on the phone. Preserve all character assets, native resolution, saves and game behavior throughout.
