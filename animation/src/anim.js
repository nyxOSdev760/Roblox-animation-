// Keyframe animation in the style of Roblox's animation editor / Moon Animator.
//
// A track is a list of keys { t, v, style, dir } sorted by time. As in Roblox's
// KeyframeSequence, a key's easing style/direction controls the motion FROM that key to
// the next one. Values can be numbers or arrays of numbers (interpolated per element).

const { sin, cos, PI, sqrt, pow } = Math;

// Roblox Enum.EasingStyle, written as the "In" curve; Out and InOut are derived.
const IN = {
  Linear: (x) => x,
  Constant: () => 0,
  Sine: (x) => 1 - cos((x * PI) / 2),
  Quad: (x) => x * x,
  Cubic: (x) => x * x * x,
  Quart: (x) => x ** 4,
  Quint: (x) => x ** 5,
  Exponential: (x) => (x === 0 ? 0 : pow(2, 10 * x - 10)),
  Circular: (x) => 1 - sqrt(1 - x * x),
  Back: (x) => 2.70158 * x * x * x - 1.70158 * x * x,
  Elastic: (x) => (x === 0 || x === 1 ? x : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * ((2 * PI) / 3))),
  Bounce: (x) => 1 - bounceOut(1 - x),
};

function bounceOut(x) {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

export function ease(style = 'Linear', dir = 'Out', x) {
  if (style === 'Constant') return x < 1 ? 0 : 1;
  const f = IN[style] ?? IN.Linear;
  if (dir === 'In') return f(x);
  if (dir === 'Out') return 1 - f(1 - x);
  return x < 0.5 ? f(2 * x) / 2 : 1 - f(2 - 2 * x) / 2; // InOut
}

const mix = (a, b, u) =>
  Array.isArray(a) ? a.map((ai, i) => ai + (b[i] - ai) * u) : a + (b - a) * u;

/** Sample a track at time t. Before the first key / after the last key the value holds. */
export function sample(keys, t) {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < b.t) {
      const u = (t - a.t) / (b.t - a.t);
      return mix(a.v, b.v, ease(a.style, a.dir, u));
    }
  }
  return keys[keys.length - 1].v;
}

/**
 * Shorthand for writing keys: k(t, v, 'Quad', 'Out'). Style defaults to Sine/InOut, the
 * smooth default most Roblox animators use for body motion.
 */
export const k = (t, v, style = 'Sine', dir = 'InOut') => ({ t, v, style, dir });

/** Sample every track in { name: keys } at time t. */
export function sampleAll(tracks, t) {
  const out = {};
  for (const [name, keys] of Object.entries(tracks)) out[name] = sample(keys, t);
  return out;
}

/** Step function for things like face swaps: [[t, value], ...] -> latest value at time t. */
export function step(changes, t) {
  let v = changes[0][1];
  for (const [at, val] of changes) if (t >= at) v = val;
  return v;
}

export const deg = (d) => (d * PI) / 180;
