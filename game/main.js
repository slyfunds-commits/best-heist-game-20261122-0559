// Velvet Vault round 2 — entry point. Wires the page to the world: the planning
// screen (mode select, route select, THREATS / TOOLS / CREW panels), the fixed-step
// loop, the HUD (MODE, SCORE, LOOT, LIVES, TIME, COMBO, NOISE, ALARM, BEST), the
// SPEND THE LOOT overlay between stages, and the full-screen win scorecard with
// the per-stage breakdown and the BEST per mode. BEST is saved per mode on this
// machine. Nothing here writes to the repo; it only reads the world and draws it.
import { createWorld, startStage, stepWorld, applyUpgrade } from './src/world.js';
import {
  EVENT_LOOT, EVENT_SPOTTED, EVENT_STANDDOWN, EVENT_VAULT,
  EVENT_STAGE, EVENT_WIN, EVENT_LOST_LIFE, EVENT_OVER, EVENT_TOOL, EVENT_BOSS,
} from './src/world.js';
import { createRenderer } from './src/render.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_CRACK, ACTION_TOOL1, ACTION_TOOL2, ACTION_TOOL3, ACTION_MUTE } from './src/input.js';
import { createAudio } from './src/audio.js';
import { THREAT_TYPES } from './src/patrols.js';
import { TOOLS } from './src/tools.js';
import { CREW } from './src/crew.js';
import { MODES, modeById } from './src/modes.js';
import { STAGES } from './src/stages.js';
import { comboMultiplier, comboBonusText } from './src/combo.js';
import { noiseLabel } from './src/noise.js';
import { alarmLabel, wantedLevel } from './src/alarm.js';
import { STEP, TIME_BONUS_PER_SEC } from './src/config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

let world = null;
let modeId = 'heist';
let routeId = 'main';
let screen = 'plan';
let paused = false;
let acc = 0;
let lastTime = 0;
let lastEvents = 0;

function bestKey(mode) {
  return `velvet-vault-best-${mode}`;
}
function loadBest(mode) {
  try {
    return Number(window.localStorage.getItem(bestKey(mode)) || 0) || 0;
  } catch {
    return 0;
  }
}
function saveBest(mode, score) {
  try {
    window.localStorage.setItem(bestKey(mode), String(score));
  } catch {
    /* storage unavailable — best is best-effort */
  }
}

function fillLists() {
  $('threat-list').innerHTML = THREAT_TYPES.map((t) => (
    `<li><b style="color:${t.color}">${t.type}</b> — ${t.behavior}</li>`
  )).join('');
  $('tool-list').innerHTML = TOOLS.map((t) => (
    `<li><b>${t.name}</b> <span class="tag">[${t.key}] ×${t.count} · ${t.costText}</span> — ${t.effect}</li>`
  )).join('');
  $('crew-list').innerHTML = CREW.map((c) => (
    `<li><b>${c.name}</b> — ${c.role}</li>`
  )).join('');
}

function setMode(id) {
  modeId = id;
  $('mode-heist').classList.toggle('selected', id === 'heist');
  $('mode-master').classList.toggle('selected', id === 'master');
  $('mode-heist').classList.toggle('secondary', id !== 'heist');
  $('mode-master').classList.toggle('secondary', id !== 'master');
  $('hud-best').textContent = loadBest(id);
  $('hud-mode').textContent = modeById(id).name;
}

function setRoute(id) {
  routeId = id;
  for (const r of ['main', 'vent', 'balcony']) {
    $(`route-${r}`).classList.toggle('selected', r === id);
    $(`route-${r}`).classList.toggle('secondary', r !== id);
  }
}

function show(id) {
  for (const s of ['plan', 'play', 'upgrade', 'win', 'over']) $(s).classList.add('hidden');
  $(id).classList.remove('hidden');
  screen = id;
}

function syncHud() {
  if (!world) return;
  $('hud-score').textContent = world.score;
  $('hud-loot').textContent = `$${world.lootValue}`;
  $('hud-lives').textContent = world.lives;
  $('hud-time').textContent = Math.ceil(world.timeLeft);
  $('hud-mode').textContent = world.mode.name;
  $('hud-combo').textContent = `×${comboMultiplier(world.combo)}`;
  $('hud-noise').style.width = `${Math.round(world.noise.value * 100)}%`;
  $('hud-alarm').style.width = `${Math.round(world.alarm.value * 100)}%`;
  $('alarm-label').textContent = `${alarmLabel(world.alarm)} · ${'★'.repeat(wantedLevel(world.alarm))} · ${noiseLabel(world.noise)}`;
  $('hud-best').textContent = Math.max(loadBest(world.mode.id), world.score);
  $('radio').textContent = world.radio;
}

function startRun() {
  world = createWorld(Date.now() % 2147483647, modeId);
  startStage(world, 0, routeId);
  paused = false;
  acc = 0;
  lastTime = performance.now();
  show('play');
  audio.unlock();
  syncHud();
  window.requestAnimationFrame(loop);
}

