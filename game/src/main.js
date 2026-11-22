// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, the renderer paints what is there, and the DOM HUD reports it. The game moves
// between four screens: plan, play, win and game over.
// ?shot=plan|play|caught|win (with &seed=N) stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { STAGES } from './stages.js';
import { ROUTES } from './routes.js';
import { THREAT_TYPES } from './patrols.js';
import { wantedLevel, alarmLabel } from './alarm.js';
import { createTools, useTool } from './tools.js';
import { CREW } from './crew.js';
import { createWorld, startStage, stepWorld, EVENT_LOOT, EVENT_SPOTTED, EVENT_STANDDOWN, EVENT_VAULT, EVENT_STAGE, EVENT_WIN, EVENT_LOST_LIFE, EVENT_OVER, EVENT_TOOL } from './world.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE } from './input.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

const audio = createAudio();
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const world = createWorld(seed);

let screen = 'plan';
let best = readBest();
let paused = false;
let routeId = 'main';
let tools = createTools();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}
function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}
function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function fmtMoney(n) {
  return `$${n.toLocaleString('en-US')}`;
}

function buildStaticPanels() {
  $('planStages').innerHTML = STAGES.map((s) => (
    `<div class="plan-row" data-stage="${s.index}"><span>${s.name} — ${s.briefing}</span><span class="tgt">target ${fmtMoney(s.lootTarget)}</span></div>`
  )).join('');
  $('planThreats').innerHTML = THREAT_TYPES.map((t) => (
    `<div class="threat"><span class="chip" style="background:${t.color}"></span><b>${t.type}</b><span>${t.behavior}</span></div>`
  )).join('');
  $('planTools').innerHTML = world.tools.map((t) => (
    `<div class="tool"><b>${t.name}</b><span class="cnt">×${t.count}</span><span class="cost">${t.costText}</span><span class="key">key ${t.key} — ${t.effect}</span></div>`
  )).join('');
  $('planRoutes').innerHTML = ROUTES.map((r) => (
    `<div class="route${r.id === routeId ? ' sel' : ''}" data-route="${r.id}"><b>${r.name}</b><span>${r.blurb}</span></div>`
  )).join('');
  $('railThreats').innerHTML = $('planThreats').innerHTML;
  $('railCrew').innerHTML = CREW.map((c) => `<div class="crew-line"><b>${c.name}</b> — ${c.role}</div>`).join('');
  document.querySelectorAll('#planRoutes .route').forEach((el) => {
    el.addEventListener('click', () => {
      routeId = el.dataset.route;
      document.querySelectorAll('#planRoutes .route').forEach((x) => x.classList.toggle('sel', x.dataset.route === routeId));
      audio.unlock();
    });
  });
  $('beginBtn').addEventListener('click', () => beginHeist());
  $('againBtn').addEventListener('click', () => showPlan());
  $('menuBtn').addEventListener('click', () => showPlan());
  $('retryBtn').addEventListener('click', () => showPlan());
  document.querySelectorAll('#railTools .tool, #planTools .tool').forEach((el, i) => {
    el.addEventListener('click', () => fireToolByIndex(i));
  });
}

function fireToolByIndex(index) {
  if (screen !== 'play' || paused) return;
  const tool = world.tools[index];
  if (!tool) return;
  const used = useTool(world.tools, tool.id, world);
  if (used) {
    audio.tool();
    world.popups.push({ x: world.thief.x, y: world.thief.y - 24, text: `${used.name}!`, ttl: 1.2 });
    world.radio = `${used.name} — ${used.effect}.`;
  }
}

function syncTools() {
  const rail = $('railTools');
  if (!rail.children.length) {
    rail.innerHTML = world.tools.map((t) => (
      `<div class="tool"><b>${t.name}</b><span class="cnt">×${t.count}</span><span class="cost">${t.costText}</span><span class="key">key ${t.key}</span></div>`
    )).join('');
    Array.from(rail.children).forEach((el, i) => el.addEventListener('click', () => fireToolByIndex(i)));
  }
  Array.from(rail.children).forEach((el, i) => {
    const t = world.tools[i];
    el.classList.toggle('used-up', t.count <= 0);
    el.querySelector('.cnt').textContent = `×${t.count}`;
  });
}

function syncPlanRail() {
  $('railPlan').innerHTML = STAGES.map((s, i) => {
    const cls = world.stageCleared[i] ? 'done' : i === world.stageIndex ? 'current' : '';
    const mark = world.stageCleared[i] ? '✓ ' : i === world.stageIndex ? '▶ ' : '· ';
    return `<div class="plan-row ${cls}"><span>${mark}${s.name}</span><span class="tgt">${fmtMoney(s.lootTarget)}</span></div>`;
  }).join('');
}

function updateHud() {
  const stage = STAGES[world.stageIndex];
  $('hudStage').textContent = stage.name;
  $('hudStageSub').textContent = `Loot target ${fmtMoney(stage.lootTarget)} · ${stage.briefing}`;
  $('hudLoot').textContent = fmtMoney(world.lootValue);
  $('hudLootSub').textContent = `of ${fmtMoney(stage.lootTarget)} target · ${world.loot.filter((l) => l.taken).length}/${world.loot.length} pieces`;
  $('hudTime').textContent = fmtTime(world.timeLeft);
  const pct = Math.round(world.alarm.value * 100);
  const fill = $('alarmFill');
  fill.style.width = `${pct}%`;
  fill.style.background = world.alarm.value > 0.85 ? '#e82a2a' : world.alarm.value > 0.6 ? '#ff8c42' : world.alarm.value > 0.25 ? '#e8b23a' : '#2fbf5a';
  $('hudAlarm').textContent = `${alarmLabel(world.alarm)} (${pct}%)`;
  const level = wantedLevel(world.alarm);
  $('wanted').textContent = '★'.repeat(level) + '☆'.repeat(5 - level);
  $('hudScore').textContent = world.score.toLocaleString('en-US');
  $('hudBest').textContent = `BEST ${best.toLocaleString('en-US')} · LIVES ${'♥'.repeat(world.lives)}${'♡'.repeat(Math.max(0, 3 - world.lives))}`;
  $('radio').textContent = `RADIO: ${world.radio}`;
  $('spotted').classList.toggle('show', world.alarm.spotted && screen === 'play');
  syncTools();
  syncPlanRail();
}

