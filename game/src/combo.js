// The combo: a streak of loot grabbed without being seen. Every grab in a row
// raises the chain, and the chain pays: the nth grab in a row is worth its loot
// plus 50 times (n - 1) — the first grab pays no chain bonus, the second pays
// +50, the third +100, and so on. Being spotted breaks the chain — the popup
// says so, and the HUD shows the chain live. A quiet thief is a rich thief.
import { COMBO_BONUS_STEP } from './config.js';

export function createCombo() {
  return { count: 0, best: 0, totalBonus: 0 };
}

// One unseen grab: the chain grows, and the bonus is 50 per link beyond the first.
export function addCombo(combo) {
  combo.count += 1;
  if (combo.count > combo.best) combo.best = combo.count;
  const bonus = (combo.count - 1) * COMBO_BONUS_STEP;
  combo.totalBonus += bonus;
  return bonus;
}

// The live multiplier on the HUD: ×1 with no chain, ×N once the chain is N long.
export function comboMultiplier(combo) {
  return Math.max(1, combo.count);
}

// Spotted: the chain snaps. Returns true when a chain actually broke.
export function breakCombo(combo) {
  if (combo.count <= 0) return false;
  combo.count = 0;
  return true;
}

export function comboLabel(combo) {
  return combo.count > 0 ? `COMBO ×${combo.count}` : 'COMBO —';
}

export function comboBonusText(combo, bonus) {
  return `+${bonus} COMBO ×${combo.count}`;
}
