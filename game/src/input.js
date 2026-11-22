// Keyboard + mouse input for Velvet Vault. WASD/arrows move, Shift runs, E cracks the
// vault, 1/2/3 fire tools, P pauses, M mutes, Space/Enter confirms. Click-to-walk sets a
// target tile the world steers toward. Actions are consumed once per frame.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_CRACK = 4;
export const ACTION_TOOL1 = 8;
export const ACTION_TOOL2 = 16;
export const ACTION_TOOL3 = 32;
export const ACTION_MUTE = 64;

const KEY_ACTIONS = {
  Space: ACTION_CONFIRM, Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyE: ACTION_CRACK,
  Digit1: ACTION_TOOL1, Digit2: ACTION_TOOL2, Digit3: ACTION_TOOL3,
  Numpad1: ACTION_TOOL1, Numpad2: ACTION_TOOL2, Numpad3: ACTION_TOOL3,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let clickTarget = null;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action) {
      actions |= action;
      event.preventDefault();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    clickTarget = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  function direction() {
    let x = 0;
    let y = 0;
    if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1;
    if (held.has('KeyD') || held.has('ArrowRight')) x += 1;
    if (held.has('KeyW') || held.has('ArrowUp')) y -= 1;
    if (held.has('KeyS') || held.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }
  function running() {
    return held.has('ShiftLeft') || held.has('ShiftRight');
  }
  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }
  function takeClickTarget() {
    const target = clickTarget;
    clickTarget = null;
    return target;
  }
  function isHeld(code) {
    return held.has(code);
  }
  return { direction, running, takeActions, takeClickTarget, isHeld };
}
