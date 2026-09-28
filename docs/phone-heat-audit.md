# Phone heat investigation — September 27, 2026

**Follow-up correction:** Read [the deeper recheck](phone-heat-deep-recheck.md) for verified results. The outdoor teleport samples below left the camera focused on an old toy and are not representative of normal play. Real joystick doorway travel corrected the framing: the far-lane drawing count was 80, not 250, and texture allocation was 166.6 MiB, not 171.7 MiB. The camera-search CPU finding was independently confirmed without a mutation observer and at matched cadence; the updated report also records direct shadow submissions and four resource-retirement cycles.

Audited commit `1d2466ccfbd1b86beaca025fcb0d774a9b5fc618`, Editor runtime `6b9e8530e5c62df4`. This is an investigation, not a deployed optimization. No gameplay, character assets, save formats, resolution settings or rendering settings were changed. Browser experiments were temporary and isolated from production saves.

The strongest finding is unnecessary CPU work, followed by repeated shadow drawing and work behind menus. Small prompts are causing update/layout work; the evidence does not indicate that their memory footprint is the primary problem.

## 1. Five full scene searches every frame, even indoors

`src/game/Neighborhood.ts:24` searches `app.root.findByTag('migration.camera')` inside its four-section loop. `src/game/Outdoors.ts:81` does the same once. Both searches happen before checking whether the outdoor scene is active. `GameLoop.beforeMovement` calls both systems in every scene.

The scene contains 4,524 render components, plus their hierarchy nodes and inactive authored preview objects. Searching this hierarchy five times per frame is expensive.

In a separate 5.29-second CPU profile, these two camera searches accounted for approximately 3.06 seconds (58% of sampled time, including descendant calls). A temporary browser-only cache of the identical camera reference gave this result:

| House sample | Update CPU time/frame | Draw calls/frame | Texture allocation | Render cadence |
| --- | ---: | ---: | ---: | ---: |
| Original searches | 16.36 ms | 488 | 151.9 MiB | 53 FPS |
| Cached camera reference | 5.04 ms | 488 | 151.9 MiB | 109 FPS |

That is about 69% less update time per frame with identical drawing workload and texture allocation. It does **not** establish a temperature reduction: the uncapped browser used the freed time to draw more frames, and main-thread task time stayed near three seconds per three-second sample.

Recommended implementation: inject the existing camera into these systems, cache section bounds, and skip inactive section checks after completing required unload transitions. Do not repeatedly scan the hierarchy. Pair this with a deliberate frame budget so faster code does not simply do more work per second; a normal 60 FPS ceiling on higher-refresh displays is a separate cadence choice, not a resolution or character-quality mode.

## 2. Hidden prompts still cause substantial UI work

`src/ui/CleanupFeedback.ts:36` loops over every interaction marker. It updates visibility, classes, data attributes, transforms and world-to-screen coordinates even for labels it has just hidden. It interleaves these writes with `clientWidth/clientHeight` reads. `src/ui/HouseNavigation.ts:13` always hides the entire doorway-label container, then still projects and updates its labels. `src/main.ts:130` also reads label dimensions after the other frame's UI writes.

The instrumented morning-house sample recorded 51,453 DOM mutations over 3.04 seconds. Cleanup markers accounted for 36,908 and doorway labels for 4,380. Chromium recorded 648 layout passes and 11,732 style recalculations in the same interval. These counts include redundant mutations and are not counts of visible pixels changing.

Suppressing only identical `textContent` writes barely helped: update time remained around 15.3 ms. The larger opportunity is skipping invisible marker presentation, computing viewport dimensions once before writing, and updating attributes only when their values change. Visible ring motion, guidance arrows and interaction behavior must remain intact.

## 3. Menus stop rendering, but leave the CPU loop busy

`src/ui/PerformanceSettings.ts:7` disables `autoRender`; it does not stop PlayCanvas updates. Ordinary menu dialogs leave the main update callback in `src/main.ts:83` running. The menu intentionally says the day/round timer continues, so blindly pausing the entire game would change behavior.

In the menu sample there were zero rendered 3D frames, but 305 updates and 75,947 DOM mutations over about three seconds. Main-thread task duration was approximately the whole sampling interval. With camera lookup caching, the menu still recorded 108,597 mutations as the update cadence increased; task duration fell to 1.71 seconds per three-second interval.

Recommended implementation: separate timekeeping and required game-state progression from visual presentation. Preserve timer/save semantics while suspending covered-world label positioning, rendering-related animation work and other unnecessary presentation updates. Refresh presentation before the first resumed frame. Check active actions and NPC behavior explicitly instead of assuming every simulation can be frozen.

