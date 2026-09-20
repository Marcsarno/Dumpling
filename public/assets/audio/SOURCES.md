# House music

Current playlist (both CC0):

- `sunny-house.mp3`: **Happy Ukelele Island Surfing Theme**, Tarush Singhal.
  https://opengameart.org/content/happy-ukelele-island-surfing-theme
  Source https://opengameart.org/sites/default/files/ukele.mp3
- `evening-house.mp3`: **Forget Me Not**, Kistol.
  https://opengameart.org/content/forget-me-not
  Source https://opengameart.org/sites/default/files/forget_me_not_in_f_major_looped.ogg

FFmpeg derivatives use loudnorm I=-23:TP=-3:LRA=7, 44.1kHz MP3 q5,
1.5-second opening fades, plus a two-second ending fade for the ukulele track.
Runtime volume ramps to 0.32, fades over the last three seconds, and waits
12 seconds before another track. Daytime alternates tracks; night uses piano.
Playback pauses outside house gameplay, during Pop/Tornado/developer pause,
and when hidden. Persistent mute uses its own key, independent of progress.

The original first-pass music below is retained as a source/backup, not played:

`cozy-house.ogg` is **relax_background1** by **joaquinton**, released under CC0.
Source: https://opengameart.org/content/relaxbackground1
Download: https://opengameart.org/sites/default/files/relax_background1_0.ogg
License: https://creativecommons.org/publicdomain/zero/1.0/

Original OGG retained; MP3 derivative created with FFmpeg for browser compatibility.
