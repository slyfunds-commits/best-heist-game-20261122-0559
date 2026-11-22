// A tiny seeded RNG (mulberry32). One seed makes a whole run reproducible —
// the upgrade draw, the screenshot staging — while live play takes a fresh
// random seed each time. No other file keeps its own randomness.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  return { next, range, pick };
}