## 4. Shadow drawing is a large second pass

The house's single shadow-casting directional light uses a 1024-pixel map and updates every frame. A diagnostic freeze of shadow-map updates reduced drawing from about 488 to 112 calls/frame, roughly 376 shadow-related calls removed. This isolates draw submission cost; it is **not** a measurement of a 77% GPU-time or energy reduction.

Do not ship frozen shadows: animated characters and moving objects need live shadows. Investigate static scenery shadow caching/baking, smaller spatial batches and exclusion of scenery that cannot contribute to the visible image or its shadows. Keep character shadows and approved lighting intact. Off-camera objects can cast on-camera shadows, so camera visibility alone is not a sufficient shadow-caster test.

Night enables twelve local lamps plus a directional fill, in addition to the sun. They do not cast additional shadows. Day/night draw counts were almost identical in this sample; this audit does not establish night lights as the leading cause.

## 5. Inactive art remains resident

`GameLoop.ts:73` constructs all three store interiors immediately, and `LayoutBridge.ts:21` waits for them at startup. Disabling their roots stops normal drawing but does not unload their assets. `SquishyArt.ts:10` eagerly loads reveal/shop art; `OpeningSequence.ts:45` loads its background even before a reveal. That background alone occupies about 8.0 MiB of GPU texture allocation at its existing resolution.

The house inventory contained 71 GPU textures and 211 registered container assets. Engine estimates were approximately 151.9 MiB of textures, 19.9 MiB of vertex buffers and 3.7 MiB of index buffers. These are not complete process/GPU memory measurements. Texture allocation remained approximately 151.9 MiB in a shop, rose to 171.7 MiB at the far lane, and returned to 152.1 MiB after a school visit. One visit does not prove the absence of leaks.

Recommended implementation: load shop/reveal resources on demand and release them with shared ownership accounting. Continue section unloading. Investigate retained Editor preview resources, but do not unload materials or meshes still referenced by live runtime objects. Preserve every main character's existing textures, mesh, rig, materials and animation data.

## Existing good behavior and secondary observations

- Neighborhood sections already remove batches and release shared container leases; outdoor vegetation unloads on retirement.
- School interiors already load on entry and dispose on departure.
- NPC update methods return when their root is inactive. Static environment batching and view-frustum culling already exist; additional culling must improve on those systems, not duplicate them.
- The Editor release requests `powerPreference: 'high-performance'` in `editor-release/js/__settings__.mjs`, whereas the standalone source launcher requests `low-power`. This is a browser hint, not a thermal guarantee, and its effect on the user's phone remains unmeasured.
- No reduced character variant, global resolution reduction or separate phone/low-visual mode is proposed.

## Evidence and limitations

Measurements used isolated desktop Edge, AMD Radeon graphics through ANGLE/D3D11, a 390×844 CSS viewport and an unchanged 1170×2532 native 3× canvas. No physical phone was connected; temperature, battery power, thermal throttling and mobile GPU time were not measured. Short synthetic stationary samples have instrumentation overhead and variable NPC states. CPU profile sampling ran separately without the mutation observer. The cache experiment is particularly useful because draw calls, textures and resolution stayed the same.

Local evidence:

- `artifacts/thermal-audit/report.json`: nine scene/diagnostic samples and return-home sample, no page exceptions.
- `artifacts/thermal-audit/inventory.json`: textures and container inventory.
- `artifacts/thermal-audit/house.cpuprofile` and `cpu-summary.json`: sampled CPU evidence.
- `artifacts/thermal-audit/camera-cache-experiment/report.json`: original/cached camera and menu comparison.
- `artifacts/thermal-audit/house.png` and `lane-far.png`: native-resolution captures.

Reproduce with the existing static server (`PORT=5193`, `node scripts/migration-server.mjs`) and `node scripts/thermal-audit.mjs`. The script accepts `GAME_URL`, `EVIDENCE`, `PROFILE_ONLY=1`, or `CACHE_ONLY=1`; use a separate evidence directory for cache comparisons. Use the static Editor preview server rather than Vite to avoid transforming exported script registration. The runner uses the same installed Playwright runtime as existing project checks.

TypeScript checking and the local Editor release build passed. Both source/output character quality verifiers passed: Arianna retains both 2048×2048 maps, 14,694 triangles and 28 joints; Lilah retains her 2048×2048 color map and approved 1024×1024 metallic/roughness map. No source gameplay changes or deployment were made.

Priority: remove repeated camera searches, eliminate hidden UI work, separate menu presentation from timekeeping, then optimize static scenery/shadow participation and resource residency. Validate at a controlled cadence on the user's actual phone before claiming a thermal improvement.
