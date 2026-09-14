# PlayCanvas animation handoff

Target engine: PlayCanvas, importing GLB/glTF. Preserve clean, separately named clips and the shared deform skeleton. Keep engine state logic outside Blender.

The current GLB contains eight separate named animation entries: Idle, Walk, CarryIdle, CarryWalk, PickUp, PutDown, Celebrate, SitCar. These are separate clips within one GLB, not a concatenated timeline. All use the same 25-bone skeleton and ordinary baked local transform tracks; playback does not require Blender IK, drivers or Python scripts.

Walk and CarryWalk have matching first/last skinned poses in the actual GLB. Loop-seam tests passed. Configure their PlayCanvas animation states to loop; the companion manifest loop flags are integration metadata, not automatic PlayCanvas state configuration. Also loop Idle, CarryIdle and SitCar. PickUp, PutDown and Celebrate are one-shot clips.

Use the PlayCanvas Anim component and animation state graph for state transitions and blending. Do not bake engine-specific state machines or transition logic into the character. The existing clips share a consistent rest skeleton for blending; tune transition durations in the game. Walk and CarryWalk have different cycle durations, so synchronize normalized gait phase if blending directly between them.

Walk: 1.133333 seconds per cycle, in place; forward movement 0.30 m/s at normal playback speed.
CarryWalk: 1.0 second per cycle, in place; forward movement 0.18 m/s at normal playback speed.
Scale entity movement with animation playback rate to maintain foot contact.

Dispatch pickup attachment at 1.10 seconds and put-down release at 1.30 seconds in game code. The viewer box is a test prop, not part of the GLB. Runtime character movement, object attachment and state logic belong in PlayCanvas.

Validation performed: Khronos GLB validation and actual Three.js skinning/loop/contact checks. This is not yet a PlayCanvas runtime import or blend test; perform that when the PlayCanvas scene is available. The local Three.js viewer is only a review tool and is not a runtime dependency of the asset.

Official guidance:
- https://developer.playcanvas.com/user-manual/editor/scenes/components/anim/
- https://developer.playcanvas.com/user-manual/animation/anim-state-graph-assets/
