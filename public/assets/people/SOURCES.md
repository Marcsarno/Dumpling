# School people — CC0

- Creator: Quaternius.
- Official women pack (Worker, Casual): https://quaternius.com/packs/ultimatemodularwomen.html
- Official men pack (Casual_Hoodie, Casual_2): https://quaternius.com/packs/ultimatemodularcharacters.html
- License: CC0 1.0 Universal. Both official pack pages identify CC0. Included license text is the men's pack notice.
- Download mirror: https://github.com/agentkaerf/FreeModels (the official Google Drive downloads were quota limited).
- Original source paths: `Ultimate Modular Women - April 2022/Individual Characters/glTF/{Worker,Casual}.gltf`, `Ultimate Modular Men- Feb 2022/Individual Characters/glTF/{Casual_Hoodie,Casual_2}.gltf`.

Only the four selected characters are shipped. Converted to GLB with Blender; original skin, skeleton and mesh retained. Idle_Neutral, Wave and Interact are the only retained animations. Surface normals are smoothed. Runtime child height is 1.34–1.38 m before the slight head enlargement; clothes use the game's pastel palette. Seated animation tracks adapt the original legs/feet to the existing seats without changing Arianna or the room furniture. Ms Maple uses the actual Worker safety vest and helmet; her handheld paddle is original game geometry. Lunch cook reuses Casual_2 with light clothing and an original fitted chef cap.

Rebuild selected GLBs: `blender --background --python scripts/prepare-school-people.py`, with the four source glTFs in ignored `artifacts/npc-upgrade/source`.
