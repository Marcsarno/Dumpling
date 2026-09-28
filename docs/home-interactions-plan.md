# Arianna: a house you can actually play in

Implementation handoff — September 26, 2026.

This document is a plan, not a claim that these features exist. The user asked for all 15 former activities to be reworked, substantial home play, eating Dad's pizza, and eating in the cafeteria. Build the complete scope in the phases below. The shipped school-gate scene is a starting point, not completion of this request.

## Start here in the new chat

Read this file, `AGENTS.md`, and the current Git status. Implement the home-play and meals expansion described here, including all 15 reworked activities, Dad's dinner, cafeteria lunch, and the additional house toys. Work through the phases, testing actual touch play and inspecting complete animations. Keep an implementation ledger in this document so every item is clearly planned, implemented, verified, or deferred with a reason. Do not stop after another single demonstration scene and call the entire update complete. Preserve concurrent work, existing saves, character quality, and authored rooms. Show the completed local result before any new deployment; the earlier deployment authorization covered the school-gate release only.

## What the code currently does

Verified against the project at the time this plan was written; recheck before editing because other work is in progress.

- The school-gate release was introduced in commit `892f94c`, with the Poppy/ball/wall/leaves scene outside the school. `SchoolGatePlay.ts` and `SchoolBallPhysics.ts` implement that scene. By the end of this planning session, local HEAD had advanced to `c787d09` (adventure HUD, journal, menu, and collection redesign). Start from the current project, not from the older gate commit. Verify live release metadata separately if needed.
- `src/data/dailyPlay.ts` lists the exact 15 old activities. `DailyPlay.ts` and its assets still exist, but `GameLoop.ts` calls it inactive. `Neighborhood.ts` no longer builds the sidewalk pads. Do not restore the five-random-stations journal or its layout.
- `FamilyDinner.ts` already makes Dad fetch and serve a meal, sit briefly, and leave it on the dining table. It cycles pizza, taco, and turkey by day. `dinnerServed` is saved, but there is no player portion/eating system for this dinner. Its present visual refresh will need to respect remaining portions instead of restoring the complete meal.
- Breakfast already has taking, cooking, carrying, serving, and eating steps in `DailyLife.ts`. Extend compatible interactions; do not break breakfast or introduce a competing clock.
- `recess.ts` loads the existing classroom and cafeteria, cook, and lunch friends. Its exposed interaction seats are classroom trading positions, not ready-made player lunch seats. Derive lunch seats from the actual cafeteria furniture and collision layout.
- House rooms already exist: bedroom, landing, bathroom, living room, kitchen/dining, utility room, Lilah's room, and Dad's room. Use them. `houseProps.ts` already has a toy basket, cushion, dishes, sink, towel, and household pickup/placement chores. `SquishPlay.ts` already supplies squishy deformation behavior.
- UI/Lilah-quality work was in progress during the initial inspection and was committed in `c787d09` while this plan was being written. This includes `AdventureHUD.ts`, UI plans, character assets, build scripts, and quality checks. Preserve it and inspect for any further local changes before implementation. Do not reset the tree, rebuild from an older commit, or overwrite those files from a stale copy.
- The older UI proposal discusses a five-item daily-play journal. That portion conflicts with this newer request. Do not resurrect activity quotas to accommodate the UI. Reuse the current HUD's action area for contextual verbs instead.

## What should feel different

The child should think, “What happens if I put this here?” A room should invite action before a label explains it. Objects have homes, uses, and consequences. Family members notice a few meaningful things. The child chooses when to stop.

One example afternoon: Arianna takes Teddy from the toy basket, seats him on a cushion, stacks cups for his party, and accidentally rolls a ball through them. Lilah laughs and brings a cup back. Dad sets out pizza. Arianna leaves the toys, carries a plate to an empty dining chair, takes a few bites, and returns later to find her party still there. None of those moments requires a numbered marker, a completion screen, or a forced sequence.

This is a design hypothesis, not proof of what this particular child will enjoy. The strongest evidence will be whether she repeats and combines actions without an adult coaching her.

### Rules for every interaction

1. Give it a believable home: basket, shelf, cupboard, table, garden bed, or school counter. Never an isolated activity platform.
2. Make the first touch useful. A ball moves, a cushion shifts, a wheel turns, a serving leaves the platter. Avoid an unresponsive animation followed by a delayed result.
3. Offer at least two sensible outcomes. A ball can rebound, miss, topple cups, or be passed. A meal can be partly eaten and left. Do not fake choice by playing the same success movie from every position.
4. Allow stopping, leaving, and returning. Persist meaningful arrangements; do not reset an entire room when the camera crosses a doorway.
5. Put humor in physical and social reactions. A wobbling stack, a duck bumping a slipper, or Dad waiting for a wagon is stronger than a success caption.
6. Make recovery easy. Retrieve and reuse objects, right a fallen toy, clear a jam, leave a chair. No unrecoverable ball under a mesh or character trapped at a table.
7. Do not turn free play into required cleanup, hunger management, currency farming, or a condition for school/bedtime. Existing chores keep their existing rules.
8. Do not cover the scene with instructions. One current verb, a clear selected-object cue, and occasional short dialogue are enough. Audio reinforces visible feedback; sound and reading are not prerequisites.

