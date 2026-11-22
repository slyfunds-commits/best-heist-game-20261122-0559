// The three rooms of the Aldermere, each with its own look inside the same
// dark-navy and gold night. The Lobby is marble and red carpet; the Gallery is
// paintings in four loud colours behind glass; the Vault is gold, crown jewels
// and chandeliers — and the Curator walking his loop around the vault. The maps
// are 21x16 grids: '#' wall, '.' floor, 'v' vent (thief only), 'b' balcony
// (thief only), 'S' stairs, 'X' the vault, 'E' the exit, 'T' the front door,
// 'D' a display case (blocks movement). 'C', 'G' and 'L' are markers only —
// guards, cameras and loot come from the lists, so a stray letter can never
// break the game. Rows are padded or cut to 21 on load.
//
// Every map keeps the round-1 layout rules, checked by flood fill in the
// playtest: three chambers split by walls at col 6 and col 13, a main-floor
// door and thief-only vent doors, balcony stairs at row 2, every loot tile,
// the vault and the exit reachable from the thief spawn, and every guard
// waypoint's straight lines running through floor only.
import { TILE } from './config.js';

function normalizeMap(rows) {
  return rows.map((row) => {
    const clean = row.replace(/[CGL]/g, '.');
    return (clean + '#'.repeat(21)).slice(0, 21);
  });
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export const STAGES = [
  {
    index: 0,
    name: 'I · The Lobby',
    short: 'The Lobby',
    lootTarget: 1200,
    timeLimit: 180,
    briefing: 'Marble, red carpet, two patrollers. Learn the cones.',
    look: {
      floorA: '#241d33', floorB: '#2a2140', wall: '#332847', rug: '#5a1f3d',
      rugTrim: '#c9a227', painting: ['#7a4a2a', '#2a5a4a', '#4a2a5a', '#8a6a1a'],
      prop: 'busts',
    },
    map: normalizeMap([
      '#####################',
      '#T....#......#bbbbbb#',
      '#.....#..D...Sbbbbbb#',
      '#.v...v......#......#',
      '#.v...v..L...#..D...#',
      '#.v.D.#......#......#',
      '#.v...#..L...#......#',
      '#.v...#####.###..E..#',
      '#............#......#',
      '#..L..#..D...#..L...#',
      '#.....#.............#',
      '#..D..#......#.###..#',
      '#.....#..G...#......#',
      '#..C..#......#...X..#',
      '#.....#......#......#',
      '#####################',
    ]),
    loot: [
      { name: 'GILDED MASK', value: 400, tx: 10, ty: 4 },
      { name: 'JADE SCARAB', value: 350, tx: 10, ty: 6 },
      { name: 'SILVER CHALICE', value: 250, tx: 3, ty: 9 },
      { name: 'MOON PEARL', value: 300, tx: 16, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'MARLOW', waypoints: [[8, 3], [11, 3], [11, 6], [8, 6]] },
      { type: 'PATROLLER', name: 'BRYN', waypoints: [[17, 4], [17, 9], [19, 9], [19, 4]] },
    ],
    cameras: [
      { name: 'CAM-1', tx: 6, ty: 13, angle: 0, sweep: 0.6 },
    ],
    vault: { tx: 17, ty: 13 },
    exit: { tx: 17, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
  {
    index: 1,
    name: 'II · The Gallery',
    short: 'The Gallery',
    lootTarget: 2400,
    timeLimit: 150,
    briefing: 'Four loud paintings, a hound, a drone, two cameras.',
    look: {
      floorA: '#1c2438', floorB: '#202a44', wall: '#2c3350', rug: '#1f3d33',
      rugTrim: '#7ddb8f', painting: ['#c94a2a', '#2a7a8a', '#8a2a6a', '#d8a41a'],
      prop: 'cases',
    },
    map: normalizeMap([
      '#####################',
      '#T....#......#bbbbbb#',
      '#..D..#..L...Sbbbbbb#',
      '#.v...v..##..#......#',
      '#.v...v......#......#',
      '#.v..#.##.##.#......#',
      '#....#.#....#.#.....#',
      '#.##.#.#.##.#.##..E.#',
      '#............#......#',
      '#.L..#.#.L..#.#..L..#',
      '#.....#.............#',
      '#.D..###.##.###..D..#',
      '#....#......#.......#',
      '#..C.#..G...#...X...#',
      '#....#......#.......#',
      '#####################',
    ]),
    loot: [
      // The Sunflower Canvas sits at (5,2), clear of KETTLE's patrol square
      // (cols 8–11, rows 2–4): at (9,2) the guard's name printed on top of the
      // painting's name whenever he crossed the top of his loop.
      { name: 'SUNFLOWER CANVAS', value: 600, tx: 5, ty: 2 },
      { name: 'RUBY CROWN', value: 700, tx: 18, ty: 4 },
      { name: 'IVORY CHESS SET', value: 500, tx: 8, ty: 9 },
      { name: 'GOLDEN LYRE', value: 600, tx: 16, ty: 9 },
      { name: 'OPAL MASK', value: 400, tx: 3, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'KETTLE', waypoints: [[8, 2], [11, 2], [11, 4], [8, 4]] },
      { type: 'PATROLLER', name: 'SABLE', waypoints: [[16, 4], [16, 9], [19, 9], [19, 4]] },
      { type: 'HOUND', name: 'REX', home: [12, 8] },
      { type: 'DRONE', name: 'WASP-7', home: [9, 6], dir: 0 },
    ],
    cameras: [
      { name: 'CAM-2', tx: 12, ty: 13, angle: 0, sweep: 0.6 },
      { name: 'CAM-3', tx: 14, ty: 6, angle: Math.PI / 2, sweep: 0.7 },
    ],
    vault: { tx: 16, ty: 13 },
    exit: { tx: 18, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
  {
    index: 2,
    name: 'III · The Vault',
    short: 'The Vault',
    lootTarget: 3600,
    timeLimit: 120,
    briefing: 'Gold, crown jewels — and THE CURATOR walking his loop.',
    look: {
      floorA: '#2e2410', floorB: '#332a14', wall: '#4a3a10', rug: '#6b4a10',
      rugTrim: '#ffe9a3', painting: ['#ffd75e', '#ff8c42', '#ffe9a3', '#c9a227'],
      prop: 'chandeliers',
    },
    map: normalizeMap([
      '#####################',
      '#T..#....#...#bbbbbb#',
      '#...#..L.#...Sbbbbbb#',
      '#.v...v..##..#......#',
      '#.v...v......#..D...#',
      '#.v..#.##.##.#..##..#',
      '#....#.#..#...#.....#',
      '#.###.#.####.###.E..#',
      '#............#......#',
      '#.L..#.#.L..#.#..L..#',
      '#.....#.............#',
      '#.D..###.##.###..D..#',
      '#....#......#.......#',
      '#..C.#..G...#...X...#',
      '#....#......#.......#',
      '#####################',
    ]),
    loot: [
      { name: 'CROWN JEWELS', value: 1200, tx: 7, ty: 2 },
      { name: 'STAR SAPPHIRE', value: 900, tx: 18, ty: 4 },
      { name: 'DRAGON EGG', value: 800, tx: 8, ty: 9 },
      { name: "PHARAOH'S MASK", value: 700, tx: 16, ty: 9 },
      { name: 'VELVET DIAMOND', value: 800, tx: 3, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'VOSS', waypoints: [[8, 8], [11, 8], [11, 12], [8, 12]] },
      { type: 'PATROLLER', name: 'MARLOW', waypoints: [[16, 6], [16, 9], [19, 9], [19, 6]] },
      { type: 'HOUND', name: 'FANG', home: [12, 8] },
      { type: 'WRAITH', name: 'SHADE', home: [8, 6] },
      { type: 'DRONE', name: 'HORNET-2', home: [11, 4], dir: Math.PI },
    ],
    cameras: [
      { name: 'CAM-4', tx: 12, ty: 13, angle: 0, sweep: 0.6 },
      { name: 'CAM-5', tx: 14, ty: 6, angle: Math.PI / 2, sweep: 0.7 },
      { name: 'CAM-6', tx: 14, ty: 11, angle: Math.PI, sweep: 0.6 },
    ],
    boss: {
      name: 'THE CURATOR',
      waypoints: [[14, 12], [18, 12], [18, 14], [14, 14]],
    },
    vault: { tx: 16, ty: 13 },
    exit: { tx: 17, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
];

export function stageName(index) {
  return STAGES[index].name;
}
export function stageLootTarget(index) {
  return STAGES[index].lootTarget;
}
export function stageTimeLimit(index) {
  return STAGES[index].timeLimit;
}
export function stageTileAt(stage, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 21 || ty >= 16) return '#';
  return stage.map[ty][tx];
}
export function stageTileCenter(tx, ty) {
  return tileCenter(tx, ty);
}
export { tileCenter };
