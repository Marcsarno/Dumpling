# Phone heat fixes: local release review

The user authorized fixing the confirmed findings, committing, and deploying after the deeper audit. This release removes redundant work without changing character assets, rendering resolution, shadows, frame cadence, or save formats.

- Outdoors and Neighborhood receive the existing active camera directly. Their fixed visibility bounds are allocated once. Section creation and resource retirement retain the existing distance/frustum rules.
- Cleanup prompts project only potentially visible labels, read layer dimensions once before writes, and avoid unchanged DOM mutations. Disabled highlight rings do not receive transforms. Busy animations and covered scenes skip marker presentation; reward expiry and destination data used by the HUD still update.
- HouseNavigation retains room detection and current titles, while removing the permanently hidden doorway labels and their projections/layout work.

## Measurements

The original audit at commit `1d2466c` measured 10.74 and 10.55 ms/update in the controlled 30 Hz house samples. The release candidate measured 2.51 and 2.47 ms/update in the corresponding samples: approximately 77% less update time. Scene-wide camera searches fell from five per update to zero. Prompt time fell to approximately 0.51–0.54 ms/update; room-navigation time was below 0.01 ms/update. Rendering remained 1170×2532 at device pixel ratio 3.

These are separate desktop Edge measurement runs, not a physical-phone thermal or battery test. The uncapped run rendered more frames after optimization; savings per frame do not establish lower total device power. The 30 Hz scheduler exists only in the diagnostic browser script. GPU/shadow cost, eager shop/reveal residency, and possible high-refresh display work remain profiling opportunities. The unproven toy-batching experiment was not shipped.

## Validation

- TypeScript check and Editor release build pass. Both original-character asset verifiers pass for source and exported assets.
- `AUDIT_MODE=regression AUDIT_OUT=artifacts/thermal-fix node scripts/thermal-deep-audit.mjs` passes against the built export served on port 5193. Developer scene setup and nearby-position fixtures are used; actual action taps and the existing Select control pick up/return the vacuum. Offscreen destination guidance, menu hide/resume, day-clock continuation, room titles across store transitions, and native character rendering are asserted.
- A real touch-joystick walk through the doorway confirms EXPLORE camera tracking. Far-lane sections load, then all retire on returning home. Texture allocation returns from 166.59 MiB to 152.14 MiB on that route; this is a resource-lifecycle check, not a new memory-saving claim.
- The runtime retains Arianna's 2048×2048 color/normal maps, 14,694 triangles, 28 joints, and native 3× rendering. The protected Lilah asset hash and original 2048/1024 maps remain unchanged.
- `GAME_URL=http://127.0.0.1:5193/dist/index.html node --experimental-transform-types scripts/editor-release-smoke.mjs` passes: purchase persistence, saved store re-entry/exit, original save keys, and music settings. This uses a disposable browser profile.
- Final regression run reports no page exceptions or HTTP errors. Preview checks write no production `arianna.*` keys. Existing production-save smoke fixtures run only in their disposable profile.
- Home, outdoor, and guidance screenshots were inspected and the local preview was shown before deployment.

Evidence: `artifacts/thermal-fix/cpu.json`, `regression.json`, `home.png`, `outdoors.png`, and `guidance.png`. Earlier audit documents record the pre-fix findings and their limitations. The release candidate runtime hash is `9193f79319fb999c`.