## Room composition and object relationships

| Place | How it should read | Main objects and connections |
|---|---|---|
| Living room | A family room with toys that can come out | Existing toy basket; soft ball; nesting cups; beanbags; Teddy; a few blocks; small car; movable play cushions. The floor/rug is open play space, not a painted arena. Keep the front door, kitchen route, dog bowl, and Dad's chair reachable. |
| Bedroom | Arianna's own small creations | Paper and crayons on a usable surface, plane, picture book, dress-up accessories, window pinwheel. Papers and toys can travel into the living room. Keep bed/outfit/book chores accessible. |
| Kitchen/dining | Food being served and people sharing a table | Dad's existing platter, reachable plates, actual available chairs, child portion, cup, sink/return spot. Real food and pretend toy food are visually distinct. |
| Utility/bathroom | Small contained water play and ordinary household tools | A stored shallow toy basin that can be placed at a reachable water-play spot; boat and rubber duck; watering-can refill at an existing sink. Do not invent a bathtub or relocate the vanity without inspecting the authored room. |
| Lilah's room | A place to visit a sibling | One wind-up toy and a soft toy invitation. Respect Lilah's current state, sleep, pathing, and existing interactions. |
| House garden/doorstep | Things naturally affected by air and water | Existing planted areas and tree; watering can, flowers, pinwheel, bubbles, loose leaves, a small garden ornament, a shallow puddle. Use the real garden route, not 15 replacement stations outside another door. |
| Cafeteria | A recognizable lunch routine with friends | Existing serving counter/cook, tray, a small food choice, reachable vacant seats, table surface, and tray return. The classroom door and trading remain independent. |

Inspect the rendered layout before placing anything. The coordinates in `HOUSE_ROOMS` are room bounds, not permission to put toys through furniture. Use the project's prop transforms, especially `PropSpace.ts`, and the current collision data. On a phone the player, manipulated object, and reaction must fit in view together.

## All 15 original activities, reworked

The original IDs below are an accounting tool for development only. Never display this table as a player checklist. Each entry specifies a home, player choice, consequence, and repeat/recovery behavior.

### 1. `goal` — the family ball

Keep the real Poppy ball outside school. At home, a visually distinct soft ball belongs in the living-room basket and can be carried to the garden. It uses the same principles for kicking, nudging, receiving, and wall contact. Two small movable garden goal markers are stored beside the house; the child can set their spacing or simply ignore them. Crossing between them gives a net/marker reaction, not a mandatory score panel. Indoors the soft ball can topple cups or knock a block bridge. It should roll more gently on a rug than on paving where the real surfaces support that distinction. Reset the markers by picking them up; retrieve the ball physically. No invisible magnet pulls every kick toward a goal.

### 2. `bowling` — cups from the toy basket

Use a small set of chunky nesting cups, rather than a permanent bowling lane. The child can set them in a row, a cluster, or a stack using forgiving placement. Rolling the soft ball produces different contacts and toppled cups. Lilah may copy one placement or clap at a large tumble; she must not immediately rebuild the child's arrangement. Individual cups can be righted or returned to the basket. The same cups become Teddy's drinks, tower pieces, and wagon cargo. This sharing of objects is essential to the redesign.

### 3. `cans` — a beanbag and a wobbling tower

Retire the roadside can stall. Use a beanbag and the same cups or a few lightweight toy tins from a pretend-kitchen box. Let the child build on a low stable surface or open floor, then toss from where she stands. A glancing hit leaves a leaning stack; a direct hit scatters it. A miss stays where it lands and can be picked up. Provide modest aim assistance only for the visibly selected stack. No automatic perfect arc independent of distance or intervening furniture. The beanbag can also land in a basket or Teddy's lap.

### 4. `cart` — a wagon with a purpose

A small toy wagon is stored near the living-room basket/entry wall. Push or pull it with ordinary movement; release it at any time. It carries a limited number of compatible toys—Teddy, cups, blocks, or the duck—with visible occupied space. The child invents a delivery destination: Lilah, the sofa picnic, or the garden. No yellow destination square. Wheels turn with travel; toys gently jostle and remain attached unless deliberately unloaded. A blocked wagon stops or turns, and can be backed out. Family members yield. It cannot lodge across a required doorway or teleport cargo through walls.

### 5. `boat` — a little voyage in a basin

