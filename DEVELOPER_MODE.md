# Developer studio

Available in local and deployed builds, including phones. Tap **DEV · F2** near the bottom of the game, press **F2** or **backtick**, or use **DEV** inside Squishy Pop. No keyboard or special URL is needed on a phone. Escape closes the panel. Opening it pauses world simulation, the cleaning timer and the minigame. Closing it preserves an existing minigame pause. Active cleaning interactions are cancelled and carried tools/items return to their starting place.

## Fastest route to testing

**Jump in → Play Squishy Pop** sets 3 PM, completes afternoon chores/current Lilah messes without allowance, teleports to Peachy Playroom, and opens Squishy Pop. The ordinary first-play tutorial still appears. **Pop lab → Resume game** returns to the board.

| Tab | Controls |
| --- | --- |
| Jump in | Play Pop immediately; finish current cleaning; skip to a completed afternoon; all three stores; home; collection; recess trading |
| World | Morning/afternoon/night; next day; finish/restart daily chores; freeze world clock; add $20 or 40 tickets; discover all 26; grant at least five copies each; one selected copy or sealed box; restock stores |
| Pop lab | Normal/practice restart; tutorial; finish practice; timer freeze and 10/60-second presets; deterministic 3/5/7/10 chains; Bomb/Rainbow/Mega injection; Frenzy; shuffle; no-move recovery |
| Save & tools | Capture/restore checkpoint; download save; fresh test save; unstick/reset camera; live diagnostics and diagnostic download |

Store shortcuts reset the bag purchase limit; existing unopened boxes stay in inventory. Duplicate grants never reduce an existing count and retain favorites/locks. Restart chores resets the current daily routine, not Lilah's daily mess quota. Finishing current cleaning works for daily, house, bedroom, pet and practice activities; developer completion awards no money. Lilah may create another mess later within her normal quota. World clock freeze is session-only and does not freeze the Pop round; use the separate Pop timer control.

## Practice and saves

Any Pop lab modification makes that round **DEV PRACTICE**. The visible footer and results explain that tickets and records are not saved. Practice replays remain practice until **New normal round** or leaving/reopening Pop. Normal rounds still award tickets when they finish naturally. A forced finish is always practice. World resource grants intentionally affect the local save.

Before the first developer change, the panel captures the current saved progress, daily routine and Lilah state in `arianna.developer.checkpoint.v1`. Later changes and page reloads retain that checkpoint. **Save checkpoint now** explicitly replaces it after confirmation. **Restore checkpoint** restores those three game keys and reloads; **Fresh test save** clears those three keys and reloads while retaining the checkpoint. Both ask for confirmation inside the game. Unrelated local storage keys are untouched. Downloaded JSON contains the three saved game records; it is a backup, not an implemented import feature.

Checkpoints cover persisted progress, not exact actor positions or a running arcade board. The localhost save and a 127.0.0.1 save belong to different browser origins. Tests use an isolated browser context, not Marc's live save.

## Implementation and verification

`main.ts` dynamically imports `src/dev/DeveloperPanel.ts` in all builds, as requested September 18. Developer commands and pause handling work in production. The read-only `window.__roomTest` test API remains development-only. This is a playtesting convenience available to anyone opening the game; actions affect that browser's save, not other players' saves.

The panel uses existing transitions, save validation, daily tasks and Pop board rules. A read-only diagnostic export includes current board, score, renderer metrics and the last six panel actions. Storage writes for progress use the existing atomic transaction; checkpoint restore rolls back if a write fails where storage permits rollback.

Run with the Vite server on port 5173:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --experimental-transform-types scripts/developer-saves-test.mjs
node scripts/developer-browser-test.mjs
node scripts/developer-edge-browser.mjs
```

Browser reports and screenshots: `artifacts/developer/` (ignored by Git). The main browser test includes a real 60-second normal round after practice to verify reward isolation and recovery. Phone viewport checks are Edge emulation; physical iPhone Safari remains untested.
