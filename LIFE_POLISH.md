# Family life and collecting polish — September 20, 2026

## Follow-up: remaining gaps completed locally

- Imported three CC0 Kenney classmates with seated poses, small greetings,
  names and daily wish signs. Trade help suggests an affordable willing offer
  using spare copies only; favorites, locks and last copies are excluded.
  The child reviews and accepts the deal through the existing atomic save path.
- House ·6 selects six of eleven existing chores and avoids an identical next
  task set. Bedroom ·5 and House ·6 randomize reachable floor locations on replay.
  Item homes/destinations and daily save records remain intact. Vacuum storage
  stays in laundry, and dirt is limited to living/kitchen candidates.
- Authored `SleepEnter` adds reach, raised knees, sitting and recline over
  3.2 seconds; continuous placement lifts Lilah over the crib rail. Existing
  CMU-derived resting flex follows. No original character GLBs were modified.
- Two quiet CC0 tracks replace the single active loop: daytime ukulele/piano
  and nighttime piano, volume fades and 12 seconds of space between repeats.
  Playback and levels are checked; subjective long-session enjoyment is not.

Classmate provenance: `public/assets/characters/classmates/SOURCES.md`.
Music and rest manifests below include the new sources and authored adaptations.

Requested scope: stable left running wrist; varied nearby chores; laundry vacuum
storage; visible standing rings; carry/serve/seated breakfast; room-to-room
Tornado; stronger Pop feedback; house music; two untimed shops; redeemable
tickets; classroom trading; distinct venue styling; roaming dog/pet chores;
bed/crib rest; remove Dad's chair footrest.

## Behavior and save compatibility

- Left running wrist is calibrated from the mirrored good right hand, then its
  local rotation is fixed throughout the run. The previous palm-direction test
  missed rotation around that direction. A new test checks all quaternion keys.
- Fresh days have two nearby vacuum sites, a changing spill site, one of toy /
  dish / laundry, and either feeding or the existing scoop/flush/wash chore.
  Legacy current-day task lists remain finishable. Next-day choices are stored;
  reload does not reroll them. Existing six dirt indices now map to living/kitchen.
- Vacuum storage is in the utility room. Rings are thicker and larger. The puppy
  strolls using HousePath collision clearance and waits for people/Tornado.
- Cooking attaches a plate and egg to the carry socket. Serve it at the table,
  then Eat breakfast plays a seated pose. Reload resumes an unserved plate at
  the stove, or preserves the served plate. Old `serve` saves remain eatable.
- Tornado prioritizes a different room and varies mess types, with bounded
  outstanding messes and the existing reward/cleanup loop.
- Chains of 5+ have a bigger banner/chime; 8+ use a super banner/fanfare. Rainbow
  activations have a spectrum banner, glow, ribbons and rising scale. Existing
  board/power thresholds remain intact; mute and reduced-motion remain honored.
- Stores no longer advance the clock or close on a timer. Visit two distinct
  stores per day; the second can be reached directly. Saved visited flags enforce
  the limit through refresh. Paid boxes, stock and collection receipts stay intact.
- Tickets are not automatically spent on a coupon. Four named prizes rotate
  daily, one of each, at 1/3/5/8 tickets. First prize is attainable after any
  completed round. Stock, deduction and collection award share one save write.
  Existing tickets retain their value; no reset, expiry or cash conversion.
- School trading is now indoors with three classmates seated at desks and
  classroom props. Original trading protections, negotiation and limits remain.
  School terrazzo, Clover tiles, Peachy checker and Moonbeam carpet are distinct
  from the house floors; shared fixtures use venue-specific finishes.
- Bedtime shows Arianna lying on her bed before morning. Lilah goes to her crib
  at night and lies down. Source and adaptation limits are documented alongside
  the motion JSON. Dad's existing chair has only its footrest removed; height,
  placement and his original seated animation remain unchanged.

Art/audio provenance: `public/assets/environment/school/sources.json`,
`public/assets/audio/SOURCES.md`, `public/assets/animations/rest/SOURCES.md`.
No real browser storage is used by tests. Publishing requires user authorization.

## Verification

Passing unit checks cover old saves, atomic prize purchase/failure,
finite stock, two-visit persistence, varied chores, and fixed wrist rotation.
Phone playthrough and visual checks are in `scripts/life-*-browser.mjs`;
screenshots/reports are saved under ignored `artifacts/life-polish/`.

TypeScript and the production build pass. See TESTING.md for the full checks and
limitations. Dad's original seat scale/position is retained; the extra upright
decorative pillow on Arianna's bed was removed so it cannot obscure her resting
body. Existing main bed pillow and other bedroom furniture remain.