Keep the boat with the water toys in the utility area. Place a shallow basin at a reachable, collision-checked household spot and add water through one short visible action. Carry the paper boat over and set it afloat. Blow or nudge the water from different sides: direction changes the boat's route, and it bumps the basin wall or the duck. It is not a five-second canned circuit. A small toy passenger can sit on it if placement reads clearly. Lift the boat out to replay; emptying the basin gathers its toys onto the nearby towel instead of deleting them. No flooding simulation or new bathroom room is required.

### 6. `duck` — a wind-up visitor

A wind-up duck belongs on Lilah's low toy shelf or beside the family toy basket. One brief winding action makes it waddle; additional winding adds travel time up to a small cap, with an immediate spring/key response. Place it facing a chosen direction. It can weave around cups, bump a slipper, or lead Lilah a short distance when she is awake and available. Obstacles change the outcome; they do not disappear during a scripted parade. Pick it up, turn it, and wind again. In the basin the same toy floats with its motor stopped. Do not spawn a crowd of ducks merely to play a reward animation.

### 7. `bubbles` — take the bottle to the doorstep

The bottle and wand live together on a reachable household shelf. Pick them up and blow a small varied stream near the doorway or in the garden. Walking changes where bubbles begin; motion and a gentle breeze change drift. Bubbles pop on hands, nearby surfaces, and the child moving through them. Sunny may watch or snap at one within his existing reachable area, with a cooldown. The player can hand Lilah a turn when she is receptive. Repeated presses feel different through positions and timing, not a hidden completion count. Cap active bubbles and pop/release them when their scene unloads.

### 8. `flower` — water the plant that lives here

Use an existing garden flower bed, or one small pot beside the real household window/door. Store its watering can nearby and refill it at an existing sink. Pouring visibly changes the plant and soil; a droopy stem rises and sheds a few droplets. A whimsical sneeze can be a rare reaction to a generous pour, not the required ending every time. An extra pour produces a small puddle at the pot's base, connecting naturally to water play. The plant does not instantly wilt when the child turns away. No mandatory gardening chore or new health meter. Keep the daily state simple and forgiving.

### 9. `pinwheel` — something to carry in the breeze

Keep a pinwheel in the bedroom window pot or garden planter. Blow once to start it, carry it while walking/running to change its speed, and place it back in a compatible pot. It coasts down visibly when air/movement stops. The player can compare walking, standing, and running; no “blow three times” requirement. The same short blow input can move the basin boat. A curtain flutter is optional polish only after the pinwheel itself responds correctly; do not build a whole wind engine for it.

### 10. `jack` — a surprise you can share

A small jack-in-the-box sits on the toy shelf and can be carried to the rug or Lilah. Turning the handle produces audible/visible incremental progress immediately. The spring releases after accumulated winding, then settles with believable motion. The child can stop just before the surprise, move the box, or let a sibling take the last turn. Lilah's reaction depends on distance and whether she is watching. Close the lid with a gentle hand action to replay. Do not turn it into a fixed three-tap task or a jump scare with a camera cut.

### 11. `puddles` — water where water belongs

Put a shallow persistent puddle by the garden watering area or existing doorstep drain; do not build four piano pads in a row. Walking, running, and jumping make different ripples and splash sizes. Moving through it can leave a few fading wet footprints on nearby paving. The watering can can make it slightly larger, within fixed bounds. Sound varies by depth/speed; a child may discover a rhythm without being told to complete a tune. It never floods the house, blocks travel, creates a required cleaning task, or becomes a slippery loss-of-control mechanic. It fades between days or after a reasonable unattended interval.

### 12. `leaves` — keep the successful shared system

Preserve the shipped school tree leaves and add a restrained patch under an actual tree in the house garden where space permits. Walking, the ball, and jumping all disturb the same leaves. A small hand rake, stored with garden things, can gather them into a pile for another jump; allow a simple directional gather action rather than demanding precise individual-leaf placement. A partly hidden ordinary toy may become visible when leaves move, but never require a collectible reward to make jumping worthwhile. Re-gather or let a slow unattended breeze settle them. Do not instantly reset in front of the player.

### 13. `plane` — paper that can leave the desk

Start with paper on Arianna's bedroom surface. One short folding action makes a plane; choose among a few drawn colors/marks with a small in-world choice, not an elaborate editor. Carry and throw it from a chosen position. A gentle toss and a stronger throw have noticeably different travel, with a bounded arc, collisions, and a retrievable landing. A basket, cushion fort entrance, or open doorway becomes a self-chosen target. No compulsory floating hoops. Dad may notice a plane landing near his chair and place it within reach after a delay; never snatch one mid-flight. Reuse the same plane or refold paper on the desk.

### 14. `flamingo` — dress-up reaches the garden

The original flamingo becomes a small garden ornament beside a planter, not a standalone attraction. A soft dress-up hat lives with the bedroom toys and can fit the ornament, Teddy, or a compatible doll. Put it on, take it off, and carry it elsewhere. The ornament gently wobbles from placement or a ball tap; a crooked hat responds to the motion. The funny result is visible. Use original accessory geometry and attachment sockets; do not edit character heads/rigs to force a fit. Finish without a reward banner. If the real garden cannot accommodate a flamingo, use a shelf-sized version of the same toy and record the layout reason; do not quietly omit this item.

