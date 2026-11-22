// The three stages of the heist: I · The Lobby, II · The Gallery, III · The Vault.
// Each map is a 21x16 grid: '#' wall, '.' floor, 'v' vent shaft (thief only),
// 'b' balcony (thief only), 'S' stairs up to the balcony, 'X' the vault, 'E' the exit,
// 'T' the main-floor entry, 'D' a display case (blocks movement), 'C'/'G'/'L' are
// markers only — guards, cameras and loot come from the lists below, so a miscounted
// letter can never break the game. Rows are padded/truncated to 21 on load.
//
// Layout rules every map follows (checked by flood fill in the playtest):
// - three chambers (left / middle / right) split by walls at col 6 and col 13;
// - the col-6 wall has a main-floor door at row 8 and thief-only vent doors at rows 3-4;
// - the col-13 wall has the balcony stairs at row 2 and a main-floor door at row 10;
// - every loot tile, the vault and the exit are reachable from the thief spawn;
// - every guard waypoint's straight lines run through floor only, never a wall.
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
    briefing: 'The front hall. Two patrollers, one camera. Learn the cones.',
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
    briefing: 'Paintings worth dying for. A hound, a drone, two cameras.',
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
      { name: 'SUNFLOWER CANVAS', value: 600, tx: 9, ty: 2 },
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
    briefing: 'The crown jewels. Everything the museum has — and a wraith.',
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
