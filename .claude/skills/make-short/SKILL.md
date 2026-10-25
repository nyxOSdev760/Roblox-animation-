---
name: make-short
description: Make one Roblox story YouTube Short for the owner's channel end to end (story, voice, animation, render, deliver). Use when the user says make a short, make a video, make today's story, or runs /make-short. Optional argument - a story idea or an existing scripts/<slug>.md to animate.
---

# Make a Roblox story Short

Read `CLAUDE.md` in the repo root first: it holds the owner's rules (no agents, user-made outfits,
no crop tops/logos, real skin tones, main character, Feeling Blue music, FAHHH, framing) and the
pipeline commands. Follow it exactly. Keep tool calls lean: the owner pays per use.

## Steps

1. **Story.** If the argument names `scripts/<slug>.md`, use it. Otherwise write a new one there:
   "In this world, every time you X, Y happens." hook, funny examples, "Then there's me...",
   escalation, twist punchline as the last line, ~180-200 words, never an idea already in
   `scripts/`. Show the script to the user and wait for an OK unless they said to just go.
2. **Setup (fresh container only).** `cd animation && npm install` if `node_modules` is missing;
   `python3 -m venv /tmp/fw && /tmp/fw/bin/pip install -q faster-whisper` if `/tmp/fw` is missing.
3. **Voice + timings.**
   `python3 -I tools/narrate.py scripts/<slug>.md assets/voice/<slug> --voice 5355e61fa47849b4bac5a3417837eb58`
   then `HF_HOME=/tmp/hf /tmp/fw/bin/python tools/align.py assets/voice/<slug>`.
   Print the word timings once (line: word@time) to plan shots.
4. **Scene.** Write `animation/scenes/<slug>.js` by copying the structure of
   `animation/scenes/icecream.js`: `W()` timings, `meta` (faces, accessories, clothing, audio),
   cast with `MAIN` from `src/cast.js` as "me", sets from `src/rooms.js` (add new detailed baked
   sets there when needed), camera `KEYS` gliding within a place and dipping to black between
   places, situational faces, hand props via `{ hold: [...] }`, audio cues (Feeling Blue 0.2 from
   0, FAHHH ~2.2 after punchlines, sound effects), `END = last word end + 0.6`.
   Validate: `node -e "import('./scenes/<slug>.js').then(m=>console.log(m.meta.duration))"` in animation/.
5. **Check framing.** `node render.mjs <slug> --scale 0.4 --stills <~14 times across the video>`,
   tile them (ffmpeg `tile=7x2`) and look. Fix: camera inside/behind someone, faces under the
   caption line (y 0.67), shots too tight (~7 studs at fov 40 for a medium shot), props hidden,
   revealing clothes. Re-check only the shots you changed.
6. **Render.** `node render.mjs <slug> --parts --scale 0.6667` in the background (wait for it to
   exit, don't poll with sleep), then `node render.mjs <slug> --final --scale 0.6667`.
   Check duration and loudness (~-14 LUFS) and one contact sheet.
7. **Save.** Commit and push to master (the MP4 is gitignored).
8. **Deliver.** SendUserFile the MP4 with, in the message: Title (with emoji), Description
   (2 lines + question + `#roblox #robloxstory #robloxshorts #funny #storytime #shorts`), and a
   pinned-comment question. Music is already in the video.

If something fails, send what exists and say exactly what failed.
