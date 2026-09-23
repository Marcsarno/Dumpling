# Opening presentation (September 22, 2026)

- User-supplied cozy bedroom artwork is copied unchanged to public/assets/backgrounds/squishy-bedroom.png (2 MB PNG). Source: user's attached codex-clipboard-58bedcb9-61b1-4e8e-9387-55d075189943.png. No third-party asset claim.
- Camera-aligned unlit backdrop uses one plane and one texture, enabled only on the opening screen. Artwork covers the viewport; wide screens crop it. Ariana and the 3D bedroom remain hidden.
- Basket winds up, lid snaps open, squishy follows an upward arc and lands with volume-preserving squash. Rarity light/particles synchronize to launch. Name appears once the reveal settles. Reduced motion skips movement.
- Background is included in build-editor-release overlays and PlayCanvas asset 308313048. Runtime asset is 307711680.
- Local review: http://127.0.0.1:5191/scripts/opening-review.html . Replay four rarities resets only dumpling.openingReview.progress.v1. Actual arianna saves are untouched.
- Tests: scripts/squishy-art-test.mjs (motion/geometry); scripts/opening-bedroom-test.mjs (rarities, small phones, desktop, reduced motion, persisted receipts); scripts/opening-batch-test.mjs (four openings, reload mid-opening, isolated save).
- School changes remain included and approved. No public deployment or git commit requested for this pass.
PlayCanvas checkpoint: c0e47376-16f8-4b75-adb1-c025f3c4966f (opening pass).
Final validation: six geometry/motion tests passed; common/rare/epic/legendary phone previews passed, 320px controls clear; legendary desktop and reduced-motion passed. Four sequential openings and reload-mid-opening saved each reward exactly once. Background remains one texture/one draw; inactive launch particles stop generating after their burst. Final runtime hash: 9fd57b67048a17f3.
