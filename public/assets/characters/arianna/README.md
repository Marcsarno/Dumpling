# Arianna runtime integration

The user-approved V3.2.0 asset is enabled in `character.json`. The GLB, supplied
`asset_manifest.json`, and `PLAYCANVAS_HANDOFF.md` are retained without edits.

- PlayCanvas's container loader preserves the single vertex-color PBR material,
  mesh, 25-bone rig and eight separately named clips.
- Height is 1.203 m (uniform scale 1), +Y up, +Z forward, yaw 0. The authored root
  stays at ground between the feet; no bounding-box recentering is applied.
- `CharacterGrounding` moves only the visual alignment to the existing floors and
  thin rugs. The player root, collider, joystick, camera and travel speed stay unchanged.
- `CharacterAnimator` builds the Anim state graph from the manifest loop flags.
  Idle, Walk, CarryIdle, CarryWalk and SitCar loop. SitCar is loaded but unused.
  PickUp, PutDown and Celebrate play once at original speed and full duration.
- Movement remains 2.25 units/s, as requested. Playback uses actual displacement
  speed / authored speed: at full input Walk is 7.5x and CarryWalk is 12.5x.
  Analog movement and collision slowdown adjust playback; low-frame-rate movement
  clamping is accounted for. The faster cadence is an explicit gameplay preference.
  A direct Walk/CarryWalk blend synchronizes normalized phase.
- PickUp dispatches attach_prop at 1.10 clip seconds; PutDown dispatches
  release_prop at 1.30. Each callback commits once, on the first engine frame
  reaching the event. Translation and repeat actions pause during the full 2.4s
  gesture; normal movement resumes afterward. Mission deadlines still apply.
- Held placeholder props are centered between the animated hand.L / hand.R joints.
  Their materials and geometry are unchanged. Gameplay holds a generic socket and
  knows no joint names. Broad props and high shelves still use generic gestures;
  there is no prop-specific finger animation or inverse kinematics.
- Existing crayon and vacuum work feedback stays brief; it does not crop PickUp.
  Vacuum returns on a full PutDown. Successful missions finish that gesture,
  then play the full 1.6s Celebrate before showing results.
- Invalid assets retain the playable capsule and log a load diagnostic.

The read-only DEV diagnostics expose clip state, playback rate, event timing,
hand/prop positions and optional CPU-skinned geometry measurements. They are
not controls and are absent from the production window object.

Run `scripts/arianna-browser-test.mjs` for animation and contact checks; see
`TESTING.md` for full mission and collection regressions. Physical phone testing
is still needed for frame pacing at the chosen fast playback rates.
