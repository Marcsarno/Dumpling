Create a checkpoint/commit of the current working game before making any changes.
Build a new major gameplay event inside the existing game:
Squishy Pop is a polished 45–60 second arcade minigame that can be played when Arianna visits a participating squishy store.
The goal is to create the repeatable gameplay activity the game currently needs.
It should be extremely easy for a 7-year-old to understand but satisfying enough that she wants to immediately play another round.
Do not rebuild or redesign working parts of the existing game.
When Arianna reaches a participating squishy store, add a clear optional interaction:
PLAY SQUISHY POP
Transition smoothly from the existing 3D store into the minigame.
Prefer:
-  keep the store/game state loaded 
-  briefly dim/blur or visually transition away from the store 
-  Squishy Pop takes over most of the portrait screen 
-  returning from the game places Arianna back in the store exactly where expected 
Preserve:
-  money 
-  collection 
-  store inventory 
-  travel time 
-  current day/time 
-  characters 
-  all other game state 
Default round:
60 seconds
Board:
approximately 30–40 squishies
approximately 5–6 squishy types active at once.
Use a forgiving grid underneath, but make it visually feel like a tray/bin full of soft squishies rather than a spreadsheet.
Gameplay:
1.  Touch a squishy. 
2.  Drag through adjacent matching squishies. 
3.  Each valid squishy joins the chain. 
4.  Selected squishies glow/wobble/squish slightly. 
5.  A visible trail shows the connection. 
6.  Release finger. 
7.  Valid chain squashes/pops away. 
8.  Remaining pieces fall downward. 
9.  New pieces tumble in. 
10.  Player immediately looks for the next chain. 
Minimum valid chain:
3
Use 8-direction adjacency if it feels better on a phone:
-  up 
-  down 
-  left 
-  right 
-  diagonals 
A piece cannot normally appear twice in the same chain.
Allow the player to drag backward over the previous piece to undo the last selection.
Make touch targeting forgiving. Do not require pixel-perfect dragging.
This is NOT Candy Crush.
No swapping.
The mechanic is:
touch → drag → release → POP
This is the most important part.
Selected pieces should:
-  enlarge slightly 
-  compress/squish 
-  wobble 
-  glow/highlight 
-  react immediately to the finger 
On release:
-  quick squash 
-  spring/pop animation 
-  particles 
-  stars/hearts/sparkles 
-  score burst 
-  satisfying sound 
New pieces:
-  fall 
-  bounce 
-  settle quickly 
Avoid waiting.
The player should almost always be doing something.
Bigger chains should feel increasingly exciting.
Suggested feedback:
3–4
 normal pop
5–6
 NICE!
7–9
 GREAT!
10+
 SUPER SQUISH!
Larger chains should increase:
-  score 
-  particles 
-  animation strength 
-  sound intensity 
-  reward meter progress 
Very large chains can use a tiny camera punch/screen shake.
Keep it subtle enough that gameplay remains readable.
Build all of these for V1.
Created from a chain of approximately 5+.
Activating it clears nearby pieces.
Created from approximately 7+.
Can connect with any squishy type.
Make its purpose visually obvious without requiring reading.
Created from approximately 10+.
Clears a much larger area and should feel spectacular.
Strong chains made quickly fill a Frenzy meter.
When triggered for several seconds:
-  score multiplier increases 
-  music gains energy 
-  pieces bounce/react more 
-  particles increase 
-  gameplay feels faster 
Do not make Frenzy visually chaotic.
The board must never become permanently stuck.
If there are no valid chains:
-  briefly indicate it 
-  automatically shuffle the board 
-  animate the shuffle in a fun way 
Never punish the player for an impossible board.
Test board generation heavily.
Squishy Pop must feel connected to the existing collection.
Do not create a completely separate cast of random characters if the game already contains collectible squishies.
Prefer this order:
1.  existing collectible squishy models/assets 
2.  consistent renders/sprites created from those existing assets 
3.  newly generated art only when no existing asset is available 
If practical, automatically render each existing collectible from a consistent front/3-quarter camera to create its Squishy Pop board icon.
Keep:
-  identical proportions 
-  identical colors 
-  identical faces/accessories 
so the player immediately recognizes:
“That is MY Strawberry Dumpling.”
Squishies Arianna has discovered should become eligible for the board.
If the player has not discovered enough types yet, supplement the board with a small starter pool until more are unlocked.
Give duplicates a small useful connection to Squishy Pop.
Prototype:
first copy:
Unlocked
duplicates:
increase a simple Star Level.
Example:
Strawberry ★
 Strawberry ★★
 Strawberry ★★★
