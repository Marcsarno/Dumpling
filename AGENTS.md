# Protected character quality

User requirements confirmed September 25, 2026:

- Never reduce Arianna's visual quality for performance. Preserve her original mesh, materials, 2048×2048 color and normal textures, and full native display resolution. No lower-detail character variants or dynamic resolution reductions affecting her.
- Do not create a new Arianna rig, change skin weights, or change the mesh. Animate the existing rig. Inspect the complete motion in actual game captures; imported arm motion previously stretched her jacket into a bat-wing shape and was rejected.
- Optimize neighborhood sections, scenery, loading, and inactive scenes instead. Measure cost; visibility alone does not free asset memory.
- Preserve existing game behavior and saves. Show local results before deployment. The user approved deployment of the reviewed daily-play and restored-outdoors pass on September 26, 2026.

`scripts/verify-arianna-quality.mjs` protects the full-quality original character asset and runs during checks and Editor-release builds. Do not weaken it to admit a reduced asset. See `docs/outdoor-journeys-local-preview.md` for current work and remaining validation.
