# Arianna asset handoff

The prototype intentionally ships with a capsule. When ready, place `arianna.glb`
in this directory and change `character.json` to:

```json
{ "url": "arianna.glb", "height": 1.2, "yaw": 0 }
```

Reload the game. The PlayCanvas container loader instantiates the GLB, centers its
mesh bounds, puts its feet at the movement root, and scales it to 1.2 world units
tall. Use `yaw: 180` if the model faces backward. Default forward is +Z, up is +Y.
Export in-place animation, applied transforms, and all textures embedded in the GLB.
Use exact clip names `Idle` and `Walk`; the engine Anim component crossfades them.
Missing clips leave the model usable as a static visual. Carry and interaction
clips are reserved for later milestones; they are not implemented yet.

The controller stays on the parent entity, independent of mesh, rig, and clips.
Loading failures leave the placeholder playable and log a diagnostic warning.
