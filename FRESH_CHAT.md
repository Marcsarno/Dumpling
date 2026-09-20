## Isolated Editor migration — newer than the notes below

Read FRESH_EDITOR_MIGRATION.md and EDITOR_MIGRATION.md first. Full-game migration is published separately; production remains fe3ae65. This checkout is the isolated migration branch.

# Fresh-chat handoff — September 20, 2026

## Start here

Workspace: `C:\Users\marc7\Codex Game Projects\Dumpling Game File`.
Read PROJECT_HANDOFF.md, then inspect the working tree before making changes.
Previous deployed baseline: **f72d074**. Marc then requested committing and
deploying all completed polish/music work before moving to a fresh chat.
Release title: `Polish squishy reveals and integrate scene music`.
Use `git log -1` and GitHub/Vercel deployment status for the resulting release SHA.
Production: https://dumpling-sandy.vercel.app/.
Local master tracks origin/main; repo is `Marcsarno/Dumpling`.

The user asked for a fresh-chat handoff after registering PlayCanvas MCP and
closing/reopening Codex. First verify whether PlayCanvas tools are available in
the NEW chat. Report connection status and the current release; discuss the
next action. This handoff does not authorize another milestone beyond that release.

## Completed work included in the authorized release

1. **Squishy material / rarity / reveal polish.** Original 26 identities and GLBs
   preserved; neutral satin color plus packed surface maps, tuned roughness and
   face materials, matching engine-rendered portraits. Configurable Common,
   blue Rare, purple Epic and gold Legendary treatments. Fully in-engine
   hinge/rise/bounce, bounded stars/ring/rays, short admiration hold, timed bells,
   explicit NEW/DUPLICATE, rarity/name/series UI, phone-safe controls and reduced
   motion. See SQUISHY_POLISH.md and TESTING.md. Do not convert to video.
2. **User-provided music.** Files are in `public/assets/audio/`, preserved intact:
   - `Squishy home clean.mp3`: morning and night.
   - `Squishy Home clean v2.mp3`: afternoon chores.
   - `Squishy school trading.mp3`: school trading.
   - `Squishy shopping.mp3` / `Squishy shopping v2.mp3`: alternate when entering
     a different store; no switch merely from pausing or opening Pop. Alternation
     is session-local; a reload starts with Shopping 1.
   - `Squishy unlock.mp3`: **HELD UNUSED**, 9.56 seconds. User is unsure. If used
     later, consider a shorter excerpt for Epic/Legendary ONLY, never Rare/Common.
   Existing Pop music and current reveal cues are unchanged. One scene-music
   voice, fades, repeat gap, persistent mute, pause for Pop/DEV/Tornado/hidden tab,
   and lower background volume during reveal. See audio/SOURCES.md.

All modified/untracked files observed at this checkpoint belong to these passes
or their docs/tests. Preserve them. Original source music and prior assets remain.

## Verification already completed

- 20 art, motion, text contrast, progress and trading checks passed.
- Nine reveal cases across all four tiers, new/duplicate, 320/390/430px and
  reduced motion passed with no console/asset errors. All 26 original material
  colors were checked and matching portraits rendered.
- Three-phone regression passed: reload mid-opening, no duplicate award,
  next basket, collection, DEV clearance, return home.
- Production-preview reward/portrait/reload/classroom smoke passed before the
  music addition. Latest TypeScript and production build also passed after music.
- Updated `scripts/house-music-browser.mjs` passed actual decoding of all five
  tracks, day-phase routing, school, three stores alternating 1/2/1, Pop pause /
  resume, natural end/repeat, persistent mute/reload and DEV pause. Unlock audio
  was confirmed never loaded.
- Physical iPhone/Safari and subjective audio/art approval are still unverified.
  Desktop emulation settled p95 was ~7ms; a short reduced-motion cold-start
  sample had a 76ms p95. Do not claim physical-phone performance from this.
- Ignored screenshots/reports: `artifacts/squishy-polish/`,
  `artifacts/squishy-art/`. Editable Blender source remains under artifacts.
- Local Vite/preview previously ran on ports 5178/4179; verify before reusing.

## PlayCanvas MCP status

The user requested `codex mcp add playcanvas -- npx -y @playcanvas/editor-mcp-server`.
Registered globally as enabled stdio; `codex mcp get playcanvas` succeeded.
On this computer npx is not on the Codex shell PATH, so the equivalent is:

```
command: C:/pinokio/bin/miniforge/node.exe
args: C:/pinokio/bin/miniforge/node_modules/npm/bin/npx-cli.js -y @playcanvas/editor-mcp-server
env PATH: C:\pinokio\bin\miniforge;C:\Windows\System32;C:\Windows
```

No handshake or Editor connection was verified. This old chat still had zero
PlayCanvas tools after the user reported closing/reopening. Check the new chat's
tool catalog first, then startup/configuration if needed. Never claim registration
equals connectivity. Avoid printing auth tokens or unrelated config secrets.
The game is an Engine/TypeScript/Vite repo; no corresponding hosted Editor
project has been established. Do not migrate/upload the project without direction.

## Preserve

- Actual user saves: `arianna.progress.v1`, `arianna.daily.v1`, `arianna.lilah.v1`.
  Use new isolated browser profiles for fixtures. Do not clear real localStorage.
- Supplied character models/animations, current Squishy Pop gameplay, live DEV
  access on phones, and completed game systems. No unrelated redesigns.
- Marc explicitly authorized this release after the initial handoff was written.
  Publish with origin HEAD:main and verify Vercel's exact commit plus live
  behavior. Do not infer authorization for future releases. Deployment notes are in
  PROJECT_HANDOFF.md; local gh is under `artifacts/deploy-tools/gh/bin/gh.exe`.

## Suggested first message

Read FRESH_CHAT.md and PROJECT_HANDOFF.md before doing anything. Preserve all
local changes and my existing saves. First check whether this new chat can access
the PlayCanvas MCP server; registration was confirmed but connection was not.
The squishy polish and replacement music were prepared for the authorized release
`Polish squishy reveals and integrate scene music`. Verify the release status,
give me a short update, then we will choose the next action.
