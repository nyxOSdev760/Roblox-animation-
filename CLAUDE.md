# Roblox story Shorts

This repo makes 3D Roblox-style animated YouTube Shorts (1080x1920, ~45-65 s) for the owner's
channel: a voiced first-person story, word-by-word captions, sound effects, real Roblox look.
Rendered with three.js in headless Chromium (`animation/render.mjs`), voiced with Fish Audio.

## Owner's rules (always)

- **Never use agents/subagents or workflows.** Do the work inline.
- **Commit and push** everything (big MP4s in `animation/out/` are gitignored; send them instead).
- **Send finished videos** to the user with the SendUserFile tool (status `proactive` when unprompted).
- Clothing and hair: **only user-made items** already in `animation/assets/rbx/` (see each
  `CATALOG.md`). **No T-shirts, no revealing/crop tops, no brand or character logos, no spiky or
  goofy hair.** Known crop/revealing shirts to never use: `shirt-butterfly`, `shirt-avocado`,
  `shirt-sunflower-polo-preppy-cottage`, `shirt-thrifted-86-warhead-jersey`,
  `shirt-th-denim-jacket-floral`, `shirt-grey-button-up-undershirt`, `shirt-striped-crop-top`,
  `shirt-purple-cool-crop-top`. Check any new outfit with `scenes/closet.js` stills first.
- **Real skin tones** for every character (`SKIN` in `src/roblox.js`).
- **No background music** in the video: the owner adds "Feeling Blue" (Caleb Arredondo) in the
  YouTube app. Put a **"FAHHH"** (`assets/sfx/fahhh.mp3`, volume ~2.2) right after every punchline.
- Faces switch with the moment (shocked, blush, sweat, tears, anger mark, grin); the default is
  the relaxed half-smile.

## Story style (what works on this channel)

- **Crazy-rule hook that drops the viewer into a world**, first person:
  "In this world, every time you X, Y happens." (see `scripts/twinkletoes.md`, the 46K-view one).
  Then funny examples of life under the rule, then "Then there's me...", escalation, and a
  **twist punchline as the very last line**. End within ~0.6 s of the punchline: no wrap-up
  (retention drops at slow endings).
- ~180-200 words (~50-60 s). Short punchy sentences, ellipses for beats, quotes for dialogue.
- Audience is mostly 25-44; keep it clean and relatable. Never reuse an idea in `scripts/`.
- **The main character is always the "I"**: `MAIN` in `animation/src/cast.js`.

## Pipeline

```
python3 -I tools/narrate.py scripts/<story>.md assets/voice/<story> --voice 5355e61fa47849b4bac5a3417837eb58
python tools/align.py assets/voice/<story>      # needs faster-whisper, see below
cd animation
node render.mjs <story> --scale 0.4 --stills 1.0,2.5,...   # check framing (out/<story>-stills)
node render.mjs <story> --parts --scale 0.6667             # ~5 min per 10 s part
node render.mjs <story> --final --scale 0.6667             # -> out/<story>.mp4 (-14 LUFS)
node render.mjs <story> --audio-only                       # re-mix sound only
```

- Fish Audio: the proxy injects the key; model header `s2.1-pro-free`. The voice ID above is the
  "roblox rant" voice. ASR needs credit, so word timings come from local faster-whisper:
  `python3 -m venv /tmp/fw && /tmp/fw/bin/pip install -q faster-whisper` then
  `HF_HOME=/tmp/hf /tmp/fw/bin/python tools/align.py assets/voice/<story>`.
- Check every `W(line, word)` resolves: import the scene's `meta` in node (it throws on a bad word).

## Making a scene (`animation/scenes/<story>.js`)

Copy the structure of `scenes/icecream.js` (newest, cleanest): word timings via `W()`, `meta`
(faces, accessories, clothing, audio cues), places with origins, camera `KEYS` that glide inside
a place and dip to black between places, per-character functions posing by time.

- Sets: `src/rooms.js` has `buildClassroom` (+hallway, schoolyard), `buildBedroom` (night
  lights), `buildSchoolFront`, `iceCreamTruck`; `src/sets.js` has older ones. New sets go in
  `rooms.js`, built from many detailed parts and `bake()`d. Make them detailed (ceilings, trim,
  posters, clutter), never bare boxes.
- Characters: `Actor` from `src/actors.js` (`POSES`, `attach`/hold props). Pass hand props with
  `{ hold: [...] }` on placement (set() hides held props first). Physics (`src/physics.js`)
  runs automatically: arms avoid bodies and sets, follow-through springs.
- **Camera framing in a vertical frame:** a medium shot needs ~7 studs distance at fov ~40.
  Never put the camera inside or right behind a character; keep a clear lane in front of the
  main characters. Captions sit at y 0.67, so keep faces above that.
- Render stills across the whole video, look at them, fix framing, then render.

## Delivering

Send the MP4 plus, in the message: **Title** (with emoji), **Description** (2 lines + question +
`#roblox #robloxstory #robloxshorts #funny #storytime #shorts`), and a **pinned-comment** question.
Remind them to add "Feeling Blue" with Add sound at ~15% volume.