function showPlan() {
  screen = 'plan';
  world.won = false;
  world.over = false;
  world.lives = 3;
  world.score = 0;
  world.lootValue = 0;
  world.stageCleared = [false, false, false];
  world.tools = createTools();
  startStage(world, 0, routeId);
  $('planOverlay').classList.add('show');
  $('winOverlay').classList.remove('show');
  $('overOverlay').classList.remove('show');
  status.textContent = 'Velvet Vault. Plan the heist, then begin.';
  updateHud();
}

function beginHeist() {
  audio.unlock();
  world.lives = 3;
  world.score = 0;
  world.lootValue = 0;
  world.stageCleared = [false, false, false];
  world.tools = createTools();
  startStage(world, 0, routeId);
  screen = 'play';
  $('planOverlay').classList.remove('show');
  $('winOverlay').classList.remove('show');
  $('overOverlay').classList.remove('show');
  status.textContent = `Playing. ${STAGES[0].name}. ${STAGES[0].lootTarget} dollars of loot to the vault.`;
  updateHud();
}

function showWin() {
  screen = 'win';
  const newBest = world.score > best;
  if (newBest) {
    best = world.score;
    saveBest(best);
  }
  $('winLoot').textContent = fmtMoney(world.lootValue);
  $('winTime').textContent = fmtTime(world.timeUsed);
  $('winScore').textContent = world.score.toLocaleString('en-US');
  $('winBest').textContent = best.toLocaleString('en-US');
  $('newBest').style.display = newBest ? 'block' : 'none';
  $('winOverlay').classList.add('show');
  $('spotted').classList.remove('show');
  status.textContent = `The vault is yours. Score ${world.score}. Best ${best}.`;
  updateHud();
}

function showOver() {
  screen = 'over';
  $('overLoot').textContent = fmtMoney(world.lootValue);
  $('overScore').textContent = world.score.toLocaleString('en-US');
  $('overText').textContent = world.overReason || 'The alarm maxed out and the museum locked down.';
  $('overOverlay').classList.add('show');
  $('spotted').classList.remove('show');
  status.textContent = `The heist is blown. Score ${world.score}.`;
  updateHud();
}

function handleEvents(events) {
  if (events & EVENT_LOOT) audio.loot();
  if (events & EVENT_SPOTTED) audio.alarm();
  if (events & EVENT_VAULT) audio.vaultOpen();
  if (events & EVENT_TOOL) audio.tool();
  if (events & EVENT_STAGE) {
    status.textContent = `Stage cleared. ${STAGES[world.stageIndex].name}.`;
  }
  if (events & EVENT_LOST_LIFE) {
    audio.caught();
    status.textContent = `${world.overReason} ${world.lives} lives left.`;
  }
  if (events & EVENT_WIN) {
    audio.win();
    showWin();
  }
  if (events & EVENT_OVER) {
    audio.caught();
    showOver();
  }
}

function runShot(name) {
  buildStaticPanels();
  const staged = stageShot(name, seed);
  Object.assign(world, staged.world);
  world.tools = staged.world.tools;
  screen = staged.screen;
  if (staged.best) best = staged.best;
  if (screen === 'plan') {
    $('planOverlay').classList.add('show');
  } else {
    $('planOverlay').classList.remove('show');
  }
  if (screen === 'win') {
    $('winLoot').textContent = fmtMoney(world.lootValue);
    $('winTime').textContent = fmtTime(world.timeUsed);
    $('winScore').textContent = world.score.toLocaleString('en-US');
    $('winBest').textContent = staged.best.toLocaleString('en-US');
    $('newBest').style.display = staged.newBest ? 'block' : 'none';
    $('winOverlay').classList.add('show');
  }
  if (staged.spotted) $('spotted').classList.add('show');
  updateHud();
  let painted = 0;
  function paint() {
    renderer.draw(world, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  buildStaticPanels();
  showPlan();
  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.toggleMute();
    if (actions & ACTION_PAUSE && screen === 'play') {
      paused = !paused;
      world.radio = paused ? 'PAUSED — press P to resume.' : world.radio;
    }
    if (actions & ACTION_CONFIRM && (screen === 'plan' || screen === 'win' || screen === 'over')) {
      if (screen === 'plan') beginHeist();
      else showPlan();
    }
    if (screen === 'play' && !paused) {
      // Actions are consumed once per frame, however many fixed steps the frame runs.
      let pendingActions = actions;
      while (accumulator >= STEP) {
        // Re-inject the actions into the step's input view.
        const events = stepWorld(world, STEP, {
          direction: () => input.direction(),
          running: () => input.running(),
          takeActions: () => {
            const taken = pendingActions;
            pendingActions = 0;
            return taken;
          },
          takeClickTarget: () => input.takeClickTarget(),
          cracking: input.isHeld('KeyE'),
        });
        handleEvents(events);
        accumulator -= STEP;
        if (screen !== 'play') break;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, now / 1000);
    updateHud();
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
