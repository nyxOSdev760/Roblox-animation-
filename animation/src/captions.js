// One-word-at-a-time captions over the video, like Roblox story Shorts: big white
// Montserrat Black with a thick black outline. Drawn as a DOM layer above the canvas, so
// the renderer's screenshots include it.

/**
 * @param {Array<{word: string, start: number, end: number}>} words  from tools/align.py
 * @param {object} [o]
 * @param {number} [o.y]        vertical centre as a fraction of the frame height
 * @param {number} [o.size]     font size as a fraction of the frame width
 * @param {number} [o.maxHold]  longest a word stays up during a pause (seconds)
 * @param {(t: number) => number} [o.yAt]  vertical position over time (overrides y)
 */
export function createCaptions(words, { y = 0.6, size = 0.115, maxHold = 0.9, yAt = null } = {}) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed',
    left: '0',
    width: '100vw',
    top: `${y * 100}vh`,
    transform: 'translateY(-50%)',
    textAlign: 'center',
    fontFamily: '"Montserrat Black", sans-serif',
    fontSize: `${size * 100}vw`,
    color: '#ffffff',
    WebkitTextStroke: `${size * 100 * 0.16}vw #000`,
    paintOrder: 'stroke fill',
    textShadow: `0 ${size * 100 * 0.06}vw 0 rgba(0,0,0,0.85)`,
    letterSpacing: '0.01em',
    lineHeight: '1',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(el);

  // Clean each word for display: keep inner punctuation like "Mr." and "that's", drop
  // quotes; long words are fine on one line at this size.
  const shown = words.map((w) => ({
    text: w.word.replace(/^["“”']+|["“”]+$/g, '').replace(/[,;:]+$/g, ''),
    start: w.start,
  }));
  for (let i = 0; i < shown.length; i++) {
    const next = shown[i + 1]?.start ?? shown[i].start + maxHold;
    shown[i].end = Math.min(next, shown[i].start + Math.max(maxHold, 0.15));
  }

  let i = 0;
  return function update(t) {
    if (yAt) el.style.top = `${yAt(t) * 100}vh`;
    // Words are sorted; walk from the last position (renders go forwards, stills may jump).
    if (i >= shown.length || shown[i].start > t) i = 0;
    while (i + 1 < shown.length && shown[i + 1].start <= t) i++;
    const w = shown[i];
    const on = w && t >= w.start && t < w.end;
    el.textContent = on ? w.text : '';
    // Fit long words to the frame width.
    el.style.fontSize = `${Math.min(size, 0.92 / Math.max(1, w ? w.text.length : 1) / 0.62) * 100}vw`;
  };
}
