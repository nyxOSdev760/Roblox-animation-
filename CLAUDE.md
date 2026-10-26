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
- **Background music: "Feeling Blue" (Caleb Arredondo)**, `assets/sfx/feeling-blue.mp3` (107 s),
  as one cue from 0 at volume 0.2 with `{ dur: END, fade: 1.2 }`. Put a **"FAHHH"**
  (`assets/sfx/fahhh.mp3`, volume ~2.2) right after every punchline.
- Faces switch with the moment (shocked, blush, sweat, tears, anger mark, grin); the default is
  the relaxed half-smile.

## Story style (what works on this channel)

- **Best performer: "I accidentally..." cringe stories.** `scripts/crush.md` ("I Accidentally
  Texted My Teacher...") hit **104K views in 48 h** (the channel's top Short, +273 subs, 57% of
  viewers 25-44). Shape: an embarrassing mistake in the first sentence, public humiliation that
  keeps escalating (the class laughs, a friend makes it worse, the evidence gets played out
  loud), a fake-out ("I have something to tell you..."), then an authority figure's twist line
  as the punchline. Thumbnail/title: the angry teacher face with the anger mark,
  "I Accidentally <did X>..." Alternate this format with the rule hook below.
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
node render.mjs <story> --parts --scale 0.6667             # ~6 min per 10 s part
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
  `rooms.js`, built from many detailed parts and `bake()`d (add shafts after baking). Make them detailed (ceilings, trim,
  posters, clutter), never bare boxes.
- Characters: `Actor` from `src/actors.js` (`POSES`, `attach`/hold props) builds **R15**
  characters (`src/r15.js`, Roblox's own R15 rig and clothing mapping; `src/r6.js` is only for
  old scenes). Poses take `neck, waist, rArm/lArm` (shoulders), `rElbow/lElbow` (x < 0 bends,
  then y swings the forearm across: right +, left -), `rWrist/lWrist`, `rLeg/lLeg`,
  `rKnee/lKnee` (x > 0 bends), `rAnkle/lAnkle`; joints left out rest (elbows slightly bent).
  When overriding an arm, set its elbow too, and bend knees ~85 when sitting. Check new poses
  on `scenes/posesheet.js` stills. Pass hand props with `{ hold: [...] }` on placement (set()
  hides held props first); they ride on the hand and follow the forearm. Physics
  (`src/physics.js`) runs automatically: arms avoid bodies and sets, follow-through springs.
- **Lighting** (`src/lighting.js`, `src/post.js`): realistic "Future"-style look with ambient
  occlusion, bloom on Neon, soft shadows and a filmic grade that keeps BrickColors true. Call
  `lightingMood(scene, sun, 'day' | 'interior' | 'sunset' | 'night')` per place. Indoors use
  `'interior'` and aim the sun through the windows (classroom windows face -x: sun at
  `o + (-70, 45, 18)`) for sun patches and light shafts. Lamps/ceiling panels are `fixture()`s
  (sets register them; the 6 nearest the camera get real lights; `.visible` switches them).
  New sets: walls and roofs cast shadows, glass doesn't, add fixtures for every lamp and
  `lightShaft()`s at sunny windows. `scenes/lighttest.js` shows every set; `--no-post` skips
  post-processing for quick framing checks.
- **Camera framing in a vertical frame:** a medium shot needs ~7 studs distance at fov ~40;
  a two-shot needs fov ~50 at ~8.5 studs with the pair ~2.2 studs apart. Cheat people who talk
  to each other ~40 degrees toward the camera (yaw 50 / -50 instead of 90 / -90) so both faces
  show, and centre the camera on the pair. `W(line, word)` takes the first match: pass `n` for a
  repeated word (`W(1, 'My', 1)`), or the cut lands on the wrong one.
  Never put the camera inside or right behind a character; keep a clear lane in front of the
  main characters. Captions sit at y 0.67, so keep faces above that.
- Render stills across the whole video, look at them, fix framing, then render.

## Delivering

Send the MP4 plus, in the message: **Title** (with emoji), **Description** (2 lines + question +
`#roblox #robloxstory #robloxshorts #funny #storytime #shorts`), and a **pinned-comment** question.
The music is already in the video: they just upload it.
