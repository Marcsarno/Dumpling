# Arianna UI redesign — design proposal

September 26, 2026. Planning only; no gameplay or production UI changes.

## Design thesis

Make Arianna feel like a carefully art-directed cozy adventure. The world and character carry the personality; the interface provides a quiet, legible layer of tools. Keep warmth, rounded forms, and playful rewards, but give every visible element a reason to be on screen now.

## Audit and evidence

Reviewed the current source in index.html, src/ui, GameLoop.ts, and HouseNavigation.ts, alongside the September 26 phone play, phone journal, and shop captures in artifacts/daily-play. Also inspected the live local desktop home HUD and collection at http://127.0.0.1:5191/?preview=outdoors after loading completed. This was a focused UI inspection, not a new end-to-end playthrough or physical-phone test. Older captures are not used as proof of current behavior.

| Finding | Player impact | Proposed correction |
|---|---|---|
| Large logo, tagline, location headline and subtitle above gameplay | The screen reads like a website header; the world has weak visual priority | Put the logo on the title/pause screen. Keep compact time/location; show a brief arrival title only on transitions |
| Footer plus floating Volume, Pop, journal, jump and action controls | Multiple unrelated destinations compete in the thumb area | One menu, one journal shortcut, movement, jump and contextual action; remove the footer |
| Shop capture has two Pop entrances and duplicate wallet values | Repeated information consumes space and blurs hierarchy | One persistent wallet; keep the global Pop route inside the menu, with a contextual shop entry only where useful |
| Phone guidance runs behind the journal button; action circle contains a paragraph | Instructions are hard to scan while moving | One short contextual verb and one concise prompt; detailed help inside the journal |
| Emoji, flower ornaments, gradients, pills and heavy outlines appear across systems | Features look assembled independently | One illustrated icon family, two surface treatments, three button priorities |
| Journal uses repeated large filled cards and a long introduction | Only part of the five-activity list is visible | Compact five-row overview; expand one activity for hints |
| Collection uses four columns with 8–10px detail text; live desktop panel is narrow and navigation dominates its top | Collectibles and their names feel secondary to dense controls | Larger portraits, three columns on typical phones, two at narrow widths, wider desktop gallery; details on selection |
| DEV button appears in review captures | Debug tooling visually competes with play | Keep it in the review build, hidden by default; verify production build gating before treating it as a shipped defect |

The pastel palette itself is not the root problem. The problems are simultaneous information, inconsistent hierarchy, tiny text, and controls added without shared layout ownership.

## Art direction: a small world, beautifully kept