### 15. `picnic` — Teddy's movable tea party

Teddy belongs in the basket and can be carried, seated on the sofa or a cushion, put in the wagon, and tucked into a small toy bed. Toy plates, cups, and a few clearly pretend foods live in one little picnic box. The player decides where the party is and how many guests to seat. Offering a pretend bite tilts Teddy and makes a quiet satisfied reaction; choosing a different food changes the small gesture. Lilah may bring her own toy or accept a pretend cup. This is not “deliver three treats to three fixed plates.” The arrangement stays when the player goes to eat real dinner and comes back.

## Dad's pizza and family dinner — required, not decorative

### Player sequence

1. Dad uses his existing meal routine and calls the family when he actually places the platter. The meal remains on the existing dining table. Keep the current pizza/taco/turkey rotation and make all three edible; verify pizza specifically on its scheduled day.
2. Approach the served meal to take a portion onto a plate. A slice visibly leaves the pizza. The held plate carries that exact portion, not a second independent food model.
3. Bring the plate to an available dining place. The plate and chair are separate choices: set it down, sit, or leave it there. A reachable-seat cue should be subtle. Dad's occupied chair must not accept Arianna.
4. While seated, choose **Eat**. Each press performs one short bite: hand/food reaches the mouth, chewing follows, and the slice changes through a few clear bitten states. The player controls pacing and can stop with food remaining. No four-second hold bar that deletes a whole pizza.
5. A cup offers a short drink action. Dad may glance over, lift his cup, or say one short line when the child joins him. He does not repeat the same praise on every bite.
6. Stand up at any point using a clearly available exit action. Leave a partly eaten plate at the table, pick it up, take another available portion, or carry the empty plate to the existing sink. Returning dishes is optional free play and does not duplicate an allowance/chores reward.

### Physical and save requirements

- Use a finite, visible set of portions—e.g. six pizza slices—and appropriate portion geometry for taco/turkey. Inspect the current food GLBs before deciding whether to separate authored pieces or make matching serving/bite variants. No floating generic cubes pretending to be bites.
- Model world, held, table, and consumed portions with stable identities. Double tapping, reload, changing rooms, and cancelling an animation cannot duplicate or erase a claimed slice. Commit a bite at visual mouth contact, and persist the resulting state atomically.
- `dinnerServed` means Dad served the meal, not that every portion still exists. Save remaining portions and any player plate separately; reload must not recreate a whole pizza beside the partly eaten slice. Migrate older served dinners sensibly without resetting the day.
- Reserve a chair during approach/sitting. Use reachable approach and exit positions, align hips/feet/plate/hands to the actual furniture, and handle occupied routes. The table cannot cut through Arianna's torso. Dad must not sit through her or take her claimed serving.
- Cancel before contact without consuming food. Leaving a room while carrying a plate uses the same item ownership rules as other carryables. Switching to a chore cannot silently discard dinner.
- Do not require dinner for bedtime, charge for it, add hunger/weight rules, or let repeated eating produce money. A finished meal may stay as an empty platter until the next normal reset.

## Cafeteria lunch — a playable social place

1. Enter through the existing classroom-to-cafeteria doorway. The existing cook offers a tray at the real counter. Starting lunch does not replace trading, end school, or open a separate minigame screen.
2. Let the child choose a main from two visible options and a fruit/drink from a small set. Keep choices tactile and quick. The cook's serving motion should place the chosen food onto the tray; it must not materialize during an unrelated idle animation.
3. Carry the tray to a reachable vacant place at an existing table. Provide at least two viable seating choices when the layout supports them, so sitting near a friend is a real choice. Identify NPC seats and reserve player seats; do not repurpose classroom trader anchors as lunch chairs.
4. Set down, sit, eat individual bites, and drink using the family meal primitives. Friends briefly notice arrival or react to an offered conversational gesture; they don't need a full dialogue tree. The child can eat slowly, leave food, or get up early.
5. Return the tray to a plausible rack/bin at the serving area. If no rack exists, add one compact rack against that area's existing wall with an unobstructed approach. No glowing checkpoint. Food/tray state remains consistent on leaving and returning to the cafeteria.

Lunch is optional and free. No mandatory nutrition quiz, timer, hunger failure, trading reward, or allowance. Use one active tray per player with explicit replace/return behavior; do not spawn unlimited trays. A second serving is possible after finishing or returning the first, without reward farming. Save an unfinished lunch within the current school day and clear it at the next day boundary. Use the existing school clock semantics, not a second time system.

## Additional home toys and small interactions

These are part of the requested house expansion, not a list of stretch ideas to substitute for the 15. Keep the object count restrained by sharing pieces.

