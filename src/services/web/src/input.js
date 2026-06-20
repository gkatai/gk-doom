/** @type {Record<string, boolean>} */
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

let accumulatedDeltaX = 0;
let pointerLocked = false;

/**
 * @param {KeyboardEvent} e
 */
function onKeyDown(e) {
  const key = e.key.toLowerCase();
  if (key in keys) {
    keys[key] = true;
  }
}

/**
 * @param {KeyboardEvent} e
 */
function onKeyUp(e) {
  const key = e.key.toLowerCase();
  if (key in keys) {
    keys[key] = false;
  }
}

/**
 * @param {MouseEvent} e
 */
function onMouseMove(e) {
  if (pointerLocked) {
    accumulatedDeltaX += e.movementX;
  }
}

/**
 * Attaches DOM event listeners for keyboard and mouse input.
 * Call once at startup.
 */
function init() {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousemove", onMouseMove);

  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement !== null;
    if (!pointerLocked) {
      // Reset keys on unlock to prevent stuck keys
      for (const key in keys) {
        keys[key] = false;
      }
      accumulatedDeltaX = 0;
    }
  });
}

/**
 * Returns whether the given key is currently pressed.
 * @param {string} key - Key name, e.g. `'w'`, `'a'`
 * @returns {boolean}
 */
function getKey(key) {
  return !!keys[key.toLowerCase()];
}

/**
 * Returns the accumulated horizontal mouse movement since the last call, then resets to 0.
 * @returns {number}
 */
function consumeMouseDeltaX() {
  const delta = accumulatedDeltaX;
  accumulatedDeltaX = 0;
  return delta;
}

/**
 * Returns whether the Pointer Lock is currently active.
 * @returns {boolean}
 */
function isPointerLocked() {
  return pointerLocked;
}

export { init, getKey, consumeMouseDeltaX, isPointerLocked };