function showUpgrade() {
  const choices = world.upgradeChoices;
  $('upgrade-sub').textContent = `Room ${world.stageIndex + 1} cleared — loot so far $${world.lootValue}. The crew lays out what your haul buys.`;
  $('upgrade-cards').innerHTML = choices.map((u) => (
    `<div class="upgrade-card" data-id="${u.id}"><b>${u.name}</b><p>${u.blurb}</p></div>`
  )).join('');
  document.querySelectorAll('.upgrade-card').forEach((el) => {
    el.addEventListener('click', () => {
      const picked = applyUpgrade(world, el.dataset.id);
      if (!picked) return;
      $('hint').textContent = `Upgrade: ${picked.name} — ${picked.blurb}`;
      startStage(world, world.stageIndex + 1, routeId);
      show('play');
      syncHud();
    });
  });
  show('upgrade');
}

function showWin() {
  const best = loadBest(world.mode.id);
  const isBest = world.score > best;
  if (isBest) saveBest(world.mode.id, world.score);
  $('win-score').textContent = world.score;
  $('win-best').textContent = isBest
    ? '★ NEW BEST — the Aldermere will remember this night. ★'
    : `BEST for ${world.mode.name}: ${Math.max(best, world.score)}`;
  const rows = STAGES.map((stage, i) => (
    `<tr><td>${stage.name}</td><td>$${world.stageLoot[i]}</td><td>${world.stageCleared[i] ? 'CLEARED' : '—'}</td></tr>`
  )).join('');
  // Everything that is not raw loot or combo bonus — vault cracks, stage-clear
  // and time bonuses — is one line, computed so the breakdown adds up exactly.
  const other = Math.round(world.score / world.mode.scoreMult - world.lootValue - world.combo.totalBonus);
  $('win-breakdown').innerHTML = rows
    + `<tr><td>COMBO bonuses (best ×${world.combo.best})</td><td>$${world.combo.totalBonus}</td><td></td></tr>`
    + `<tr><td>Vault cracks + clear + time bonuses</td><td>$${other}</td><td></td></tr>`
    + `<tr><td><b>TOTAL</b></td><td><b>$${world.score}</b></td><td>${world.mode.scoreMult > 1 ? '×2 MASTER' : ''}</td></tr>`;
  $('win-mode').textContent = `Mode: ${world.mode.name} · ${world.mode.blurb} · ${Math.floor(world.timeUsed)}s on the job · ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left`;
  show('win');
}

function showOver() {
  $('over-reason').textContent = world.overReason || 'The night ended badly.';
  $('over-score').textContent = world.score;
  show('over');
}

function handleEvents(events) {
  if (events & EVENT_LOOT) audio.loot();
  if (events & EVENT_SPOTTED) { audio.alarm(); $('hint').textContent = 'SPOTTED — break line of sight!'; }
  if (events & EVENT_STANDDOWN) $('hint').textContent = 'You are clear. Slow and quiet from here.';
  if (events & EVENT_VAULT) { audio.vaultOpen(); $('hint').textContent = 'Vault open — get to the green exit!'; }
  if (events & EVENT_TOOL) audio.tool();
  if (events & EVENT_BOSS) audio.boss();
  if (events & EVENT_LOST_LIFE) { audio.caught(); $('hint').textContent = 'Caught! A life is gone — the room resets.'; }
  if (events & EVENT_OVER) { audio.caught(); showOver(); }
  if (events & EVENT_STAGE) showUpgrade();
  if (events & EVENT_WIN) { audio.win(); showWin(); }
}

function loop(now) {
  if (screen !== 'play') return;
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  const actions = input.takeActions();
  if (actions & ACTION_MUTE) {
    const muted = audio.toggleMute();
    $('hint').textContent = muted ? 'Sound off.' : 'Sound on.';
  }
  if (actions & ACTION_PAUSE) {
    paused = !paused;
    $('hint').textContent = paused ? 'Paused — press P to continue.' : 'Back to it.';
  }
  if (!paused && world && !world.won && !world.over && !world.upgradePending) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      const events = stepWorld(world, STEP, {
        direction: () => input.direction(),
        running: () => input.running(),
        takeActions: () => actions,
        cracking: input.isHeld('KeyE'),
        takeClickTarget: () => input.takeClickTarget(),
      });
      lastEvents = events;
      if (events) handleEvents(events);
      if (world.won || world.over || world.upgradePending) break;
    }
  }
  renderer.draw(world, now / 1000);
  syncHud();
  if (screen === 'play') window.requestAnimationFrame(loop);
}

fillLists();
setMode('heist');

// Test hook for the headless playtest: read the live world, start a run, and
// render the win/upgrade screens from a real world state. Harmless in play.
window.__velvetVault = {
  get world() { return world; },
  set world(w) { world = w; },
  get screen() { return screen; },
  startRun, setMode, setRoute, showWin, showUpgrade,
};
$('mode-heist').addEventListener('click', () => setMode('heist'));
$('mode-master').addEventListener('click', () => setMode('master'));
$('route-main').addEventListener('click', () => setRoute('main'));
$('route-vent').addEventListener('click', () => setRoute('vent'));
$('route-balcony').addEventListener('click', () => setRoute('balcony'));
$('start-btn').addEventListener('click', startRun);
$('again-btn').addEventListener('click', () => { setMode(modeId); show('plan'); });
$('retry-btn').addEventListener('click', () => { setMode(modeId); show('plan'); });