| Addition | Actual play and why it belongs | Connections and recovery |
|---|---|---|
| Chunky wooden blocks | A small bin beside the basket; pick, rotate coarsely, and place with forgiving surface/stack snapping. Build low towers, a bridge, or a garage. Different arrangements topple differently. | Ball and beanbag can knock them down; car goes through the bridge; wagon carries them. Avoid a new building-editor screen. Return individual pieces or gather the set at its bin. |
| Small car and two ramp pieces | Push the car by hand or release it from a placed low ramp. It travels according to slope and stops at real obstacles. | Blocks support the ramp, a cup becomes a finish marker, a cushion creates a soft stop. Reset by carrying it back. No preprogrammed lap around an invisible track. |
| Cushion den | Two designated play cushions and one blanket stored near the sofa. Place cushions in a few stable configurations; drape the blanket when supports fit. | Teddy can sit inside; plane can fly through a broad opening; peekaboo with Lilah only when pathing/visibility support it. The child can sit beside or enter a generous supported opening with the existing rig; no invented crawling animation that deforms Arianna. Never borrow a cushion currently owned by a required chore. |
| Crayons and paper | On a reachable bedroom surface, choose a color and a simple short mark/stamp; repeated actions build a small picture. The paper is then a carryable object. | Put it on a small display board or fold it into a marked plane. Keep the picture through a room change/reload. Do not require freehand precision or turn it into a modal drawing app. |
| Picture book with company | Take a book from the existing shelf; sit on a permitted chair/cushion or stand and turn illustrated pages. | Seat Teddy nearby; Lilah may join when awake. Reading remains optional outside the existing bedtime task. Never grant bedtime credit repeatedly for arbitrary page turns. |
| Pretend tea pouring | The picnic box contains a small pitcher and shares its cups with bowling. Tip it toward a selected cup and show a short pretend stream/fill response. | Offer a cup to Teddy or Lilah; a misplaced pour creates one small recoverable pretend spill effect. No endless new cleaning debt or separate tea minigame. |
| Sunny fetch at home | Use a designated soft fetch toy from the basket in a clear living/garden area. Throw; Sunny tracks, reaches, picks up, and returns it when available. | He drops it within reach rather than at the exact same canned coordinate. Do not feed him pizza or overwrite feeding/pet-care state. Pause fetch during incompatible existing dog behavior, and recover a blocked toy without a forced chase. |
| Sibling hide-and-find | Put Teddy or the duck behind an open cushion or inside the toy wagon, then invite an awake Lilah to find it within a small nearby area. She visibly looks and walks to an accessible object. | This reuses toys, the den, and wagon; it is not an independent hunt board. No timer, failure state, or spawning the toy at another location. She returns it or leaves it where found. |

Do not add an instrument, trampoline, arcade cabinet, whole playroom, or shop purchase system merely to increase the count. A few objects with several useful relationships will make the existing house richer than a room full of single-use buttons.

## Controls and behavior implementation

Use the existing movement, Action, Jump, carrying, camera, and current HUD layout. Keyboard and touch must expose the same choices. A context-sensitive short secondary action is acceptable, but place it in the HUD's reserved control area; do not add another independently positioned stack of buttons.

- Target selection must be stable. Give a visible cue to the selected object and resolve conflicts among a cup, nearby ball, NPC, and chair. A player should not start a chore when trying to pick up a toy at the same spot.
- Pick/place should support world surfaces and small containers, with generous preview snapping. The chosen position must remain the result; avoid hauling everything to a fixed station anchor first.
- Preserve a single authoritative carrying state. Adapt the existing cleanup carry/actions rather than allowing two systems to put different objects in the same hands. A plate may contain food; a wagon may contain toys; those contents cannot also be independently held.
- Reuse proven ball stepping and collision concepts where appropriate. Physics should be sufficient for the visible interaction, bounded for mobile, and consistent across frame rates. Do not add a heavyweight universal physics rewrite as a prerequisite.
- Reactions are distance-, visibility-, availability-, and cooldown-aware. NPCs pause/yield around the child, don't instantly undo play, and don't cross walls to join. Every retrieval or movement state needs a reachable fallback and cancellation path.
- Keep interactions responsive while action animations play. Lock movement only for the portion that needs it; give reliable cancellation/standing-up. Review the full motion, not only a flattering contact frame.
- Prefer settled objects sleeping until disturbed; cap active debris/bubbles/wet prints. Unload inactive room/scene assets and owned skeleton textures. Recheck the model lifecycle used in `SchoolGatePlay.ts`; an earlier render-instantiation path leaked a skin texture on each visit.
- Persist toy ownership and meaningful arrangement, consumed portions, and active meal state. Do not save every leaf or physics frame. Restore only validated placements on allowed surfaces; recover invalid/out-of-bounds objects to their named home. Keep established `arianna.*` data and old daily-play progress intact.
- Optional toy mess stays separate from mandatory chores. Dad's cleanup must not silently erase an active build or award the child chore money. When the player asks a basket/bin to gather its toys, show a brief tidy response and restore that set, without resetting unrelated play.

