// The painter: everything the judge sees of the museum is drawn here, procedurally,
// on one canvas. Marble floors, gold-trimmed walls, glowing loot, vision cones in
// amber and red, the thief in the dark. Safe cover, danger and loot are obvious at a
// glance: gold glows, red cones mean danger, green means the way out.
import { TILE, COLS, ROWS, CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE, CRACK_SECONDS } from './config.js';
import { STAGES, stageTileAt } from './stages.js';
import { conePoints } from './cones.js';
import { vaultReady, vaultPosition, exitPosition } from './loot.js';
import { THREAT_TYPES } from './patrols.js';

const WALL = '#2c2340';
const WALL_TOP = '#c9a227';
const FLOOR_A = '#1e1830';
const FLOOR_B = '#221b38';
const RUG = '#4a1f3d';

function hash(tx, ty) {
  let h = (tx * 374761393 + ty * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  return ((h * 1274126177) | 0) / 2147483647;
}

function threatColor(type) {
  return (THREAT_TYPES.find((t) => t.type === type) || { color: '#e8b23a' }).color;
}

function drawFloor(ctx, stage) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const tile = stageTileAt(stage, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (tile === '#') {
        ctx.fillStyle = WALL;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(x, y, TILE, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y + 3, TILE, 2);
        continue;
      }
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (tile === 'v') {
        ctx.fillStyle = '#0d0a18';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = '#5a4a7a';
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x + 6, y + i * 9);
          ctx.lineTo(x + TILE - 6, y + i * 9);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      } else if (tile === 'b') {
        ctx.fillStyle = '#3d2b1f';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#6b4a2a';
        ctx.beginPath();
        ctx.moveTo(x, y + TILE / 2);
        ctx.lineTo(x + TILE, y + TILE / 2);
        ctx.stroke();
      } else if (tile === 'S') {
        ctx.fillStyle = '#33284f';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#c9a227';
        ctx.font = 'bold 10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('STAIRS', x + TILE / 2, y + TILE / 2 + 4);
        ctx.textAlign = 'left';
      } else if (tile === 'D') {
        ctx.fillStyle = '#141021';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(180,220,255,0.16)';
        ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.strokeStyle = '#8fa8c8';
        ctx.strokeRect(x + 5.5, y + 5.5, TILE - 11, TILE - 11);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(x + 14, y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // A speck of marble veining, deterministic per tile.
      const h = hash(tx, ty);
      if (h > 0.72) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + h * 20);
        ctx.lineTo(x + TILE - 8, y + h * 20 + 6);
        ctx.stroke();
      }
    }
  }
  // A thin dark runner down the middle of the hall, under the loot — never a slab.
  ctx.fillStyle = '#241428';
  ctx.fillRect(10 * TILE, 2 * TILE, TILE, 12 * TILE);
  ctx.strokeStyle = 'rgba(201,162,39,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10 * TILE + 3, 2 * TILE + 3, TILE - 6, 12 * TILE - 6);
}

function drawPaintings(ctx, stage) {
  // Framed paintings hang on wall faces that border the floor.
  ctx.textAlign = 'center';
  for (let ty = 1; ty < ROWS - 1; ty += 1) {
    for (let tx = 1; tx < COLS - 1; tx += 1) {
      if (stageTileAt(stage, tx, ty) !== '#') continue;
      if (stageTileAt(stage, tx, ty + 1) === '.' && hash(tx, ty) > 0.45) {
        const x = tx * TILE;
        const y = ty * TILE;
        const palette = ['#7a4a2a', '#2a5a4a', '#4a2a5a', '#8a6a1a'];
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x + 6, y + TILE - 16, TILE - 12, 12);
        ctx.fillStyle = palette[Math.floor(hash(tx + 3, ty) * 4) % 4];
        ctx.fillRect(x + 8, y + TILE - 14, TILE - 16, 8);
      }
    }
  }
}