Star Levels should provide only small bonuses, such as slightly increased score/ticket contribution.
Do NOT create complicated character stats, equipment, or RPG systems.
The primary purpose of duplicates will still eventually include trading.
Squishy Pop should support the existing shopping loop, not replace it.
Add:
Squishy Tickets
Good rounds earn more tickets.
Ticket progress can eventually provide things like:
-  small store coupon 
-  bonus discount 
-  special-store token 
-  occasional bonus blind-box opportunity 
Keep all reward values configurable.
Do NOT make Squishy Pop generate so much money or so many boxes that chores, allowance, hunting, and shopping become irrelevant.
This should look like it belongs inside the existing game.
Preserve the established:
-  pastel aesthetic 
-  cute low-poly style 
-  rounded forms 
-  clean silhouettes 
-  child-friendly presentation 
Do not stop with developer-art circles and rectangles.
It is acceptable to use temporary visuals while proving gameplay, but this milestone is NOT complete until there is a dedicated visual polish pass.
Reuse existing game assets aggressively.
For squishies specifically, prefer creating consistent board sprites/renders from the actual collectible assets.
If image-generation tools are available, use them for supporting art where appropriate:
-  transparent particle sprites 
-  power-up symbols 
-  ticket icon 
-  combo graphics 
-  decorative board elements 
Do NOT generate replacement artwork that visually conflicts with existing collectible models.
Use transparent PNG/WebP when appropriate.
Actively search for good free licensed assets instead of recreating generic assets poorly.
This is especially encouraged for:
-  sound effects 
-  music 
-  particle textures 
-  UI sounds 
-  simple decorative graphics 
Prefer:
-  CC0 
-  public domain 
-  explicitly permitted free commercial-use assets 
Record:
-  asset 
-  source URL 
-  license 
in the existing asset manifest.
Do not use assets with unclear licensing.
Audio is part of the gameplay feel, not optional polish.
Add:
-  selection ticks 
-  subtle squeaks 
-  several randomized pop sounds 
-  combo escalation sounds 
-  Bomb sound 
-  Rainbow sound 
-  Mega Squish sound 
-  Frenzy trigger 
-  ticket/reward sound 
-  final 10-second warning 
-  round-end celebration 
Avoid repeating one identical pop hundreds of times.
Randomize several compatible sounds/pitches subtly.
Add light upbeat background music.
It should feel:
-  happy 
-  energetic 
-  playful 
-  not frantic 
During the final 10 seconds, increase urgency slightly.
During Frenzy, increase energy temporarily if practical.
Use no copyrighted commercial music.
Start:
3
2
1
POP!
During play show:
-  timer 
-  score 
-  ticket progress 
-  combo feedback 
Keep UI minimal and readable.
At 10 seconds remaining:
use clear visual/audio feedback.
At zero:
allow the current finger gesture to finish, then end the round.
Results should show:
-  score 
-  best chain 
-  tickets earned 
-  reward progress 
Buttons:
PLAY AGAIN
BACK TO STORE
Results should not become a long menu.
Intended player:
approximately seven years old.
Do not use paragraphs of instructions.
First play only:
show an animated finger connecting three matching squishies.
Text can simply say:
Drag through matching Squishies!
Then immediately let the player try.
There is no failure state.
Weak round:
still gives something.
Great round:
gives noticeably more.
Never display:
YOU LOSE
The motivation should be:
“I can beat my score / make a bigger chain / fill my ticket meter.”
Portrait mobile is the priority.
Maintain smooth gameplay on iPhone-class hardware.
Avoid unnecessarily expensive:
-  physics 
-  transparency 
-  particles 
-  dynamic lights 
-  huge textures 
Use tweens/animations rather than full physics when the result looks equally good.
Use pooling/reuse for frequently spawned objects/effects where appropriate.
Work through these passes in order:
-  dragging 
-  matching 
-  chain validation 
-  popping 
-  gravity 
-  refill 
-  timer 
-  scoring 
Play this repeatedly before proceeding.
The basic interaction must already feel satisfying.
-  Bomb 
-  Rainbow 
-  Mega Squish 
-  Frenzy 
-  store launch 
-  return-to-store 
-  collection integration 
-  duplicate stars 
-  tickets/rewards 
Replace temporary visuals.
Add:
-  real squishy art/renders 
-  squash/stretch 
-  bounce 
-  particles 
-  trail 
-  combo animations 
-  power-up presentation 
-  reward animations 
Complete sound and music treatment.
Test touch heavily.
Tune:
-  hit areas 
-  dragging forgiveness 
-  animation speed 
-  effect intensity 
-  frame rate 
Do not stop after Pass 1.
Complete all passes.
Before declaring Squishy Pop V1 complete, personally test multiple complete rounds.
Verify:
-  store launch works 
-  return to store works 
-  game state is preserved 
-  touch dragging feels forgiving 
-  backtracking works 
-  invalid chains behave correctly 
-  no accidental chain selection 
-  board cannot permanently deadlock 
-  refill works every time 
-  Bomb works 
-  Rainbow works 
-  Mega Squish works 
-  Frenzy works 
-  timer works 
-  scoring works 
-  tickets work 
-  collection integration works 
-  duplicate Star Levels work 
-  audio works 
-  music works 
-  particles/animations work 
-  replay works repeatedly 
-  portrait layouts work on intended phone sizes 
-  there are no browser-console errors 
-  repeated rounds do not create obvious memory/entity leaks 
Most importantly:
Do not judge success only by whether the code works.
Play the game.
If making a chain and releasing it does not feel satisfying, continue tuning:
-  animation timing 
-  squash/stretch 
-  sound 
-  vibration/haptics if already supported 
-  particles 
-  score feedback 
-  falling speed 
-  bounce 
until the basic action feels good.
The quality bar is:
A seven-year-old should understand what to do within seconds, enjoy dragging through squishies even before understanding the scoring system, and immediately want to try making a bigger chain.
STOP after Squishy Pop V1 is fully integrated, playable, visually polished, audibly polished, and tested.
Then report:
-  architecture 
-  board-generation rules 
-  power-up rules 
-  collection integration 
-  reward balance 
-  new assets and licenses 
-  mobile performance 
-  what you would improve in V2