Avoid building a generalized framework for hypothetical future features. Extract shared carry/container/seat/meal behavior only where these concrete features need it. Keep the 15-ID audit separate from the physical object model; cups are one reusable set, not three duplicated sets for bowling, throwing, and picnic.

## Implementation order and completion gates

Each phase should end in a working local scene and evidence. These are development checkpoints, not reasons to ask the user to reauthorize each phase. Continue through the full requested scope unless an actual blocker requires input.

| Phase | Deliverable | Evidence required before expanding |
|---|---|---|
| 0. Inspect and preserve | Read live/local differences, current HUD work, room art/collisions, carry/animation/save ownership. Record which exact furniture surfaces and seats are usable. | Current Git status recorded; no concurrent changes lost; screenshots of intended play/meal areas and their access paths. |
| 1. Shared home play | Ball, cups, beanbag, Teddy, picnic pieces; pickup/place/container behavior. Covers `goal`, `bowling`, `cans`, and `picnic`. | One continuous touch session takes objects from basket, builds, knocks down, rearranges, leaves the room, returns, and tidies. No activity pads or success screen. |
| 2. Eat Dad's dinner | Claimable portions, seated bites/drinking, partial plates, leave/return, optional sink return; preserve all three menu types. | Actual pizza slice separates and reaches mouth. Full sit/eat/stand motion from front/side. Reload halfway through eating preserves both platter and plate. Dad and Arianna do not share a chair. |
| 3. Movable toys and making | Wagon, wind-up duck, jack-in-the-box, plane, dress-up ornament; blocks, car/ramps, picture making, book, den, sibling play, fetch. | At least three combinations work using shared objects; doorways and family routines remain usable; unfinished arrangements persist. |
| 4. Water and garden | Basin boat, bubbles, flower/can, pinwheel, puddle, garden leaves/rake. Complete remaining IDs and retain school-gate play. | Objects stay within their physical spaces; actual motion changes outcomes; leave/reenter without leaks or reset exploits. |
| 5. Cafeteria lunch | Cook/tray choice, two reachable seating options where supported, bites/drink, partial meal, tray return. | Walk classroom to lunch, eat near a friend, leave early, return, and resume trading. No duplicate trays/food or blocked school exit. |
| 6. Polish and full audit | All 15 IDs accounted for, eight extra home additions, both meal contexts; finish art, sound, target selection, and persistence. | The acceptance checks below pass. Report any omissions explicitly. No “all done” based on a single polished corner. |

If a phase exposes a design that isn't enjoyable or legible, revise the interaction, not just its label or particle effect. For example, if the wagon feels pointless, connect it to transporting the child's party; do not add a delivery quota. If picking up cups is fiddly, improve targeting and placement; do not auto-complete the tower.

## Verification and child playtest

### Technical and visible acceptance

- Maintain a row for each original ID, each extra toy addition, Dad's meal, and cafeteria lunch: location, implemented behavior, actual verification evidence, and outstanding issue. Initially all planned items are **not implemented**, except the existing school-gate ball/leaves behavior, which is **existing, reuse required**.
- Type-check, appropriate behavior tests, and both current character-quality guards pass. Never reduce Arianna or Lilah textures, geometry, rigs, or native display resolution to fit the new toys.
- Automated input tests cover carrying ownership, containers, seat reservation/release, eating cancellation/contact, duplicate input, save failures, reload, day changes, and room unload/reload. Focus tests on real failure modes rather than checking that a label exists.
- Test 390×844 touch, a narrow 320px layout, and desktop. Essential controls do not collide or cover the manipulated object. A screenshot and a short actual-input motion sequence are needed for both meal contexts and representative toy combinations.
- Examine complete pickup, carry, place, throw, seated eating, drinking, sitting, standing, and NPC motions from front and side. Watch hand/food/mouth contact, table clipping, foot sliding, floating plates, and jacket deformation.
- Test a used save with dinner already served, old activity progress, collection, currency, and unfinished chores. No reset, lost purchases, duplicated portions, or changed bedtime/allowance rules.
- Revisit house, garden, classroom/cafeteria, and school gate several times. Compare assets, texture memory, active updates, and errors after settling. Hidden scenes must not retain every toy's simulation or accumulate skeleton textures.
- Recheck school entrance, shops, fishing, breakfast, pet care, Dad/Lilah routines, bed access, and the existing collectible/trading flows after integration. Preserve unrelated UI work.
- Physical-phone comfort/performance and the child's enjoyment remain unverified until actually observed. Never label an emulator test a physical-device test.

### What to watch with the child

Begin in the ordinary home, without opening a feature checklist. Give her time to notice something. An adult can offer “You can try things” once, then watch rather than narrating each intended activity.