- Warm porcelain surfaces (#FFF8EF), dark plum text (#352B43), muted lavender (#B6A0D2), sage (#CADBC9), and a restrained apricot reward accent (#EBC08A). These are starting tokens; validate contrast on the final treatments.
- Opaque or nearly opaque text surfaces over the scene. Avoid relying on blur or text shadows for readability. Keep the majority of the world uncovered.
- One rounded humanist sans family with regular, semibold and bold. Evaluate a locally bundled Nunito Sans at the mockup stage. Use 14–16px for ordinary UI, 12px minimum for secondary labels, and 24–32px for major menu titles. Essential actions never use tiny uppercase text.
- Use an 8px spacing rhythm, 12px control corners, 20px panel corners, one subtle shadow, and a limited raised edge on the primary action. Reserve circles for the joystick and jump affordance.
- Replace platform emoji with a cohesive small set of authored SVG game icons. Pair unfamiliar icons with labels; use actual squishy portraits for collectible identity.
- Motion supports response: a short button press, a 160–220ms panel transition, and a brief reward animation. No looping pulses on idle controls. Respect reduced motion and existing audio settings.

## Gameplay HUD

Phone portrait target: 390 × 844 CSS pixels, also designed explicitly for 320px width.

```text
┌────────────────────────────────────┐
│ Day 3 · 7:10 AM       $12   [Menu] │
│ Maple Lane                        │
│ [Today · 2/5]                     │
│                                    │
│                                    │
│          UNOBSTRUCTED WORLD        │
│              & ARIANNA             │
│                                    │
│                                    │
│                         [Jump]     │
│  (movement)          [Wind · 1/3]  │
└────────────────────────────────────┘
```

Values above illustrate layout, not actual saved progress. The sketch is not a final art mockup.

Top left is one two-line status group. Top right holds the wallet and a labeled Menu button. Today is a compact journal shortcut below the status group, not another bottom toolbar. The primary action remains anchored at the lower right; it changes verb without moving. Jump stays a smaller neighboring control whenever valid. Keep both simultaneous when gameplay allows both. Carrying introduces a compact Put down control inside this same reserved action zone.

The joystick retains a generous 112–120px touch area with a quieter visual footprint. On keyboard/mouse, hide touch controls after detecting actual keyboard/mouse use and show concise action key hints. Restore touch controls immediately on touch input; do not infer input solely from screen size. Do not imply new controller support in this pass.

When nothing is interactable, use a subdued stable action affordance with “Move closer”; no large paragraph. A nearby target gets one short label and a subtle target cue. First-use instructions disappear after successful interaction and remain available from Help. Do not add navigation maps, new quests or new travel rules just to fill empty space.

## Screen and feature plan

| Surface | Proposed design and behavior |
|---|---|
| Menu | One consistent panel: Resume, Today, Collection, Squishy Pop, Activities, Settings. Activities contains the existing cleanup modes, Lilah Tornado and Explore. Credits and help live under Settings. Preserve current feature availability and explain disabled actions |
| Daily journal | Five compact rows with a small illustration, activity name, completion state and short location. Select a row to expand its hint. Retain open play order and replay behavior. Pin title and close control; scroll only the content |
| Cleanup | Show only the current task and a compact completed count. Full task list moves into the journal/activities panel. Timed modes alone show a prominent countdown, with shape/text urgency cues |
| Collection | Give portraits most of the space. Three columns on a normal phone, two at 320px, more on desktop. Show name and copy count; reveal rarity and commands in a selected-item view. Keep favorites, locks, unopened boxes and ticket prizes. Use simple filters only where they help find items |
| Shops | Keep wallet and relevant bag capacity visible. One browsing/purchase surface with portrait, price, owned count and a clear primary action. Maintain existing stock, prices, purchase guards, and travel actions; reorganize their presentation |
| Trading | Clearly separate “You give” and “You receive.” Keep both visible above the final trade action. Use the same portrait tiles as Collection; retain last-copy/favorite/locked protections and existing confirmation rules |
| Squishy Pop | Retain its more energetic identity inside the shared menu shell. During play prioritize the board, timer and objective/score; tickets and explanatory prose recede. Preserve all levels, awards and pause behavior |
| Box reveal / rewards | Let the existing reveal art and animation lead. Hide unrelated HUD during the reveal. Show name and rarity, then clear Keep/Continue or existing next action. No new reward or economy behavior |
| Settings | Consistent Sound, Display/Accessibility and Help sections. Preserve music/effects settings. Put technical readouts in a collapsed diagnostic area. Never offer lower-quality Arianna or reduced rendering resolution |
| Loading / failure / transitions | One restrained visual language with readable status and recovery actions where supported. Arrival titles appear briefly, then yield to the world |

## Interaction and layout requirements

- One modal owner: the world cannot receive movement or action inputs through an open panel. Clear held controls on opening, closing, blur and visibility changes; restore focus to the invoking control.
- Preserve current timer, simulation and pause semantics. Any proposal to pause world time more broadly is a separate gameplay decision. Menu screens must disclose continuing timed play where relevant and obey existing entry guards.
- Panel close/back stays in the same place; Escape closes the top layer appropriately. Use focus containment, accessible names, visible focus and existing live announcements without announcing every frame.
- Minimum 48 × 48px touch targets for primary navigation and actions, with at least 8px between competing targets. Reserve device safe areas.
- Regular text contrast target 4.5:1; large text and meaningful UI boundaries target 3:1. Do not encode rarity, locked state, completion or urgency through color alone.
- Keep the central 60% of the screen width and middle gameplay band free of persistent panels. Target at least 70% of total screen area unobscured during ordinary exploration, measured from real screenshots; do not achieve this by making text tiny.
- On desktop, use the same information hierarchy with bounded panels. On short landscape phones, use side regions and short controls rather than piling rows at the top and bottom. Dialogs must keep their close and primary actions reachable at enlarged text sizes.

## Implementation order

1. **Art and layout proof.** Produce polished phone exploration, journal, collection and desktop shop mockups using actual world captures. Review beside the existing screens. Confirm the typography, icons, surfaces and action-zone geometry before broad implementation.
2. **Shared HUD and menu slice.** Introduce tokens, a HUD layout owner, reusable buttons/panels, and explicit input-mode handling. Move branding/footer content and duplicate shortcuts into the menu. Connect existing callbacks rather than rewriting gameplay. Review a playable local indoor/outdoor slice.
3. **Journal, collection and shop slice.** Migrate the three highest-use panels to shared primitives. Preserve DOM hooks temporarily where gameplay depends on them; replace them deliberately at component boundaries. Validate the complete earn → shop → reveal → collection flow.
4. **Trading, arcade and polish.** Apply shared navigation, typography and feedback conventions while retaining specialist layouts. Finish tutorial copy, failure states, settings, landscape layouts and motion.
5. **Local acceptance.** Show actual game captures and a playable preview. Deploy only after review and explicit authorization for this redesign; the prior daily-play approval covers a different change.

Code ownership: index.html currently provides the shell, src/ui/styles.css and scene styles provide overlapping presentation, and GameLoop.ts plus individual game systems append extra controls. Consolidate presentation gradually into src/ui components instead of adding another final block of CSS overrides. Keep economy, saves, world logic and character animation in their existing owners.

## Acceptance and regression checks

- Capture home, outdoors, carrying, fishing, shop, journal, collection, trade, Pop, reveal and settings at 320×568, 390×844, 844×390 and desktop 1440×900; review large text and safe-area variants.
- No overlapping controls, duplicate wallet/Pop readouts, unreadable labels, inaccessible close buttons or world input through panels. Simultaneous movement/action/jump remains reliable on touch.
- All existing destinations remain discoverable. Test disabled/busy states, empty collection, full bag, insufficient funds, locked/favorite/last-copy items, partially completed day, save failure and reloading.
- Run TypeScript and scripts/verify-arianna-quality.mjs plus appropriate existing gameplay regressions when implementation happens. Review full motions in actual captures if input/UI work affects action timing.
- Compare frame time and memory at the same scene, device and native resolution. Any UI optimization must preserve Arianna's original mesh, rig, weights, materials, 2048×2048 maps and native display resolution. No additional full-screen post-processing for menu decoration.
- Physical phone usability and performance remain separate from desktop phone emulation.

## First milestone

A complete local exploration HUD and menu, with the redesigned journal, is the first reviewable milestone. Success means the player immediately understands where she is, what she can do nearby, and where to find her collection, while Arianna and the world become the dominant visual experience.
