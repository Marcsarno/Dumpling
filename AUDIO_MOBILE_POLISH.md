> Superseded audio/performance settings: see FAMILY_POLISH.md. Footsteps and battery saver are removed; music defaults to 50% with another 10% mix reduction. Historical battery-mode measurements below do not describe the current build.

# Audio, house details, and mobile performance — September 21

Implemented in the local production preview and PlayCanvas Editor. Opening choreography is intentionally unchanged. Production has not been redeployed for this follow-up.

## Audio and furniture

- Persistent music/effects sliders in Volume. Music defaults to 75% of the previous gain in the house and Pop. Existing mute preferences remain. Pop has a Volume button and pauses its round timer while the settings dialog is open.
- Recorded CC0 vacuum, chewing, cloth wiping, tap water, soft handling, and three footstep variants for wood/carpet/tile. Fourteen files total, 196 kB encoded. Buffers are reused; action audio stops on completion/cancel; footsteps follow distance travelled. Source/license links are in public/assets/audio/SOURCES.md and game credits.
- Existing bathroom mirror moved out of the wall, soap moved onto the sink rim. Mirror is decorative: no expensive real-time reflection pass.
- Remaining footrest and supports removed from the dedicated upright chair GLB. Dad's seat alignment and body scale unchanged. Blender source script preserves the original lounge chair asset.
- Living-room shelf and its books disabled, including its collision group. Other bookshelves retained.
- Four dining chair visuals scaled 1.15; breakfast seated height lifted 0.07 m. Breakfast completion visually checked.

## Measured findings

Desktop Edge/WebGL2 at a 390×844 phone viewport is a diagnostic proxy, not a physical-phone thermal test. Separate control test uses deviceScaleFactor 3. No actual phone temperature, battery draw, or mobile GPU timing was measured.

- Texture allocation: 460,117,876 bytes before, 92,067,700 bytes after (439 → 88 MiB, 80% reduction).
- Biggest offenders: three 4096² material maps (~85 MiB each with mipmaps), plus several 2048² character maps. Arianna, Marc, Lilah and the puppy now have at most 1024² color/normal and 512² material maps. SHA comparison proves non-image buffer views (geometry/rig/animation) unchanged. Four model downloads fell from 48.8 MB to 12.7 MB combined.
- Before: house ~541 draw calls per rendered frame, ~166 with shadows disabled. Final battery-saver view: ~458, ~145 without shadows; store ~127; night ~292. These are scene-specific samples, not universal limits. Shadows remain a meaningful cost.
- Largest individual geometry entries include the opening steamer's woven lid pieces (~34,872 triangles each) and decorative store lettering (~18–21k each). Approved animal geometry is unchanged. These are candidates for a future opening/LOD pass, not proof that polygon count is the phone's primary bottleneck.
- Battery saver defaults on for coarse-pointer devices: 30 FPS rendering, 1.25× pixel-ratio cap, 512 shadow map, 20-unit shadow distance. Off: up to 60 FPS, 1.75× ratio, original shadows. At a 3× phone DPR, the 1.25 cap produces a 487px-wide framebuffer for a 390px-wide view. Pop's 2D update/draw loop observes the same 30/60 budget.
- Measured active rendering ~30 FPS in house/store/night. Hidden 3D world during Pop: zero frames. Settings dialogs and hidden documents suspend 3D rendering. Simulation/input timing remains separate from 3D rendering; battery saver does not make walking half-speed.
- Performance information lives in Volume and reports last active FPS, texture allocation, and framebuffer dimensions. The first baseline harness's engine CPU-time fields were not valid; those fields are not used for conclusions. Final harness uses event timing; this is CPU submission timing, not GPU timing.

Reproduce: serve the built game at port 5191, then run scripts/performance-audit.mjs with --experimental-transform-types. EVIDENCE chooses output folder. Local evidence: artifacts/performance-before, artifacts/performance-final, artifacts/audio-performance, artifacts/house-detail-after. These use disposable saves. First test on the real phone should compare battery saver on/off over comparable ten-minute routes, starting cool and recording phone model/browser, visual smoothness and heat; do not claim thermal improvement until then.

## Opening proposal — deferred

Keep the bedroom, compose a three-quarter view with the bed behind the basket, and exclude Arianna completely. First approve a still composition, then a short Blender/PlayCanvas motion preview. Improve lid anticipation, hinge movement, reveal timing and settling; retain instant access to the next basket. Use restrained rarity lighting/particles. Investigate reducing woven-lid geometry during this redesign. The supplied Squishy unlock.mp3 (9.56 seconds) exists but remains unused; audition an excerpt for Rare and above before deciding duration. No new opening animation or audio timing was applied in this pass.

## Validation

Typecheck/build; 14 rules/save/sculpt tests; 5 household browser cases; 7 opening/Pop/bedtime cases; audio/performance controls and persistence test; breakfast seating test. Visual comparison: bathroom, recliner, cleared shelf, dining chairs. PlayCanvas runtime launched without warning/error logs. Build script overlays updated character/chair binaries and foley into the authored scene export. The six layout edits in editor-release/2600724.json match the MCP scene changes.

Final Editor checkpoint: 8f1125bf-6587-44a8-b628-c913bcdf4a5a; runtime eba006ac7b43f596. Final audio/performance browser test: six cases passed, including Pop settings timer pause and resume. Preview: https://launch.playcanvas.com/2600724?debug=true&device=webgl2 .