function drawVaultAndExit(ctx, world) {
  const stage = STAGES[world.stageIndex];
  const vault = vaultPosition(stage);
  const exit = exitPosition(stage);
  const ready = vaultReady(world.loot, stage.lootTarget);

  // Vault: a big gold door with a dial.
  ctx.save();
  ctx.translate(vault.x, vault.y);
  ctx.fillStyle = '#3a2f10';
  ctx.fillRect(-34, -34, 68, 68);
  ctx.fillStyle = ready ? '#c9a227' : '#6b5a2a';
  ctx.fillRect(-30, -30, 60, 60);
  ctx.strokeStyle = '#ffe9a3';
  ctx.lineWidth = 2;
  ctx.strokeRect(-30, -30, 60, 60);
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#1b1530';
  ctx.fill();
  ctx.strokeStyle = '#ffe9a3';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a3';
  ctx.font = 'bold 11px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(world.vaultOpen ? 'VAULT OPEN' : ready ? 'VAULT — HOLD E' : 'VAULT — LOCKED', 0, -42);
  if (!world.vaultOpen && ready && world.crackProgress > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + (world.crackProgress / CRACK_SECONDS) * Math.PI * 2);
    ctx.strokeStyle = '#7ddb8f';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  if (!ready) {
    ctx.fillStyle = '#ffb347';
    ctx.font = '11px Georgia';
    const need = stage.lootTarget - world.lootValue;
    ctx.fillText(`NEEDS $${Math.max(0, need)} MORE LOOT`, 0, 48);
  }
  ctx.restore();

  // Exit: the green door.
  ctx.save();
  ctx.translate(exit.x, exit.y);
  ctx.fillStyle = world.exitOpen ? '#1f7a3a' : '#2a4a2a';
  ctx.fillRect(-28, -20, 56, 40);
  ctx.strokeStyle = world.exitOpen ? '#7ddb8f' : '#5a7a5a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-28, -20, 56, 40);
  ctx.fillStyle = '#e8ffe8';
  ctx.font = 'bold 12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(world.exitOpen ? 'EXIT — OPEN' : 'EXIT — LOCKED', 0, 4);
  ctx.restore();
}

function drawLoot(ctx, world, time) {
  ctx.textAlign = 'center';
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.bobPhase) * 3;
    const glow = 18 + Math.sin(time * 3 + item.bobPhase) * 5;
    const grad = ctx.createRadialGradient(item.x, item.y + bob, 2, item.x, item.y + bob, glow);
    grad.addColorStop(0, 'rgba(255,215,94,0.55)');
    grad.addColorStop(1, 'rgba(255,215,94,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#fff3c8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
    ctx.fillStyle = '#ffe9a3';
    ctx.font = 'bold 10px Georgia';
    ctx.fillText(item.name, item.x, item.y + bob - 18);
    ctx.fillStyle = '#ffb347';
    ctx.font = '10px Georgia';
    ctx.fillText(`$${item.value}`, item.x, item.y + bob + 26);
  }
}

function drawCone(ctx, x, y, angle, range, halfAngle, color, dark) {
  const cone = conePoints({ x, y, angle, range, halfAngle });
  ctx.beginPath();
  ctx.moveTo(cone[0].x, cone[0].y);
  for (let i = 1; i < cone.length; i += 1) ctx.lineTo(cone[i].x, cone[i].y);
  ctx.closePath();
  ctx.fillStyle = dark ? 'rgba(80,80,90,0.10)' : color;
  ctx.fill();
}

function drawGuard(ctx, guard, world, stage) {
  const color = threatColor(guard.type);
  const sees = guard.state === 'chase';
  const blinded = world.smokeTimer > 0;
  const range = guard.type === 'DRONE' ? CAMERA_RANGE : CONE_RANGE;
  if (guard.type !== 'WRAITH') {
    drawCone(ctx, guard.x, guard.y, guard.angle, range, CONE_HALF_ANGLE,
      sees ? 'rgba(255,60,60,0.30)' : blinded ? 'rgba(120,120,130,0.08)' : 'rgba(232,178,58,0.16)',
      blinded);
  }
  ctx.save();
  ctx.translate(guard.x, guard.y);
  if (guard.type === 'WRAITH') {
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, 0, 16, 10);
  } else if (guard.type === 'DRONE') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c0a14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
    ctx.moveTo(0, -14); ctx.lineTo(0, 14);
    ctx.stroke();
  } else if (guard.type === 'HOUND') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.cos(guard.angle) * 10, Math.sin(guard.angle) * 10, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#7a1010';
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1530';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Facing tick + name tag.
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#f3e9c8';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y - 20);
  if (sees) {
    ctx.fillStyle = '#ff5a4e';
    ctx.font = 'bold 11px Georgia';
    ctx.fillText('!', guard.x, guard.y - 32);
  }
}

