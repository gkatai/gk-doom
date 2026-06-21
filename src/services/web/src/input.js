/** @typedef {'w' | 'a' | 's' | 'd'} MovementKey */
/** @type {Record<MovementKey, true>} */
const MOVEMENT_KEYS = { w: true, a: true, s: true, d: true };

/**
 * Attaches DOM event listeners for keyboard and mouse input.
 * All state is written directly into `model.input`.
 *
 * @param {import('./model.js').Model} model
 */
function init(model) {
  const { input } = model;

  document.addEventListener("keydown", (e) => {
    const key = /** @type {MovementKey} */ (e.key.toLowerCase());
    if (key in MOVEMENT_KEYS) {
      input[key] = true;
    }
  });

  document.addEventListener("keyup", (e) => {
    const key = /** @type {MovementKey} */ (e.key.toLowerCase());
    if (key in MOVEMENT_KEYS) {
      input[key] = false;
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (input.pointerLocked) {
      input.mouseDeltaX += e.movementX;
    }
  });

  document.addEventListener("pointerlockchange", () => {
    input.pointerLocked = document.pointerLockElement !== null;
    if (!input.pointerLocked) {
      // Reset keys on unlock to prevent stuck keys
      input.w = false;
      input.a = false;
      input.s = false;
      input.d = false;
      input.mouseDeltaX = 0;
    }
  });
}

export { init };
