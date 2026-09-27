# Adventure UI — local implementation review

Implemented September 26–27, 2026. The user subsequently authorized deployment of this reviewed build. Publish through origin/main to the existing Vercel project and verify the live release SHA and runtime hash. Earlier local-only statements describe the review stage. No PlayCanvas Editor sync is part of this release.

## Preview

Built Editor release: http://127.0.0.1:5193/dist/index.html?preview=outdoors

Source development preview: http://127.0.0.1:5191/?preview=outdoors

The built export must be served statically. Serving it through Vite can rewrite its PlayCanvas imports and leave the authored scene without the game shell. The static preview uses Python's local HTTP server on port 5193, bound to 127.0.0.1. Both URLs select the existing `dumpling.outdoorReview` namespace; browser storage is additionally separated by port. Production saves are not migrated.

## Implemented

- Compact room/day status with an integrated journal tab, one wallet, and a single game menu. Existing header, mode bar and footer are no longer persistent gameplay overlays.
- Shared plum/porcelain palette, authored line icons, restrained borders, consistent typography, and a more prominent rectangular primary action. Jump, pickup and scooter controls use reserved positions above it.
- Keyboard movement switches to keyboard hints and focuses the canvas. Touch/mouse use brings the joystick back. Tab preserves visible keyboard focus.
- Journal presents the current game tasks and completion state. The latest game code has retired the numbered outdoor play gardens; this pass does not restore them or alter their saved data.
- Menu keeps Collection, Squishy Pop, sound/settings, activities, credits, help and developer access. Existing commands and disabled-state guards remain their owners. Developer controls are accessible from the menu and F2 rather than floating over gameplay.
- Collection opens on owned friends, with an All friends filter and prizes/trading under More. Portraits are larger and the desktop gallery is wider. Favorites, locks, copies, rarity and existing navigation remain available.
- Modal boundaries release held movement/action inputs. Keyboard actions and jumping cannot fire through open dialogs. Existing world-clock/timer semantics remain; the menu/journal explain when time continues.
- The Lilah Tornado launcher's dialog guard recognizes the new menu so the activity remains accessible, while retaining its other availability rules.

`src/ui/AdventureHUD.ts` owns the shell and bridges to existing controls; `src/ui/adventure.css` owns its geometry and theme. Hidden legacy HUD elements remain as data/command hooks for existing gameplay. This is an incremental UI migration, not a replacement of economy, world or save systems.

## Validation performed

- TypeScript passes.
- Editor-release build passes, including source and built asset quality guards. The build embeds the generated migration CSS; expected bare CSS import warnings in the script-text bundle do not remove the embedded styles.
- Arianna remains the original asset, SHA-256 `35cfde9dba8d20d53019d654728972c04f7455ccc533040d00818f86d3f82989`, 14,694 triangles, 28 joints, two 2048×2048 maps. Lilah's existing quality guard also passes. No character mesh, rig, weights, animation, material or rendering-resolution code was changed.
- Reviewed source UI at desktop 1280×720, phone 390×844, narrow phone 320×568 and landscape 844×390. The built Editor runtime also renders the new shell on the static preview server without observed browser errors.
- Exercised menu → journal, collection, settings, activity selection and Squishy Pop; checked My friends / All friends filtering, prizes/trading access under More, and the existing unavailable Collection state inside shops.
- Selected the House activity and observed its timer, keyboard movement handoff, journal task list and modal E-key isolation. Confirmed Lilah Tornado is available through the menu when its normal conditions hold.
- Used the real joystick to leave the house, checked the outdoor Jump control, and verified the menu takes keyboard focus during a J-key check. These are targeted UI checks, not a replacement for a full motion or gameplay regression suite.
- Actual browser captures are saved in `artifacts/ui-redesign`. They are game renders, not generated mockups.

## Scope and remaining limits

This implements the improved gameplay shell, journal, menu, collection and settings presentation. Specialist trading, reward, fishing and arcade interiors retain their established layouts and rules; a comprehensive art pass on those screens is separate work. Camera framing, world signs and character art are unchanged. Physical-phone performance, simultaneous multi-touch behavior and a complete gameplay/save regression were not re-certified in this UI pass. No performance improvement claim is made.

Unrelated uncommitted Lilah-quality changes were present before this work and have been preserved. Generated migration bundles reflect the combined current working tree.