Watch whether she identifies a toy, predicts an action, laughs at or examines a consequence, repeats it with a change, carries something to a different place, and returns voluntarily. Notice where she repeatedly taps, loses an object, cannot see a reaction, or waits without understanding why. Use these observations to refine the controls and behavior. They are not a scored assessment of the child.

The desired memorable moments are player-authored: “I put Teddy in the wagon and brought him to my fort,” “I ate pizza beside Dad and left a slice for later,” or “My car knocked over the cups.” These are intended possibilities, not guarantees of a favorite moment.

## Handoff reporting and release boundary

The next implementation chat should report completed features by location, with the 15-ID audit available for completeness. Distinguish built, tested locally, tested on a physical phone, and deployed. Keep a concise list of real remaining issues and links to local evidence.

No new deployment is authorized by this planning request. Finish and show local results first. Ask for deployment only when a concrete reviewed build exists, unless the user explicitly authorizes it in the new chat. Do not treat the September 26 school-gate push/deploy instruction as blanket permission for this larger expansion.

## Implementation ledger — local work, September 26–27

### Deployment goal — September 27, current verification

The user requested deployment and subsequently resumed it after a pause. The current release candidate preserves local HUD commit c787d09 and the original character assets. The candidate build is being checked locally before publishing; live deployment metadata will be verified after the push.

Meal shoulders and upper arms remain in the original authored carry pose; only the forearms bend toward the early breakfast hand positions and the head nods toward the food. The original EatSit breakfast track remains unchanged. The mesh, rig, skin weights, materials, textures and display resolution are untouched. Three small child cushions correct seated meal height. Plate pickup and placement use the existing action clips and transfer at their contact events.

Current actual-input evidence under artifacts/home-play:

- combinations-input.json: shared cup stacking, Teddy/wagon travel, marked-paper folding/throw/recovery, basin direction and towel recovery, wind-up duck, jack reset, reload persistence.
- garden-input.json: hat through the house exit, sink/can/plant/puddle, pinwheel, bounded bubbles, rake/jump, cushion den, car/ramp, tea, book and 320px controls.
- social-input.json: Sunny retrieves the same toy without feeding-state changes; Lilah finds Teddy in the wagon and shares/returns the bubble bottle.
- contacts-input.json: direct and glancing cup contacts, block knockdown, placed-marker response, falling beanbag knockdown. Vertical impact now contributes to a landing, and weaker subsequent contacts do not right a toppled piece.
- lunch-input.json: real 390px touch-joystick classroom/counter route, sandwich/orange choice, both seats, eating/drinking, partial-tray return, tray rack and trading access.
- food-input.json and foods/: pizza, taco, turkey, sandwich, drink and orange contact captures, front and side. Front/side motion sequences are in motion/frames.json. Captures were inspected for food contact, seat height and coat deformation; the rejected earlier arm poses were removed.
- dinner-input.json: the built Editor release passes bite contact, partial reload, seven remaining portions, cancellation before contact and sink return. The used-save fixture retains currency, collectibles, unopened purchase, reward history, collection protections, old daily-play progress and unfinished chores. Cancellation timing is asserted before mouth contact, with reduced simulation speed to avoid automation latency crossing that boundary.
- release-input.json: actual built-release breakfast eating completes; Dad fetches and serves dinner with eight claimable portions. Optional seating yields to unfinished breakfast, preserving its original animation and chair height.
- lifecycle.json: four school/home cycles settle to identical per-scene counts: school 855 assets, 130 textures, 16 skin textures, 151732500 texture bytes; home 746 assets, 59 textures, 9 skin textures, 147029824 texture bytes. These are development-browser measurements, not phone benchmarks.

TypeScript passes. The 32 targeted state/clock/fishing/trading/bed/school-ball/economy tests pass, including ownership, duplicate contacts, finite menus, failed writes, refill identities, container cycles and day changes. Both original character-quality guards pass in the Editor build. The review camera uses normal navigation framing until seated; close-up controls are restricted to the isolated home-play preview.

Physical-phone comfort/performance and child enjoyment are unverified. NPC tests cover reachable social routes and normal return behavior, not every possible user-built obstruction. Optional refinements such as a curtain flutter or crawling were not added. No new rig or generated character asset was created.

### Animation review failure — September 27

The user rejected the newly generated meal arm poses for stretching Arianna's jacket into the previously forbidden bat-wing shape. The earlier screenshot review wrongly accepted them. Passing ownership, input and quality-hash tests does **not** validate a pose's appearance.

The new `mealSeated`, `mealEating` and `mealDrinking` arm/hip targets were removed. The initial replacement reused breakfast `seated`/`eating` frames and timings, but live inspection found that its peak put hands above the mouth. That initial replacement is superseded by the correction described above. The original `EatSit` track remains unchanged. Do not describe the prior rejected motion captures as approved.

