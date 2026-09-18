# Squishy Pop level progression

## Research and design

Reviewed official documentation and product descriptions before implementation:

- [LINE Disney Tsum Tsum manual](https://help2.line.me/LGTMTM/android/categoryId/1438/3/pc?lang=en): short chain rounds, collection experience and later mission cards. Lesson: layer goals onto familiar play; explain one thing at a time.
- [Disney Emoji Blitz missions and levels](https://playdisneyemoji.com/disney-emoji-blitz-missions-and-levels/index.html): varied gameplay missions, some spanning rounds, with collectible milestone rewards. Lesson: give familiar actions a different purpose and keep rewards connected to collecting.
- [Two Dots official how-to](https://dots.helpshift.com/hc/en/3-two-dots/faq/368-how-do-i-play-two-dots/?s=gameplay): visible per-level objectives, target types, move limits, later special pieces and performance stars. Lesson: progress through different decisions, not merely higher score targets.
- [Best Fiends official site](https://www.bestfiends.com/) and [publisher description](https://www.sec.gov/Archives/edgar/data/1828016/000182801625000011/playtika-20241231.htm): matching with character collection/development. Lesson: preserve a connection between rounds and the collection. This update retains the existing ticket-to-box-coupon connection.

These are design inferences from published sources, not hands-on competitor testing. No competitor's exact difficulty curve was copied. Short instructions, forgiving goals and no life costs are choices for Arianna, not claims of proven child usability.

## First three levels

All rounds last 60 seconds with the existing 6×6 board, eight-way touch chains, three-piece minimum, power thresholds, Frenzy, finale and ticket rules. All existing powers remain available from Level 1; later levels focus attention on them rather than withholding familiar gameplay.

| Level | Complete the goal | Board/setup | Two / three stars |
|---|---|---|---|
| 1 · Little chains | Earn 300 points | Four visually distinct types; opening three-piece chain | Complete + 600 / 1,000 points |
| 2 · Big squishes | Make two chains of at least five | Four types; opening five-piece chain | Complete + 800 / 1,400 points |
| 3 · Friend party | Pop 12 of the pictured friend AND activate two powers | Five types; opening five-piece chain, one Bomb and one Rainbow | Complete + 900 / 1,600 points |

One star means completion and unlocks the next level. Higher stars are optional replay goals, never unlock requirements. Continue playing after reaching the goal to enjoy the remaining minute and earn the existing score-based tickets. An unsuccessful round still earns its normal tickets and can be retried freely.

Level 1 rewards ordinary matching. Level 2 encourages searching for longer paths and naturally produces powers. Level 3 asks the player to notice a particular friend and use powers; the starting Bomb/Rainbow provides an immediate opportunity. Timers and touch targets never become harsher. Pictured friends can vary on replay with the existing readable collection-aware pool.

Classic is accessible from the trail and retains the original five-type round. Store entry and the live-game shortcut open the same arcade; surrounding world state stays paused as before.

## Architecture and persistence

`src/data/popLevels.ts` contains stable IDs, duration, type count, opening-chain/starting-power setup, objective lists and optional score-based star thresholds. `PopLevelRun` observes resolved board events; it does not own input, physics, power resolution or rendering. It supports score, chains of a minimum length, target-friend pops, creation/use of a selected power or any power, and Frenzy activations. Several objectives in one definition form an AND goal.

Tutorial events are excluded. Finale clears count toward score/friend totals, but automatic finale activations cannot satisfy a player-use objective or invent chain/creation achievements. Cascade clears are counted once using the board's resolved unique clear list. Frenzy sessions use their expiration identity so repeated pops in one Frenzy count once.

`SquishyPopUI` handles the trail, briefing, pictured live counters and results. All pointer input and existing art/power rendering remain in place. `ProgressStore.completePopRound` accepts an optional level attempt and writes tickets, receipt and level record together. It rechecks the prerequisite against the freshly read save. Receipt replay cannot double-award tickets or attempts; failed storage writes commit neither rewards nor unlocks.

Optional `pop.levels` extends `arianna.progress.v1`; no existing key is renamed or cleared. Each level retains completion, highest stars, best score, best chain and attempt count. Lower-scoring or unsuccessful replays cannot reduce a prior record. Developer practice cannot save progression or rewards.

To add Level 4 or Level 20, append a definition with a permanent unique ID and the desired supported objectives/setup. Ordering controls prerequisites. No board-engine rewrite or new UI branch is needed. Truly new rules such as obstacles or move-limited rounds still require a deliberate engine/round-controller extension; those are not falsely advertised as implemented by unused config fields.

## Verification

Rule/save regression: `scripts/pop-levels-test.mjs`. Full sequential touch play and mobile screenshots: `scripts/pop-levels-browser.mjs`, with isolated Edge contexts and a separate local port. Evidence is under ignored `artifacts/pop-levels/`. Existing power/readability suites remain applicable. Physical iPhone/Safari and Arianna's subjective enjoyment require user playtesting; automated play does not establish either.

Completed verification: all three natural rounds unlocked/saved in sequence; an idle replay retained prior bests/stars. Scores were 5,090 / 4,960 / 4,465. The automated player quickly found strong chains, so these are reachability results rather than representative child scores. Three phone viewport sizes, final result-action visibility, next-level buttons, reduced motion, mute, all power types, Frenzy, twelve replays and clean console checks passed. TypeScript, production build and existing save/economy regressions passed. See `TESTING.md` for commands and limits.

No new assets, unrelated house/character changes, reward currency, life system or paid retries. Marc subsequently authorized committing and deploying this milestone on September 18 to the existing GitHub/Vercel production target.
