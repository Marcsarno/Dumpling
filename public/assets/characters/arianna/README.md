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
Optional `CarryIdle`, `CarryWalk`, `PickUp`, `PutDown`, and `Celebrate` clips are
also recognized. The animator requests carry/interaction clips when available and
falls back to Idle/Walk when absent. One-shot clips should be exported in-place.
Missing all clips leaves the model usable as a static visual.

Stage 2 attaches held props to a `Carry socket` under the visual pivot, alongside
the mesh. This deliberately avoids a dependency on bone names. Gameplay signals
carrying and short actions to CharacterAnimator; it never manipulates the rig.
The socket can later be moved or attached to a hand bone in the visual layer only.

The controller stays on the parent entity, independent of mesh, rig, and clips.
Loading failures leave the placeholder playable and log a diagnostic warning.
