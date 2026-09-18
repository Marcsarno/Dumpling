# Squishy Pop: make the next round irresistible

Assessment: September 17, 2026. Originally proposed alongside Developer studio. **Update: Marc subsequently authorized the first milestone.** Chain previews, distinct power effects, end-of-round finale/results, guided first chain and five-type tuning are now implemented. His readability feedback also led to silhouette/palette-aware lineup selection and matching-piece focus. See `SQUISHY_POP_REPORT.md` and `PROJECT_HANDOFF.md` for shipped behavior and tests. Buddy skills, persistent goals and reward expansion below remain proposals.

The foundation works: drag/release matching, diagonal connections, backtracking, three power-ups, Frenzy, reference-led art, sound, tickets and state-preserving store entry/return. It still feels like an early arcade implementation. Correct rules and attractive sprites alone do not create the rhythm, anticipation and emotional payoff of a finished game.

## What the comparisons teach us

Tsum Tsum is the closest mechanical reference. Its selected “MyTsum” has a special skill; switching that character changes strategy. Fever creates a high-scoring interval, and persistent bingo missions add goals beyond a single score. These are distinct layers of choice, excitement and longer-term purpose. [Official Tsum Tsum game manual](https://help2.line.me/LGTMTMG/android/categoryId/10000600/3/pc?lang=en).

LINE POP 2's original design combines stage-specific objectives, special blocks and map progression. The useful lesson for Arianna is understandable goals and visible progress, not its swapping or hexagonal board. This source describes its launch design, not an audit of every current feature. [Official LINE POP 2 announcement](https://www.linecorp.com/en/pr/news/en/2014/857).

The recommendations below are our design judgments based on those mechanics, the current implementation and Marc's feedback. We have not performed a comparative hands-on competitor playtest.

## 1. Finish the feeling of one round first

**Tell the player what her finger is building.** Show the chain count beside the endpoint, not underneath her finger. At 5, 7 and 10 pieces, preview the earned Bomb, Rainbow or Mega icon before release. Use a quick pulse and rising sound at each threshold. When she backtracks, the preview must update immediately. Teach through a guided first chain that the player actually draws; the current looping demonstration does not confirm understanding.

**Make each power visibly different.** Bomb: compress, then a short circular puff. Rainbow: colored ribbons visibly link its matching friends. Mega: a larger squash, expanding clear wave and an emphatic sound. Each should show what it will clear before activation, without hiding the next useful chain. Keep the supplied soft, pastel art direction; the unfinished world squishy models remain excluded.

**Improve the board's rhythm.** Currently there is a fixed short input lock after a pop and every tile gets the same settling bounce. Animate only moving tiles, stagger the pop along the chain, and allow new input on settled cells when safe. Preserve the forgiving 6×6 hidden grid and eight-direction drag rules. Start by comparing five versus six active types within the original brief; use controlled board generation to prevent long stretches of isolated pairs. Do not replace the game with full physics or swapping.

**Give Frenzy a clear beginning, middle and finish.** The existing multiplier, glow and audio change need stronger presentation: meter spill, a brief title flourish, energetic but readable border, a clear duration indicator, and a satisfying return to normal. Respect reduced motion and mute. Avoid repeated text covering the middle of the board.

**Finish with a payoff.** Let the last valid gesture and animation complete before the result panel covers the board. Resolve remaining specials in a bounded finale with explicit scoring rules. Count up the score, celebrate a new personal best, and visibly move earned tickets into the wallet. Show previous best and progress toward the next reward. The save already tracks best score; the UI currently fails to use it.

Acceptance: on a phone, Arianna can draw a valid chain without verbal help, recognize which power she earned and activate it, notice Frenzy, and explain the round reward. Observe three natural rounds, missed drags and pauses—not an optimal automated player. Ask whether she wants another round without prompting her to say yes. Check touch readability at 320/390/430 px, reduced motion, audio off, and real-device frame pacing.

## 2. Add one choice and a reason to replay

After the round feels good, let Arianna choose **one buddy** from discovered friends before playing. Start with three readable skill families rather than 26 unique abilities: a small area pop, a short color-link burst, or a few extra seconds. Charge the buddy by matching its type and activate with one large button. Preview the skill with a tiny animation, not a paragraph.

Add a small **three-stamp goal card** with easy, varied goals such as “Make a 5-chain,” “Use a Pop Bomb,” and “Meet Frenzy.” Progress persists across rounds; incomplete goals do not erase rewards. One goal should be achievable on a first attempt. Show the next goal on results with a one-tap replay. Keep daily repetition optional and forgiving.

Acceptance: changing buddy produces an observable difference without overwhelming a seven-year-old. Goal progress survives reload; quitting cannot double-award; practice/dev rounds cannot fill goals. No extra menus between result and replay.

## 3. Make collecting matter beyond a tiny score bonus

Duplicates currently translate into star levels and small score bonuses. Explain that relationship visually, then consider modest buddy-skill upgrades earned by duplicates. Do not create a runaway power gap or spend favorite copies automatically.

Connect the later wishlist milestone to a small ticket reward display: “Saving for this friend/series.” A choice of a series-specific sealed box or a cosmetic reward would be more tangible than only a $1 coupon. Preserve the store hunt and trading economy; model reward rates using ordinary child play before changing costs. The current automated high scores are not evidence of suitable child pacing. Budget this after feel and goals, not at the expense of them.

## Deliberate scope

Keep the existing house, stores, 60-second optional format, supplied reference art and touch → drag → release loop. Do not add house simulation, more travel, a large level map, competitive ranking, energy/lives, ads or paid boosters to solve this problem.

Recommended next implementation: **chain previews + distinct power effects + better ending/results**, followed by the guided first chain and five-type tuning. Then playtest with Arianna before adding buddy skills and goals. Developer studio's deterministic chains, power injection, timer presets, practice protection and diagnostics now make those iterations quick to compare.
