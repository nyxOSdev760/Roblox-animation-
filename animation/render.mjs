// Renders a scene to an MP4 with its sound.
//
//   node render.mjs kick                     -> out/kick.mp4 (all frames in one go)
//   node render.mjs kick --stills 0,1.2      -> out/kick-stills/*.png (quick framing checks)
//   node render.mjs kick --scale 0.5         -> half-resolution draft
//   node render.mjs kick --audio-only        -> re-mix the sound onto the existing out/kick.mp4
//
// Long videos render in parts (10 s each) that can be resumed or redone one at a time:
//   node render.mjs story --parts            -> out/story-parts/part_000.mp4 ... (skips done parts)
//   node render.mjs story --parts --only 3,4 -> re-render just those parts
//   node render.mjs story --final            -> join the parts and mix the sound -> out/story.mp4
//
// Sound cues (meta.audio) are { file, at, volume, dur?, fade?, loop?, pitch? }: file is
// relative to assets/sfx, at is the start time in seconds, dur trims the sound, fade fades
// it out, loop repeats it and pitch shifts it by semitones without changing its timing.
import { createServer } from 'node:http';
import { readFile, mkdir, rm, rename, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SFX = join(REPO, 'assets', 'sfx');
const PART_SECONDS = 10;

const args = process.argv.slice(2);
const name = args[0] || 'kick';
const opt = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const scale = Number(opt('--scale') || 1);
const stillsArg = opt('--stills');
let stills = stillsArg && stillsArg !== 'shots' ? stillsArg.split(',').map(Number) : null;
const only = opt('--only')?.split(',').map(Number);

const { meta } = await import(`./scenes/${name}.js`);
const width = Math.round(meta.width * scale);
const height = Math.round(meta.height * scale);
const count = Math.round(meta.duration * meta.fps);
const outDir = join(HERE, 'out');
const out = join(outDir, `${name}.mp4`);
const partsDir = join(outDir, `${name}-parts`);
await mkdir(outDir, { recursive: true });

// Main profile, level 4.0 and a capped bitrate so phone players handle it (sound included).
const H264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'main', '-level', '4.0', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p'];

if (args.includes('--audio-only')) {
  const tmp = join(outDir, `${name}.remix.mp4`);
  encode(['-i', out], tmp, ['-c:v', 'copy']);
  await rename(tmp, out);
  console.log('re-mixed sound into', out);
} else if (args.includes('--final')) {
  const nParts = Math.ceil(count / (PART_SECONDS * meta.fps));
  const list = join(partsDir, 'list.txt');
  await writeFile(list, Array.from({ length: nParts }, (_, i) => `file '${join(partsDir, partName(i))}'\n`).join(''));
  // Parts rendered below full size (--scale) are scaled up to the scene's size here.
  const up = scale !== 1 ? ['-vf', `scale=${meta.width}:${meta.height}:flags=lanczos`, ...H264] : ['-c:v', 'copy'];
  encode(['-f', 'concat', '-safe', '0', '-i', list], out, up);
  console.log('wrote', out);
} else {
  await renderFrames();
}

function partName(i) {
  return `part_${String(i).padStart(3, '0')}.mp4`;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function renderFrames() {
  // Serve the repo so the page can load three.js, the Roblox assets, fonts and textures.
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf' };
  const server = createServer(async (req, res) => {
    const path = resolve(REPO, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!path.startsWith(REPO)) return res.writeHead(403).end();
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  // --items a,b,c is passed through to scenes that take a list (e.g. wardrobe).
  const items = opt('--items') ? `&items=${encodeURIComponent(opt('--items'))}` : '';
  const url = `http://127.0.0.1:${server.address().port}/animation/index.html?scene=${name}&frame=1&scale=${scale}${items}`;

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.sceneReady, null, { timeout: 120000 });

  const shoot = async (t, type = 'jpeg') => {
    await page.evaluate((t) => window.renderAt(t), t);
    return page.screenshot(type === 'png' ? { type, clip: { x: 0, y: 0, width, height } } : { type, quality: 92, clip: { x: 0, y: 0, width, height } });
  };
  const renderRange = async (from, to, dir) => {
    await mkdir(dir, { recursive: true });
    const started = Date.now();
    for (let i = from; i < to; i++) {
      await writeFile(join(dir, `${String(i - from).padStart(5, '0')}.jpg`), await shoot(i / meta.fps));
      if ((i - from) % 60 === 0) console.log(`frame ${i}/${count}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
  };

  if (stillsArg === 'shots') stills = await page.evaluate(() => window.sceneShots);
  if (stills) {
    const dir = join(outDir, `${name}-stills`);
    await mkdir(dir, { recursive: true });
    for (const [i, t] of stills.entries()) await writeFile(join(dir, stillsArg === 'shots' ? `shot${String(i).padStart(2, '0')}.png` : `${t.toFixed(2)}.png`), await shoot(t, 'png'));
    console.log('stills in', dir);
  } else if (args.includes('--parts')) {
    await mkdir(partsDir, { recursive: true });
    const per = PART_SECONDS * meta.fps;
    const nParts = Math.ceil(count / per);
    for (let p = 0; p < nParts; p++) {
      const dest = join(partsDir, partName(p));
      if (only ? !only.includes(p) : await exists(dest)) continue;
      const work = join(tmpdir(), `render-${name}-p${p}-${process.pid}`);
      await renderRange(p * per, Math.min(count, (p + 1) * per), work);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(meta.fps), '-i', join(work, '%05d.jpg'), ...H264, '-an', dest + '.tmp.mp4']);
      await rename(dest + '.tmp.mp4', dest);
      await rm(work, { recursive: true, force: true });
      console.log(`part ${p + 1}/${nParts} done`);
    }
  } else {
    const work = join(tmpdir(), `render-${name}-${process.pid}`);
    await renderRange(0, count, work);
    encode(['-framerate', String(meta.fps), '-i', join(work, '%05d.jpg')], out, H264);
    await rm(work, { recursive: true, force: true });
    console.log('wrote', out);
  }

  await browser.close();
  server.close();
}

// --- ffmpeg: video + sound cues -> mp4 ----------------------------------------------------
function encode(videoInput, dest, videoCodec) {
  const inputs = [...videoInput];
  const filters = [];
  meta.audio.forEach((cue, i) => {
    inputs.push('-i', join(SFX, cue.file));
    const ms = Math.round(cue.at * 1000);
    let chain = `[${i + 1}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${cue.volume}`;
    if (cue.loop) chain = `[${i + 1}:a]aloop=loop=-1:size=2e9,aresample=44100,aformat=channel_layouts=stereo,volume=${cue.volume}`;
    // pitch: semitones up (+) or down (-); the timing stays the same.
    if (cue.pitch) chain += `,rubberband=pitch=${2 ** (cue.pitch / 12)}:formant=shifted:pitchq=quality`;
    if (cue.dur) chain += `,atrim=0:${cue.dur}`;
    if (cue.fade) chain += `,afade=t=out:st=${(cue.dur ?? 0) - cue.fade}:d=${cue.fade}`;
    filters.push(`${chain},adelay=${ms}|${ms}[a${i}]`);
  });
  const mix = meta.audio.map((_, i) => `[a${i}]`).join('');
  filters.push(`${mix}amix=inputs=${meta.audio.length}:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,apad,atrim=0:${count / meta.fps}[aout]`);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[aout]',
    ...videoCodec,
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart',
    dest,
  ], { stdio: 'inherit' });
}
