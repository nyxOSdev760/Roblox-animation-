// Renders a scene to an MP4 with its sound effects.
//
//   node render.mjs kick                 -> out/kick.mp4
//   node render.mjs kick --stills 0,1.2  -> out/kick-stills/*.png (quick framing checks)
//   node render.mjs kick --scale 0.5     -> half-resolution draft
//   node render.mjs kick --audio-only    -> re-mix the sound onto the existing out/kick.mp4
//
// Sound cues (meta.audio) are { file, at, volume, dur?, fade? }: file is relative to
// assets/sfx, at is the start time in seconds, dur trims the sound and fade fades it out.
import { createServer } from 'node:http';
import { readFile, mkdir, rm, rename, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SFX = join(REPO, 'assets', 'sfx');

const args = process.argv.slice(2);
const name = args[0] || 'kick';
const opt = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const scale = Number(opt('--scale') || 1);
const stills = opt('--stills')?.split(',').map(Number);
const audioOnly = args.includes('--audio-only');

const { meta } = await import(`./scenes/${name}.js`);
const width = Math.round(meta.width * scale);
const height = Math.round(meta.height * scale);
const count = Math.round(meta.duration * meta.fps);
const outDir = join(HERE, 'out');
const out = join(outDir, `${name}.mp4`);
await mkdir(outDir, { recursive: true });

if (audioOnly) {
  const tmp = join(outDir, `${name}.remix.mp4`);
  encode(['-i', out], tmp, ['-c:v', 'copy']);
  await rename(tmp, out);
  console.log('re-mixed sound into', out);
} else {
  await renderFrames();
}

async function renderFrames() {
  // Serve the repo so the page can load three.js, the Roblox assets and the face textures.
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
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
  const url = `http://127.0.0.1:${server.address().port}/animation/index.html?scene=${name}&frame=1&scale=${scale}`;

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.sceneReady, null, { timeout: 60000 });

  const frameAt = async (t) => {
    await page.evaluate((t) => window.renderAt(t), t);
    return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  };

  if (stills) {
    const dir = join(outDir, `${name}-stills`);
    await mkdir(dir, { recursive: true });
    for (const t of stills) await writeFile(join(dir, `${t.toFixed(2)}.png`), await frameAt(t));
    console.log('stills in', dir);
  } else {
    const work = join(tmpdir(), `render-${name}-${process.pid}`);
    await mkdir(work, { recursive: true });
    const started = Date.now();
    for (let i = 0; i < count; i++) {
      await writeFile(join(work, `${String(i).padStart(5, '0')}.png`), await frameAt(i / meta.fps));
      if (i % 15 === 0) console.log(`frame ${i}/${count}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
    encode(['-framerate', String(meta.fps), '-i', join(work, '%05d.png')], out, ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p']);
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
    if (cue.dur) chain += `,atrim=0:${cue.dur}`;
    if (cue.fade) chain += `,afade=t=out:st=${(cue.dur ?? 0) - cue.fade}:d=${cue.fade}`;
    filters.push(`${chain},adelay=${ms}|${ms}[a${i}]`);
  });
  const mix = meta.audio.map((_, i) => `[a${i}]`).join('');
  filters.push(`${mix}amix=inputs=${meta.audio.length}:normalize=0,alimiter=limit=0.95,apad,atrim=0:${count / meta.fps}[aout]`);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[aout]',
    ...videoCodec,
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    dest,
  ], { stdio: 'inherit' });
}