function drawCamera(ctx, camera, world) {
  const jammed = world.jammerTimer > 0;
  drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA_RANGE, CONE_HALF_ANGLE,
    jammed ? 'rgba(120,120,130,0.07)' : 'rgba(255,140,66,0.17)', jammed);
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = jammed ? '#5a5a6a' : '#ff8c42';
  ctx.beginPath();
  ctx.moveTo(10, -7);
  ctx.lineTo(16, 0);
  ctx.lineTo(10, 7);
  ctx.lineTo(-6, 5);
  ctx.lineTo(-6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#f3e9c8';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(jammed ? `${camera.name} — JAMMED` : camera.name, camera.x, camera.y - 20);
}

function drawThief(ctx, thief, world) {
  if (world.disguiseTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 120) * 0.1;
  }
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2140';
  ctx.fill();
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f3e9c8';
  ctx.fill();
  // Mask + facing.
  ctx.strokeStyle = '#1b1530';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x - 5, thief.y - 2);
  ctx.lineTo(thief.x + 5, thief.y - 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.angle) * 18, thief.y + Math.sin(thief.angle) * 18);
  ctx.stroke();
  if (world.disguiseTimer > 0) ctx.restore();
  ctx.fillStyle = '#ffe9a3';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(world.disguiseTimer > 0 ? 'YOU — DISGUISED' : 'YOU', thief.x, thief.y - 20);
}

function drawSmoke(ctx, world) {
  if (world.smokeTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  const grad = ctx.createRadialGradient(world.thief.x, world.thief.y, 10, world.thief.x, world.thief.y, 90);
  grad.addColorStop(0, '#cfc4d8');
  grad.addColorStop(1, 'rgba(207,196,216,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(world.thief.x, world.thief.y, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPopups(ctx, world) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Georgia';
  for (const popup of world.popups) {
    ctx.globalAlpha = Math.min(1, popup.ttl);
    ctx.fillStyle = '#7ddb8f';
    ctx.fillText(popup.text, popup.x, popup.y - (1.4 - popup.ttl) * 30);
  }
  ctx.globalAlpha = 1;
}

function drawRouteTags(ctx, stage) {
  ctx.textAlign = 'left';
  ctx.font = 'bold 10px Georgia';
  ctx.fillStyle = 'rgba(255,233,163,0.75)';
  ctx.fillText('VENT SHAFT', 2 * TILE + 4, 3 * TILE - 6);
  ctx.fillText('BALCONY', 14 * TILE + 4, TILE + 12);
  ctx.fillStyle = 'rgba(207,196,160,0.7)';
  ctx.fillText('MAIN FLOOR', TILE + 4, 15 * TILE - 8);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(world, time) {
      drawWorld(ctx, world, time);
    },
  };
}

export function drawWorld(ctx, world, time) {
  const stage = STAGES[world.stageIndex];
  ctx.clearRect(0, 0, 860, 640);
  drawFloor(ctx, stage);
  drawPaintings(ctx, stage);
  drawVaultAndExit(ctx, world);
  drawLoot(ctx, world, time);
  drawRouteTags(ctx, stage);
  for (const camera of world.cameras) drawCamera(ctx, camera, world);
  for (const guard of world.guards) drawGuard(ctx, guard, world, stage);
  drawThief(ctx, world.thief, world);
  drawSmoke(ctx, world);
  drawPopups(ctx, world);
  // Stage banner, top-left inside the canvas.
  ctx.fillStyle = 'rgba(12,10,20,0.72)';
  ctx.fillRect(0, 0, 300, 26);
  ctx.fillStyle = '#ffe9a3';
  ctx.font = 'bold 14px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`${stage.name}  —  ${stage.briefing}`, 10, 18);
}