PlayCanvas is running at `http://127.0.0.1:5195/?preview=home-play`. The visible local-only inspector is `http://127.0.0.1:5195/?preview=home-play&motion-review=1`; it plays the actual runtime clips, supports slow playback, exact-frame inspection, and front/side views without changing the character asset. It deliberately pauses game progression. Review must include the unobscured jacket, not only the table view.

Baseline: the only initial untracked file was this plan. No existing changes were reset. The character assets, texture settings, quality guards, saved collection, currency, daily clock, old activity progress and HUD files are preserved. Local preview uses `?preview=home-play` and `dumpling.homePlayReview.*`, separate from production saves. Release status is recorded above.

Phase 0 captures: `artifacts/home-play/before-{living,dining,utility,bedroom,garden}.png`, collision snapshot `layout.json`. The dining north chair uses the existing breakfast approach `(0.55,11.9)` and seat `(0.55,12.49)` through `PropSpace`; Dad keeps the south chair. Cafeteria front middle stools use authored table centers `(1.6,-17.5)` and `(7.15,-17.5)`, with approaches at z `-15.65`; NPCs occupy the back stools. The utility basin sits on the floor by the folding counter, not in a fabricated bath. Garden leaves use the tree at `(-8.5,2)`.

Status distinguishes code from observed gameplay. Files under `artifacts/` are local evidence, not release assets.

| Item | Location and implemented behavior | Actual verification |
|---|---|---|
| goal | Basket ball; directed roll/kick, furniture bounce, movable garden markers | Pickup/roll/reload/gather and placed-marker crossing pass |
| bowling | Three shared cups; floor/stack placement and ball contacts | Cup stack, direct tumble and glancing lean pass |
| cans | Carryable beanbag; aimed toss into shared pieces or Teddy's lap | Actual toss and falling-impact knockdown pass |
| cart | Living wagon; four cargo slots, pull/release, wall-aware movement | Teddy loads, travels and persists; capacity/cycle tests pass |
| boat | Utility basin; fill, directional blowing, empty onto towel | Boat movement and towel recovery pass |
| duck | Wind and turn the shared duck; bounded travel; motor stops in basin | Chosen-direction movement and reuse pass |
| bubbles | Carryable bottle; bounded stream and sibling turn | Stream expiry and Lilah sharing/return pass |
| flower | Doorstep pot/can; sink refill, persistent watering and puddle growth | Refill, watering and growth pass |
| pinwheel | Carry, blow, movement-dependent spin and coast | Carry/blow/place input passes |
| jack | Incremental winding, surprise, lid reset and invitation | Winding and reset pass; sibling interaction uses the shared invitation controller |
| puddles | Garden watering puddle; motion splash, jumping and fading prints | Puddle growth and garden movement tested; physical-device feel unverified |
| leaves | Actual garden tree patch; scatter, jump and directional rake | Rake/jump input passes; existing school-gate ball tests pass |
| plane | Marked paper folds into the same plane; two throw strengths | Mark retention, throw/recovery and reload pass |
| flamingo | Doorstep ornament; shared hat socket and wobble | Hat carry through exit and fitting pass |
| picnic | Shared Teddy, toy food, cups, cushions, bed and wagon | Shared cups, Teddy cargo and tea tested; no separate party quota |
| Blocks | Five stacking pieces, knockdown and cargo | Ownership/cycles and ball knockdown pass |
| Car/ramps | Carryable car and two ramps; push/release | Actual car roll from a physical ramp passes |
| Cushion den | Two independent play cushions and supported blanket | Cushion/blanket construction input passes |
| Crayons/paper | Four colors, accumulated marks, carry/display/fold | Marked plane and reload persistence pass |
| Picture book | Four illustrated pages and optional seated reading | Page changes, reading and standing input pass |
| Pretend tea | Pitcher shares bowling cups; short pour/fill/missed-pour effect | Shared cup pouring passes |
| Sunny fetch | Existing dog follows and returns the same reachable toy | Actual fetch/return passes without feeding credit |
| Sibling hide/find | Awake nearby Lilah searches for accessible shared toy | Teddy-in-wagon search and bubble-bottle sharing pass |
| Dad's dinner | Eight portions, pizza/taco/turkey, plate ownership, bites/drink, partial return/sink | All menu contacts pass; built-release reload/cancel/sink and used-save tests pass |
| Cafeteria lunch | Cook, main/fruit choices, one tray, two real stools and return rack | Touch journey, both seats, sandwich/orange, drink, partial tray and trading access pass |

Behavior checks: `scripts/home-play-state-test.mjs` covers carrying exclusion, wagon capacity/cycles, duplicate claims/contact, failed-write rollback, partial reload, lunch choice and day reset. Run with `node --experimental-transform-types --import ./scripts/test-register.mjs scripts/home-play-state-test.mjs`. Browser scripts use an isolated local preview; `home-play-vite.config.mjs` disables HMR to prevent edits interrupting live input sequences. Physical phone testing and observation with the child are unverified.
